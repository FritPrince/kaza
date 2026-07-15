import { Injectable, Logger } from '@nestjs/common';
import type {
  ImageGenerationRequest,
  ImageGenerationResult,
  ImageProvider,
} from './image-provider.interface';

/**
 * Replicate implementation: SDXL/Flux guided by ControlNet depth to keep the
 * real room structure (§B3, §7.4). The exact model is decided by the week 1-2
 * validation sprint (§12) — this class is the single place to wire it.
 */
@Injectable()
export class ReplicateImageProvider implements ImageProvider {
  private readonly logger = new Logger(ReplicateImageProvider.name);

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN is not configured');
    }
    this.logger.log(`Generating render for source ${request.sourceImageKey}`);

    // TODO(validation sprint §12): call Replicate predictions API with
    // ControlNet depth conditioning on the source photo, poll until complete,
    // download the output and upload it to object storage.
    throw new Error('ReplicateImageProvider.generate not implemented yet — pending validation sprint');
  }
}
