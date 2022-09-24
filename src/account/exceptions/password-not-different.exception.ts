import { Exception } from './../../utils/exception';

export class PasswordNotDifferentException extends Exception {
  constructor() {
    super('Password must be different than existing password');
  }
}
