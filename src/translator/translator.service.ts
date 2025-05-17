import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { readFileSync } from "fs";
import { join } from "path";
import { LANGUAGES } from "src/settings/entities/language.entity";
import Handlebars from "handlebars";

@Injectable()
export class TranslatorService implements OnModuleInit {
  private translationMap = new Map<LANGUAGES, Record<string, Handlebars.TemplateDelegate>>();

  onModuleInit() {
    const i18nDir = join(__dirname, '../translator/i18n');

    Object.keys(LANGUAGES)
      .filter((language) => isNaN(Number(language)))
      .forEach((language) => {
        const filePath = join(i18nDir, language + '.json');
        const rawContent = readFileSync(filePath, 'utf8');
        const translations = JSON.parse(rawContent);

        const compiledTranslations: Record<string, Handlebars.TemplateDelegate> = {};

        Object.entries(translations).forEach(([key, value]) => {
          compiledTranslations[key] = Handlebars.compile(value);
        });

        this.translationMap.set(LANGUAGES[language], compiledTranslations);
      });

    Logger.log('Initialized translations', TranslatorService.name);
  }

  translate(key: string, locale: LANGUAGES, data: Record<string, any> = {}): string {
    const translations = this.translationMap.get(locale);
    const template = translations?.[key];

    if (!template) {
      Logger.warn(`Missing translation for key '${key}' in locale '${LANGUAGES[locale]}'`);
      return key;
    }

    return template(data);
  }
}
