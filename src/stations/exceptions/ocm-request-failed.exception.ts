import { Exception } from '../../utils/exception';

export class OCMRequestFailedException extends Exception {
  constructor() {
    super(`Request to Open Charge Map API failed.`);
  }
}