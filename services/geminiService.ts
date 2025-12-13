import { GoogleGenAI } from "@google/genai";
import { ModelId, GenerationConfig, Resolution, AspectRatio } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface GenerateImageResult {
  url: string;
  modelId?: ModelId;
}

export const generateImage = async (config: GenerationConfig): Promise<GenerateImageResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const { modelId, prompt, aspectRatio, resolution, perspective, lighting, lens, focalLength, globalStyle, negativePrompt, styleReferenceImage, seed } = config;

  // Construct enhanced prompt with perspective and global style
  let fullPrompt = prompt;

  if (globalStyle && globalStyle.trim()) {
    fullPrompt = `${fullPrompt}, style: ${globalStyle}`;
  }

  if (perspective && perspective !== 'None') {
    fullPrompt = `${perspective} shot of ${fullPrompt}`;
  }

  if (lighting && lighting !== 'None') {
    fullPrompt = `${fullPrompt}, ${lighting} lighting`;
  }

  if (lens && lens !== 'None') {
    fullPrompt = `${fullPrompt}, shot with ${lens} lens`;
  }
  
  if (focalLength && focalLength !== 'None') {
    fullPrompt = `${fullPrompt}, focal length ${focalLength}`;
  }

  // Append negative prompt instructions if present
  if (negativePrompt && negativePrompt.trim()) {
    fullPrompt = `${fullPrompt}. Do not include: ${negativePrompt}`;
  }

  try {
    // 1. Imagen Models
    if (modelId === ModelId.IMAGEN_4) {
      // Use generateImages for Imagen models
      // Note: Current Imagen 3 preview in SDK generateImages does not support multi-part input easily.
      // Ignoring styleReferenceImage for now.
      const response = await ai.models.generateImages({
        model: modelId,
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
          // Seed might not be supported in this SDK wrapper for generateImages yet, or assumes different config structure
        },
      });

      const base64EncodeString = response.generatedImages?.[0]?.image?.imageBytes;
      if (!base64EncodeString) {
        throw new Error("No image data returned from Imagen.");
      }
      return { url: `data:image/jpeg;base64,${base64EncodeString}`, modelId };

    } else if (modelId === ModelId.GEMINI_2_0_FLASH_EXP) {
      // 2. Dev / Draft Model (Text-to-SVG)
      // Special handler for "Dev/Draft" model which is text-only/multimodal but not native image gen.
      // We ask it to generate an SVG placeholder code.
      const svgPrompt = `Generate a simple, minimalist SVG code representing this scene: "${fullPrompt}".
      Use simple shapes and flat colors. The SVG should be abstract and artistic.
      Return ONLY the raw SVG code starting with <svg and ending with </svg>. Do not wrap it in markdown code blocks.`;

      // Construct parts, potentially including the reference image
      const parts: any[] = [{ text: svgPrompt }];

      if (styleReferenceImage) {
        // Parse base64 string
        const match = styleReferenceImage.match(/^data:(image\/[a-z]+);base64,(.+)$/);
        if (match) {
          parts.unshift({
            inlineData: {
              mimeType: match[1],
              data: match[2]
            }
          });
          // Update prompt to acknowledge image
          parts[parts.length -1].text = `Using the attached image as a visual reference, ${svgPrompt}`;
        }
      }

      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: parts,
        },
        config: {
          seed: seed,
        }
      });

      const text = response.text || "";
      const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/);

      if (svgMatch) {
        const svgContent = svgMatch[0];
        // Encode to base64 to display as image (handling utf8 via unescape)
        const base64Svg = btoa(unescape(encodeURIComponent(svgContent)));
        return { url: `data:image/svg+xml;base64,${base64Svg}`, modelId };
      }
      
      throw new Error("Model generated text but no valid SVG found for placeholder.");

    } else {
      // 3. Gemini Image Models (Nano Banana series / Pro)
      
      // Prepare imageConfig. Note: imageSize only for gemini-3-pro-image-preview
      const imageConfig: any = {
        aspectRatio: aspectRatio,
      };

      if (modelId === ModelId.GEMINI_3_PRO_IMAGE) {
        imageConfig.imageSize = resolution;
      }

      // Construct content parts
      const parts: any[] = [{ text: fullPrompt }];

      if (styleReferenceImage) {
         const match = styleReferenceImage.match(/^data:(image\/[a-z]+);base64,(.+)$/);
         if (match) {
            parts.unshift({
               inlineData: {
                  mimeType: match[1],
                  data: match[2]
               }
            });
         }
      }

      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: parts,
        },
        config: {
          imageConfig: imageConfig,
          seed: seed,
        },
      });

      // Iterate through parts to find the image
      const contentParts = response.candidates?.[0]?.content?.parts;
      if (!contentParts) {
        throw new Error("No content parts returned.");
      }

      for (const part of contentParts) {
        if (part.inlineData && part.inlineData.data) {
           const mimeType = part.inlineData.mimeType || 'image/png';
           return { url: `data:${mimeType};base64,${part.inlineData.data}`, modelId };
        }
      }
      
      throw new Error("No image inline data found in response.");
    }
  } catch (error: any) {
    console.error("Image generation failed:", error);
    
    // Parse JSON error messages if present
    let finalMessage = error.message || "Unknown error occurred";
    let isPermissionError = false;
    
    // Try to find embedded JSON error string (common with 403/400 responses from SDK)
    const jsonMatch = finalMessage.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.error) {
           if (parsed.error.message) finalMessage = parsed.error.message;
           if (parsed.error.code === 403 || parsed.error.status === 'PERMISSION_DENIED') {
             isPermissionError = true;
           }
        }
      } catch (e) {
        // failed to parse, use original string
      }
    }
    
    // Check for explicit status codes in the error object or message text
    if (error.status === 403 || finalMessage.includes("403") || finalMessage.toLowerCase().includes("permission denied")) {
      isPermissionError = true;
    }

    if (isPermissionError) {
       finalMessage = `Permission Denied: Your API key does not have access to the model '${modelId}'.`;
       
       // Fallback logic for Pro model
       if (modelId === ModelId.GEMINI_3_PRO_IMAGE) {
          console.warn("Permission denied for Gemini 3.0 Pro. Attempting fallback to Gemini 2.5 Flash.");
          try {
             const fallbackResult = await generateImage({
                ...config,
                modelId: ModelId.GEMINI_2_5_FLASH_IMAGE
             });
             return fallbackResult;
          } catch (fallbackError) {
             console.error("Fallback failed", fallbackError);
             // If fallback fails, throw the original permission error but mention the fallback attempt failed
             finalMessage += " Fallback to Gemini 2.5 Flash also failed.";
          }
       }
    }

    throw new Error(finalMessage);
  }
};