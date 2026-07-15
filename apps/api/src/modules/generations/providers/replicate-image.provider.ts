import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { StorageService } from '../../storage/storage.service';
import { buildInteriorPrompt } from './prompt-builder';
import type {
  ImageGenerationRequest,
  ImageGenerationResult,
  ImageProvider,
} from './image-provider.interface';

const POLL_INTERVAL_MS = 2000;
const MAX_WAIT_MS = 120_000;

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[];
  error?: string;
}

/**
 * Replicate implementation: structure-guided image editing (ControlNet depth)
 * so the real room geometry is preserved (§B3, §7.4). The model version is
 * configurable — the week 1-2 validation sprint (§12) decides the winner.
 */
@Injectable()
export class ReplicateImageProvider implements ImageProvider {
  private readonly logger = new Logger(ReplicateImageProvider.name);
  // Model version hash is decided by the validation sprint (§12) — no default on purpose.
  private readonly modelVersion = process.env.REPLICATE_MODEL_VERSION;
  private readonly estimatedCostUsd = Number(process.env.REPLICATE_COST_PER_RUN_USD ?? 0.05);

  constructor(private readonly storage: StorageService) {}

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      throw new Error('REPLICATE_API_TOKEN is not configured');
    }
    if (!this.modelVersion) {
      throw new Error(
        'REPLICATE_MODEL_VERSION is not configured — set it to the model chosen by the validation sprint (§12)',
      );
    }

    const sourceUrl = await this.storage.getDownloadUrl(request.sourceImageKey);
    const prediction = await this.createPrediction(token, {
      image: sourceUrl,
      prompt: buildInteriorPrompt(request.structuredPrompt),
      negative_prompt:
        'blurry, distorted walls, warped windows, extra doors, low quality, cartoon, watermark',
    });

    const completed = await this.waitForCompletion(token, prediction.id);
    const outputUrl = Array.isArray(completed.output) ? completed.output[0] : completed.output;
    if (completed.status !== 'succeeded' || !outputUrl) {
      throw new Error(`Replicate prediction failed: ${completed.error ?? completed.status}`);
    }

    const imageKey = await this.storeOutput(outputUrl);
    return { imageKey, costUsd: this.estimatedCostUsd, provider: 'replicate' };
  }

  private async createPrediction(
    token: string,
    input: Record<string, string>,
  ): Promise<ReplicatePrediction> {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ version: this.modelVersion?.split(':').pop(), input }),
    });
    if (!response.ok) {
      throw new Error(`Replicate create failed with status ${response.status}`);
    }
    return response.json() as Promise<ReplicatePrediction>;
  }

  private async waitForCompletion(token: string, id: string): Promise<ReplicatePrediction> {
    const deadline = Date.now() + MAX_WAIT_MS;
    for (;;) {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`Replicate poll failed with status ${response.status}`);
      }
      const prediction = (await response.json()) as ReplicatePrediction;
      if (['succeeded', 'failed', 'canceled'].includes(prediction.status)) {
        return prediction;
      }
      if (Date.now() > deadline) {
        throw new Error('Replicate prediction timed out');
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  private async storeOutput(outputUrl: string): Promise<string> {
    const response = await fetch(outputUrl);
    if (!response.ok) {
      throw new Error(`Failed to download Replicate output (${response.status})`);
    }
    const body = Buffer.from(await response.arrayBuffer());
    const imageKey = `renders/${randomUUID()}.jpg`;
    await this.storage.upload(imageKey, body, 'image/jpeg');
    this.logger.log(`Stored render ${imageKey}`);
    return imageKey;
  }
}
