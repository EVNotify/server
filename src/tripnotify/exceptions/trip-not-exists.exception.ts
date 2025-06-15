import { Exception } from '../../utils/exception';

export class TripNotExistsException extends Exception {
  constructor() {
    super('Trip does not exist');
  }
}
