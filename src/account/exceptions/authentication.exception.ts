import { Exception } from './../../utils/exception';

export class AuthenticationException extends Exception {
  constructor() {
    super(
      'Authentication failed. Ensure that you provide correct akey and password',
    );
  }
}
