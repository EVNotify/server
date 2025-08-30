import { Exception } from '../../utils/exception';

export class RouteCalculatedRecentlyException extends Exception {
  constructor() {
    super(`Request for route calculating was done recently, so you got rate limited. Please try again later.`);
  }
}