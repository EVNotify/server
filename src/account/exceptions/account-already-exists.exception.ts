import { Exception } from 'src/utils/exception';

export class AccountAlreadyExistsException extends Exception {
  constructor() {
    super('Account already exists');
  }
}
