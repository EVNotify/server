import { Exception } from '../../utils/exception';

export class VoucherNotExistsException extends Exception {
  constructor() {
    super('Voucher code does not exists.');
  }
}
