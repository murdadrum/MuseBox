export enum ModelId {
  GEMINI_2_5_FLASH_IMAGE = 'gemini-2.5-flash-image',
  GEMINI_3_PRO_IMAGE = 'gemini-3-pro-image-preview',
  IMAGEN_4 = 'imagen-4.0-generate-001',
  GEMINI_2_0_FLASH_EXP = 'gemini-2.0-flash-exp'
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

export enum Lighting {
  NONE = 'None',
  CINEMATIC = 'Cinematic',
  STUDIO = 'Studio',
  NATURAL = 'Natural',
  GOLDEN_HOUR = 'Golden Hour',
  DRAMATIC = 'Dramatic',
  NEON = 'Neon',
  VOLUMETRIC = 'Volumetric',
  LOW_KEY = 'Low Key'
}

export enum Lens {
  NONE = 'None',
  WIDE_24MM = '24mm',
  STREET_35MM = '35mm',
  STANDARD_50MM = '50mm',
  PORTRAIT_85MM = '85mm',
  TELEPHOTO_200MM = '200mm',
  MACRO = 'Macro Lens',
  FISHEYE = 'Fish-eye',
  TILT_SHIFT = 'Tilt-Shift'
}

export enum FocalLength {
  NONE = 'None',
  ULTRA_WIDE_14MM = '14mm',
  WIDE_24MM = '24mm',
  STANDARD_35MM = '35mm',
  NORMAL_50MM = '50mm',
  PORTRAIT_85MM = '85mm',
  TELEPHOTO_135MM = '135mm',
  SUPER_TELE_200MM = '200mm',
  EXTREME_400MM = '400mm'
}

export enum StudioMode {
  IMAGE = 'Image',
  BOARD = 'Board',
  VIDEO = 'Video'
}

export interface GenerationConfig {
  prompt: string;
  globalStyle: string;
  modelId: ModelId;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  perspective: Perspective;
  lighting: Lighting;
  lens: Lens;
  focalLength: FocalLength;
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

export interface StylePreset {
  id: string;
  name: string;
  config: Partial<GenerationConfig>;
}