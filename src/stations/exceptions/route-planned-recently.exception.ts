import { Exception } from '../../utils/exception';

export class RoutePlannedRecentlyException extends Exception {
  constructor() {
    super(`Request for route planning was done recently, so you got rate limited. Please try again later.`);
  }
}