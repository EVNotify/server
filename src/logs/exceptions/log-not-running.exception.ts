import { Exception } from '../../utils/exception';

export class LogNotRunningException extends Exception {
  constructor() {
    super('No log is actively running at the moment.');
  }
}
