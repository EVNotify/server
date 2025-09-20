import { Exception } from '../../utils/exception';

export class PurchaseTokenInvalidException extends Exception {
  constructor() {
    super('Purchase token is invalid. Contact support, if issue persists.');
  }
}
