import { HttpException, HttpStatus } from '@nestjs/common';

export class PremiumRequiredException extends HttpException {
  constructor( message?: string) {
    super(message || 'Active premium status required.', HttpStatus.PAYMENT_REQUIRED);
  }
}
