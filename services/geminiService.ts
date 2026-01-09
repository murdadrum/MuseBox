import { GoogleGenAI } from "@google/genai";
import { ModelId, GenerationConfig, Resolution, AspectRatio } from '../types';

export interface GenerateImageResult {
  url: string;
  modelId?: ModelId;
}

// Permissive safety settings to minimize content filtering
const PERMISSIVE_SAFETY_SETTINGS = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_NONE',
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_NONE',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_NONE',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_NONE',
  },
  {
    category: 'HARM_CATEGORY_CIVIC_INTEGRITY',
    threshold: 'BLOCK_NONE',
  }
];

export const generateImage = async (config: GenerationConfig): Promise<GenerateImageResult> => {
  // CRITICAL: Always create a new instance right before making an API call 
  // to ensure it uses the most up-to-date API key from the dialog.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please select an API key using the 'Key' button in the header.");
  }

  const { modelId, prompt, aspectRatio, resolution, perspective, lighting, lens, focalLength, globalStyle, negativePrompt, styleReferenceImage, seed } = config;

  // Construct enhanced prompt
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

  if (negativePrompt && negativePrompt.trim()) {
    fullPrompt = `${fullPrompt}. Do not include: ${negativePrompt}`;
  }

  try {
    if (modelId === ModelId.IMAGEN_4) {
      const response = await ai.models.generateImages({
        model: modelId,
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
          safetySettings: PERMISSIVE_SAFETY_SETTINGS,
        },
      });

      const base64EncodeString = response.generatedImages?.[0]?.image?.imageBytes;
      if (!base64EncodeString) {
        throw new Error("No image data returned from Imagen.");
      }
      return { url: `data:image/jpeg;base64,${base64EncodeString}`, modelId };

    } else if (modelId === ModelId.GEMINI_2_0_FLASH_EXP) {
      const svgPrompt = `Generate a simple, minimalist SVG code representing this scene: "${fullPrompt}".
      Use simple shapes and flat colors.
      Return ONLY the raw SVG code starting with <svg and ending with </svg>.`;

      const parts: any[] = [{ text: svgPrompt }];

      if (styleReferenceImage) {
        const match = styleReferenceImage.match(/^data:(image\/[a-z]+);base64,(.+)$/);
        if (match) {
          parts.unshift({
            inlineData: {
              mimeType: match[1],
              data: match[2]
            }
          });
          parts[parts.length -1].text = `Using the attached image as a reference, ${svgPrompt}`;
        }
      }

      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: parts,
        },
        config: {
          seed: seed,
          safetySettings: PERMISSIVE_SAFETY_SETTINGS,
        }
      });

      const text = response.text || "";
      const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/);

      if (svgMatch) {
        const svgContent = svgMatch[0];
        const base64Svg = btoa(unescape(encodeURIComponent(svgContent)));
        return { url: `data:image/svg+xml;base64,${base64Svg}`, modelId };
      }
      
      throw new Error("Model generated text but no valid SVG found.");

    } else {
      const imageConfig: any = {
        aspectRatio: aspectRatio,
      };

      if (modelId === ModelId.GEMINI_3_PRO_IMAGE) {
        imageConfig.imageSize = resolution;
      }

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
          safetySettings: PERMISSIVE_SAFETY_SETTINGS,
        },
      });

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
      
      throw new Error("No image data found in response.");
    }
  } catch (error: any) {
    console.error("Image generation failed:", error);
    
    let finalMessage = error.message || "Unknown error occurred";
    let isPermissionError = false;
    
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
      } catch (e) {}
    }
    
    if (error.status === 403 || finalMessage.includes("403") || finalMessage.toLowerCase().includes("permission denied")) {
      isPermissionError = true;
    }

    if (isPermissionError) {
       // Detailed guidance for 403 errors
       throw new Error(`PERMISSION_DENIED: Access to ${modelId} requires a billing-enabled API key from a paid GCP project. Please click the 'Key' icon in the header to configure.`);
    }

    throw new Error(finalMessage);
  }
};