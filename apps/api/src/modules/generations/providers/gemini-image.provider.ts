import { Injectable, Logger } from '@nestjs/common';
import type {
  ImageGenerationRequest,
  ImageGenerationResult,
  ImageProvider,
} from './image-provider.interface';

/** Gemini image editing implementation — alternative benchmarked in the validation sprint (§12). */
@Injectable()
export class GeminiImageProvider implements ImageProvider {
  private readonly logger = new Logger(GeminiImageProvider.name);

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.logger.log(`Generating render for source ${request.sourceImageKey}`);

    // TODO(validation sprint §12): call Gemini image editing with the source
    // photo and structured prompt, then upload the result to object storage.
    throw new Error('GeminiImageProvider.generate not implemented yet — pending validation sprint');
  }
}
