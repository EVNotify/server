import { Exception } from '../../utils/exception';

export class TripMissingPremiumException extends Exception {
  constructor() {
    super(`Trip owner does not have an active premium subscription.`);
  }
}
