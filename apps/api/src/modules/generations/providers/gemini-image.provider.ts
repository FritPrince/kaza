import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { StorageService } from '../../storage/storage.service';
import { buildInteriorPrompt } from './prompt-builder';
import type {
  ImageGenerationRequest,
  ImageGenerationResult,
  ImageProvider,
} from './image-provider.interface';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ inlineData?: { mimeType: string; data: string } }>;
    };
  }>;
}

/**
 * Gemini image editing implementation (§7.4): the source photo is sent inline
 * and the model edits it while keeping the room structure — the alternative
 * benchmarked against Replicate in the validation sprint (§12).
 */
@Injectable()
export class GeminiImageProvider implements ImageProvider {
  private readonly logger = new Logger(GeminiImageProvider.name);
  private readonly model = process.env.GEMINI_IMAGE_MODEL ?? 'gemini-2.5-flash-image';
  private readonly estimatedCostUsd = Number(process.env.GEMINI_COST_PER_RUN_USD ?? 0.04);

  constructor(private readonly storage: StorageService) {}

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const sourceUrl = await this.storage.getDownloadUrl(request.sourceImageKey);
    const sourceResponse = await fetch(sourceUrl);
    if (!sourceResponse.ok) {
      throw new Error(`Failed to fetch source photo (${sourceResponse.status})`);
    }
    const sourceBase64 = Buffer.from(await sourceResponse.arrayBuffer()).toString('base64');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inlineData: { mimeType: 'image/jpeg', data: sourceBase64 } },
                { text: buildInteriorPrompt(request.structuredPrompt) },
              ],
            },
          ],
        }),
      },
    );
    if (!response.ok) {
      throw new Error(`Gemini generateContent failed with status ${response.status}`);
    }

    const payload = (await response.json()) as GeminiResponse;
    const imagePart = payload.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .find((part) => part.inlineData);
    if (!imagePart?.inlineData) {
      throw new Error('Gemini returned no image data');
    }

    const body = Buffer.from(imagePart.inlineData.data, 'base64');
    const imageKey = `renders/${randomUUID()}.jpg`;
    await this.storage.upload(imageKey, body, imagePart.inlineData.mimeType);
    this.logger.log(`Stored render ${imageKey}`);
    return { imageKey, costUsd: this.estimatedCostUsd, provider: 'gemini' };
  }
}
