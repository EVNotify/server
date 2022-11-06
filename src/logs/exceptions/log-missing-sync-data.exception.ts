import { Exception } from '../../utils/exception';

export class LogMissingSyncDataException extends Exception {
  constructor() {
    super('Ensure that you provide data to sync and they are valid');
  }
}
