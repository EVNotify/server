import { HttpException, HttpStatus } from '@nestjs/common';

export class PremiumRequiredException extends HttpException {
  constructor() {
    super('Active premium status required.', HttpStatus.PAYMENT_REQUIRED);
  }
}
