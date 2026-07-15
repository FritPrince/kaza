import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  emailLoginSchema,
  emailSignupSchema,
  refreshTokenSchema,
  requestOtpSchema,
  verifyOtpSchema,
  type AuthTokens,
  type EmailLoginInput,
  type EmailSignupInput,
  type RefreshTokenInput,
  type RequestOtpInput,
  type VerifyOtpInput,
} from '@kaza/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  @HttpCode(202)
  @ApiOperation({ summary: 'Send an OTP code by SMS (A1)' })
  requestOtp(@Body(new ZodValidationPipe(requestOtpSchema)) input: RequestOtpInput) {
    return this.authService.requestOtp(input.phone);
  }

  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP and sign in / sign up' })
  verifyOtp(@Body(new ZodValidationPipe(verifyOtpSchema)) input: VerifyOtpInput): Promise<AuthTokens> {
    return this.authService.verifyOtp(input.phone, input.code);
  }

  @Post('signup')
  @ApiOperation({ summary: 'Sign up with e-mail and password' })
  signup(@Body(new ZodValidationPipe(emailSignupSchema)) input: EmailSignupInput): Promise<AuthTokens> {
    return this.authService.signupWithEmail(input);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign in with e-mail and password' })
  login(@Body(new ZodValidationPipe(emailLoginSchema)) input: EmailLoginInput): Promise<AuthTokens> {
    return this.authService.loginWithEmail(input);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate refresh token and issue a new access token' })
  refresh(@Body(new ZodValidationPipe(refreshTokenSchema)) input: RefreshTokenInput): Promise<AuthTokens> {
    return this.authService.refresh(input.refreshToken);
  }
}
