import type { StructuredPrompt } from '@kaza/shared';

export const IMAGE_PROVIDER = Symbol('IMAGE_PROVIDER');

export interface ImageGenerationRequest {
  /** Storage key of the source room photo. */
  sourceImageKey: string;
  structuredPrompt: StructuredPrompt;
}

export interface ImageGenerationResult {
  /** Storage key of the generated render. */
  imageKey: string;
  costUsd: number;
  provider: string;
}

/**
 * Abstraction over image generation vendors (§7.4). Implementations MUST
 * preserve the room geometry (walls, windows, doors) — non-negotiable (§B3).
 */
export interface ImageProvider {
  generate(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
}
