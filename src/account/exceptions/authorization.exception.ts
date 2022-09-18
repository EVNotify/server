import { Exception } from './../../utils/exception';

export class AuthorizationException extends Exception {
  constructor() {
    super(
      'Authorization failed. Ensure that you provide Authorization header that must match format "AKEY TOKEN"',
    );
  }
}
