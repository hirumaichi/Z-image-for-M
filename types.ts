export enum Resolution {
  HD = 'HD',   // Maps to standard 1K (approx) via Flash
  FHD = 'FHD', // Maps to standard 1K (approx) via Flash
  R2K = '2K',  // Maps to 2K via Pro
  R4K = '4K',  // Maps to 4K via Pro
  R8K = '8K'   // API limit is 4K, we will map to 4K but prompt for higher detail
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '9:16',
  LANDSCAPE = '16:9',
  STANDARD_LANDSCAPE = '4:3',
  STANDARD_PORTRAIT = '3:4'
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash-image',
  PRO = 'gemini-3-pro-image-preview'
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  resolution: Resolution;
  timestamp: number;
  referenceImage?: string | null; // Base64 string of the input reference
  modelUsed: ModelType;
}

export interface GenerationConfig {
  prompt: string;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  referenceImage?: string | null; // Base64 string
}