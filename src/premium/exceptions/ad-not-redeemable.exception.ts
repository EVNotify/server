import { Exception } from '../../utils/exception';

export class AdNotRedeemableException extends Exception {
  constructor() {
    super('Ad could not be redeemed. Most likely because you are already premium or ad was not able to be verified.');
  }
}
