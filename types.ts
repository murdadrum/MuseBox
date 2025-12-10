export enum ModelId {
  GEMINI_2_5_FLASH_IMAGE = 'gemini-2.5-flash-image',
  GEMINI_3_PRO_IMAGE = 'gemini-3-pro-image-preview',
  IMAGEN_4 = 'imagen-4.0-generate-001'
}

export enum AspectRatio {
  SQUARE = '1:1',
  LANDSCAPE_4_3 = '4:3',
  LANDSCAPE_16_9 = '16:9',
  PORTRAIT_3_4 = '3:4',
  PORTRAIT_9_16 = '9:16'
}

export enum Resolution {
  RES_1K = '1K',
  RES_2K = '2K',
  RES_4K = '4K'
}

export enum Perspective {
  NONE = 'None',
  CLOSE_UP = 'Close-up',
  WIDE_ANGLE = 'Wide Angle',
  AERIAL_VIEW = 'Aerial View',
  LOW_ANGLE = 'Low Angle',
  EYE_LEVEL = 'Eye Level',
  MACRO = 'Macro',
  ISOMETRIC = 'Isometric'
}

export interface GenerationConfig {
  prompt: string;
  globalStyle: string;
  modelId: ModelId;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  perspective: Perspective;
  negativePrompt?: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  config: GenerationConfig;
  timestamp: number;
}

export interface ProjectData {
  name: string;
  version: string;
  created: number;
  lastModified: number;
  history: GeneratedImage[];
  lastConfig: GenerationConfig;
}