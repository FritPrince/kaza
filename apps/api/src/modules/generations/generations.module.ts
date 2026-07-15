import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import { GenerationsController } from './generations.controller';
import { GenerationsService } from './generations.service';
import { GenerationProcessor } from './generation.processor';
import { InterviewAgentService } from './agent/interview-agent.service';
import { IMAGE_PROVIDER } from './providers/image-provider.interface';
import { ReplicateImageProvider } from './providers/replicate-image.provider';
import { GeminiImageProvider } from './providers/gemini-image.provider';

export const GENERATION_QUEUE = 'generations';

@Module({
  imports: [AuthModule, BullModule.registerQueue({ name: GENERATION_QUEUE })],
  controllers: [GenerationsController],
  providers: [
    GenerationsService,
    GenerationProcessor,
    InterviewAgentService,
    {
      // ImageProvider abstraction (§7.4): switch vendors via env without touching clients.
      provide: IMAGE_PROVIDER,
      useClass: process.env.IMAGE_PROVIDER === 'gemini' ? GeminiImageProvider : ReplicateImageProvider,
    },
  ],
})
export class GenerationsModule {}
