import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import stringInject from 'stringinject';

@Injectable()
export class Translator {
  public fallbackLocale = 'en';
  public allowedLocales: Array<string> = ['de', 'en'];
  public localizations = {};
  private path = process.cwd() + '/src/i18n/';

  public translate(
    key: string,
    locale: string,
    variables: object = null,
  ): string {
    if (!this.allowedLocales.includes(locale)) {
      locale = this.fallbackLocale;
    }

    if (!this.localizations[locale]) {
      this.localizations[locale] = JSON.parse(
        readFileSync(this.path + locale + '.json', 'utf-8'),
      );
    }

    let text =
      this.localizations[locale][key] ??
      this.localizations[this.fallbackLocale][key];

    if (text && variables) {
      text = stringInject(text, variables);
    }

    return text ?? key;
  }
}
