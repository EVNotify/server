import { Exception } from '../../utils/exception';

export class LogNotExistsException extends Exception {
  constructor() {
    super('Log does not exist');
  }
}
