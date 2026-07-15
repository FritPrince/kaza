import { Injectable, Logger } from '@nestjs/common';
import type { SmsProvider } from './sms-provider.interface';

@Injectable()
export class TermiiSmsProvider implements SmsProvider {
  private readonly logger = new Logger(TermiiSmsProvider.name);

  async sendOtp(phone: string, code: string): Promise<void> {
    if (!process.env.TERMII_API_KEY) {
      // Development fallback: log instead of sending, so the flow is testable without credentials.
      this.logger.warn(`TERMII_API_KEY not set — OTP for ${phone}: ${code}`);
      return;
    }
    const response = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TERMII_API_KEY,
        to: phone,
        from: 'Kaza',
        sms: `Votre code Kaza : ${code}. Valide 5 minutes.`,
        type: 'plain',
        channel: 'generic',
      }),
    });
    if (!response.ok) {
      throw new Error(`Termii SMS failed with status ${response.status}`);
    }
  }
}
