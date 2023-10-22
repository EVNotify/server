import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';

@Injectable()
export class Translator {
  public fallbackLocale = 'en';
  public allowedLocales: Array<string> = ['de', 'en'];
  public localizations = {};
  private path = process.cwd() + '/src/i18n/';

  // TODO: data placeholders
  public translate(key: string, locale: string): string {
    if (!this.allowedLocales.includes(locale)) {
      locale = this.fallbackLocale;
    }

    if (!this.localizations[locale]) {
      this.localizations[locale] = JSON.parse(
        readFileSync(this.path + locale + '.json', 'utf-8'),
      );
    }

    const text =
      this.localizations[locale][key] ??
      this.localizations[this.fallbackLocale][key];

    return text ?? key;
  }
}
