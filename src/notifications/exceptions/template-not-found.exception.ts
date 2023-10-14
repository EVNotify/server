import { Exception } from 'src/utils/exception';

export class TemplateNotFoundException extends Exception {
  constructor() {
    super('Template could not be found');
  }
}
