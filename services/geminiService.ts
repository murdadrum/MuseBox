import { GoogleGenAI } from "@google/genai";
import { ModelId, GenerationConfig, Resolution, AspectRatio } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface GenerateImageResult {
  url: string;
}

export const generateImage = async (config: GenerationConfig): Promise<GenerateImageResult> => {
  const { modelId, prompt, aspectRatio, resolution, perspective, globalStyle } = config;

  // Construct enhanced prompt with perspective and global style
  let fullPrompt = prompt;

  if (globalStyle && globalStyle.trim()) {
    fullPrompt = `${fullPrompt}, style: ${globalStyle}`;
  }

  if (perspective && perspective !== 'None') {
    fullPrompt = `${perspective} shot of ${fullPrompt}`;
  }

  try {
    if (modelId === ModelId.IMAGEN_4) {
      // Use generateImages for Imagen models
      const response = await ai.models.generateImages({
        model: modelId,
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
        },
      });

      const base64EncodeString = response.generatedImages?.[0]?.image?.imageBytes;
      if (!base64EncodeString) {
        throw new Error("No image data returned from Imagen.");
      }
      return { url: `data:image/jpeg;base64,${base64EncodeString}` };

    } else {
      // Use generateContent for Gemini models (Nano Banana series)
      
      // Prepare imageConfig. Note: imageSize only for gemini-3-pro-image-preview
      const imageConfig: any = {
        aspectRatio: aspectRatio,
      };

      if (modelId === ModelId.GEMINI_3_PRO_IMAGE) {
        imageConfig.imageSize = resolution;
      }

      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [{ text: fullPrompt }],
        },
        config: {
          imageConfig: imageConfig,
        },
      });

      // Iterate through parts to find the image
      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts) {
        throw new Error("No content parts returned.");
      }

      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
           const mimeType = part.inlineData.mimeType || 'image/png';
           return { url: `data:${mimeType};base64,${part.inlineData.data}` };
        }
      }
      
      throw new Error("No image inline data found in response.");
    }
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};