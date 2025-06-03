import { Exception } from '../../utils/exception';

export class TripNotStartedException extends Exception {
  constructor(private startDate: Date) {
    super(`Trip not started yet. Trip starts at: ${startDate}`);
  }
}
