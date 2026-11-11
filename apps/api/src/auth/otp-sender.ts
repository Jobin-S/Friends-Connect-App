import { Injectable, Logger } from '@nestjs/common';

/** Delivers an OTP to a phone. Swap the implementation (e.g. MSG91, Twilio) without touching the auth flow. */
export abstract class OtpSender {
  abstract send(phone: string, code: string): Promise<void>;
}

/** Development sender: does not send anything, just logs the code to the API console. */
@Injectable()
export class DevOtpSender extends OtpSender {
  private readonly logger = new Logger('OTP');

  async send(phone: string, code: string): Promise<void> {
    this.logger.log(`OTP for ${phone}: ${code}`);
  }
}
