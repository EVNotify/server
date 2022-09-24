import { Exception } from './../../utils/exception';

export class AccountNotExistsException extends Exception {
  constructor() {
    super('Account does not exists');
  }
}
