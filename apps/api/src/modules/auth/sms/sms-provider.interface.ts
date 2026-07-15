export const SMS_PROVIDER = Symbol('SMS_PROVIDER');

/** Abstraction over SMS vendors (Termii, Twilio) so the provider can be swapped per market. */
export interface SmsProvider {
  sendOtp(phone: string, code: string): Promise<void>;
}
