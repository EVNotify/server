import { Exception } from '../../utils/exception';

export class LogRequiresPremiumException extends Exception {
  constructor() {
    super('This log requires a premium account to access because it is either still running or has been archived.');
  }
}
