import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  requestGenerationSchema,
  sendMessageSchema,
  type RequestGenerationInput,
  type SendMessageInput,
} from '@kaza/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerationsService } from './generations.service';

@ApiTags('generations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class GenerationsController {
  constructor(private readonly generationsService: GenerationsService) {}

  @Post('rooms/:roomId/chat')
  @ApiOperation({ summary: 'Conversational interview turn — agent asks 3-6 adaptive questions (B2)' })
  chat(
    @CurrentUserId() userId: string,
    @Param('roomId') roomId: string,
    @Body(new ZodValidationPipe(sendMessageSchema)) input: SendMessageInput,
  ) {
    return this.generationsService.handleChatTurn(userId, roomId, input.content);
  }

  @Post('generations')
  @ApiOperation({ summary: 'Request a render — decrements credits, enqueues the job (B3, B4)' })
  request(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(requestGenerationSchema)) input: RequestGenerationInput,
  ) {
    return this.generationsService.requestGeneration(userId, input);
  }

  @Get('generations/:generationId')
  @ApiOperation({ summary: 'Poll generation status (pending/processing/done/failed)' })
  get(@CurrentUserId() userId: string, @Param('generationId') generationId: string) {
    return this.generationsService.getGeneration(userId, generationId);
  }

  @Get('rooms/:roomId/generations')
  @ApiOperation({ summary: 'Version history of a room — comparator data (B5, B6)' })
  listForRoom(@CurrentUserId() userId: string, @Param('roomId') roomId: string) {
    return this.generationsService.listRoomGenerations(userId, roomId);
  }
}
