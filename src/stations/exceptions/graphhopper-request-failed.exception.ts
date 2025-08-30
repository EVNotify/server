import { Exception } from '../../utils/exception';

export class GraphHopperRequestFailedException extends Exception {
  constructor() {
    super(`Request to Graph Hopper API failed.`);
  }
}