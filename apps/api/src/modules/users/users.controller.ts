import { Body, Controller, Delete, Get, Patch, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  registerPushTokenSchema,
  submitTasteQuizSchema,
  updateProfileSchema,
  type RegisterPushTokenInput,
  type SubmitTasteQuizInput,
  type UpdateProfileInput,
} from '@kaza/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Current user profile with credits and plan' })
  getMe(@CurrentUserId() userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile (language, country, currency…)' })
  updateMe(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(updateProfileSchema)) input: UpdateProfileInput,
  ) {
    return this.usersService.updateProfile(userId, input);
  }

  @Get('me/taste-quiz')
  @ApiOperation({ summary: 'Quiz cards: curated interior images with style tags (A2)' })
  getTasteQuizImages() {
    return this.usersService.getTasteQuizImages();
  }

  @Put('me/taste-quiz')
  @ApiOperation({ summary: 'Submit taste quiz swipes and derive the taste profile (A2)' })
  submitTasteQuiz(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(submitTasteQuizSchema)) input: SubmitTasteQuizInput,
  ) {
    return this.usersService.submitTasteQuiz(userId, input);
  }

  @Get('me/taste-profile')
  @ApiOperation({ summary: 'Current taste profile (A3)' })
  getTasteProfile(@CurrentUserId() userId: string) {
    return this.usersService.getTasteProfile(userId);
  }

  @Put('me/push-token')
  @ApiOperation({ summary: 'Register the Expo push token for generation notifications' })
  registerPushToken(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(registerPushTokenSchema)) input: RegisterPushTokenInput,
  ) {
    return this.usersService.registerPushToken(userId, input.expoPushToken);
  }

  @Delete('me')
  @ApiOperation({ summary: 'GDPR account deletion — removes the account and all data (§7.5)' })
  deleteMe(@CurrentUserId() userId: string) {
    return this.usersService.deleteAccount(userId);
  }
}
