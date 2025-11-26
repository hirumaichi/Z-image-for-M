import { GoogleGenAI } from "@google/genai";
import { Resolution, AspectRatio, ModelType } from "../types";

/**
 * Helper to convert Resolution Enum to API compatible ImageSize string.
 * Only works for Pro model.
 */
const mapResolutionToSize = (res: Resolution): "1K" | "2K" | "4K" => {
  switch (res) {
    case Resolution.R2K:
      return "2K";
    case Resolution.R4K:
    case Resolution.R8K: // API max is 4K
      return "4K";
    default:
      return "1K";
  }
};

/**
 * Maps resolution to prompt keywords to force higher detail perception
 * especially for Flash model which ignores imageSize config.
 */
const getQualityKeywords = (res: Resolution): string => {
  switch (res) {
    case Resolution.HD:
      return "standard quality, clear image";
    case Resolution.FHD:
      return "high definition, sharp focus, 1080p";
    case Resolution.R2K:
      return "2K resolution, highly detailed, refined textures";
    case Resolution.R4K:
      return "4K resolution, hyper-realistic, incredible detail, 8k textures, macro photography";
    case Resolution.R8K:
      return "8K resolution, masterpiece, extreme detail, uncompressed, raytracing, cinematic lighting";
    default:
      return "high quality";
  }
};

/**
 * Reverse Engineering: Analyzes an image and returns a prompt description.
 */
export const generatePromptFromImage = async (imageBase64: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
          { text: "Analyze this image and write a detailed, high-quality text-to-image prompt that would generate a similar image. Focus on the subject, composition, camera angle, lighting, colors, and materials. Output ONLY the prompt text, no intro/outro." }
        ]
      }
    });

    return response.text || "Failed to analyze image.";
  } catch (error) {
    console.error("Vision API Error:", error);
    throw new Error("Gagal menganalisis gambar. Pastikan gambar valid.");
  }
};

export const generateMockup = async (
  prompt: string,
  resolution: Resolution,
  aspectRatio: AspectRatio,
  modelType: ModelType,
  referenceImageBase64?: string | null,
  backgroundColor?: string,
  refineMode?: boolean
): Promise<string> => {
  
  // Initialize the client inside the function
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Get resolution specific keywords
  const qualitySuffix = getQualityKeywords(resolution);

  // Construct parts
  const parts: any[] = [];

  // Enhanced Prompt Engineering
  const baseSystemPrompt = refineMode 
    ? `
      ROLE: High-End Image Restoration & Enhancement Specialist.
      TASK: Denoise, upscale, and refine the input image while preserving 100% of the visual content identity.
      
      STRICT RULES:
      1. QUALITY TARGET: ${qualitySuffix}.
      2. RESTORATION: Remove compression artifacts, noise, blur, and pixelation.
      3. FIDELITY: Do NOT change the subject, pose, or main elements. This is an enhancement, not a reimaging.
      4. DETAIL: Add high-frequency textures (skin pores, fabric weaves, surface imperfections) to make it look like a raw photo.
      5. LIGHTING: Fix blown-out highlights or crushed shadows without altering the mood.
    ` 
    : `
      ROLE: World-class Product Photographer & 3D Visualization Expert.
      TASK: Create a clean, premium product mockup.
      QUALITY TARGET: ${qualitySuffix}.
      
      STRICT RULES FOR REFERENCE IMAGES:
      1. GEOMETRY: Preserve the EXACT shape, perspective, and position of the MAIN OBJECT from the reference.
      2. CLEANING: REMOVE ALL existing watermarks, logos, text overlays, or artifacts from the reference. The surface must be pristine.
      3. LIGHTING: Re-light the scene with studio-quality global illumination (softbox/rim light).
      4. COMPOSITION: Keep the main layout, but you are free to improve the background environment to be more premium.
      
      OUTPUT VISUALS:
      - ${qualitySuffix}
      - No noise, no blur, no distortion.
      - Perfect material rendering (glass, metal, fabric).
    `;

  let promptAppendix = "";
  if (backgroundColor && backgroundColor !== '#000000') {
    promptAppendix += ` BACKGROUND: Use a clean, solid background color with Hex Code: ${backgroundColor}. Ensure the object blends naturally with this color using appropriate shadows.`;
  }

  if (referenceImageBase64) {
    const cleanBase64 = referenceImageBase64.split(',')[1] || referenceImageBase64;
    
    parts.push({
      inlineData: {
        data: cleanBase64,
        mimeType: 'image/png',
      },
    });

    const instruction = refineMode
      ? `
        ${baseSystemPrompt}
        
        INPUT IMAGE: Source to be enhanced.
        INSTRUCTION: 
        1. Upscale and clean the reference image. 
        2. Remove any text overlays or watermarks if they look like errors, but keep product text clear.
        3. ${prompt ? 'ADDITIONAL DIRECTION: ' + prompt : ''}
      `
      : `
        ${baseSystemPrompt}
        
        INPUT IMAGE IS THE REFERENCE FOR SHAPE AND LAYOUT ONLY.
        
        INSTRUCTION:
        1. Identify the MAIN PRODUCT/OBJECT in the image. Keep its shape and angle 100% accurate.
        2. IGNORE and REMOVE any text, watermarks, or stock photo grid lines overlaid on the image. Reconstruct the texture underneath.
        3. UPGRADE the visual quality to ${resolution}.
        4. APPLY PROMPT: "${prompt ? prompt : 'Clean studio photography, elegant lighting'}".
        ${promptAppendix}
      `;

    parts.push({ text: instruction });
  } else {
    // Pure text generation (no reference image)
    parts.push({
      text: `
        ${baseSystemPrompt}
        PROMPT: ${prompt}.
        ${promptAppendix}
        DETAILS: High-end finish, perfect materials, studio environment, no watermarks, ${qualitySuffix}.
      `,
    });
  }

  // Configuration
  const config: any = {
    imageConfig: {
      aspectRatio: aspectRatio,
    }
  };

  // Explicitly set imageSize for PRO model. 
  // For Flash, we rely on the prompt keywords added above, as it ignores imageSize.
  if (modelType === ModelType.PRO) {
    config.imageConfig.imageSize = mapResolutionToSize(resolution);
  }

  try {
    const response = await ai.models.generateContent({
      model: modelType,
      contents: { parts },
      config: config
    });

    // Extract image
    if (response.candidates && response.candidates[0].content.parts) {
      // Check for image part
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      
      // If no image, check for text (usually refusal or error message from model)
      const textParts = response.candidates[0].content.parts.filter((p: any) => p.text).map((p: any) => p.text).join(' ');
      if (textParts) {
        throw new Error(`AI Response (No Image): ${textParts}`);
      }
    }

    throw new Error("No image data found in response. The model may have blocked the request.");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};