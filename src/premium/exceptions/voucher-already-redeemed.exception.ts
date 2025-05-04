import { Exception } from '../../utils/exception';

export class VoucherAlreadyRedeemedException extends Exception {
  constructor() {
    super('Entered voucher code was already redeemed.');
  }
}
