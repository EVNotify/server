import { Exception } from '../../utils/exception';

export class TripCreationException extends Exception {
  constructor(message: string) {
    super(message);
  }
}
