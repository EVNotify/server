import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { readdirSync, readFileSync, statSync } from "fs";
import Handlebars from "handlebars";
import { basename, join } from "path";

@Injectable()
export class TemplateCacheService implements OnModuleInit {
  private templateMap = new Map<string, Map<string, Handlebars.TemplateDelegate>>();

  onModuleInit() {
    const templatesBaseDir = join(__dirname, '../templates');

    const locales = readdirSync(templatesBaseDir).filter((localeDir) =>
      statSync(join(templatesBaseDir, localeDir)).isDirectory(),
    );

    locales.forEach((locale) => {
      const localePath = join(templatesBaseDir, locale);
      const files = readdirSync(localePath);

      files.forEach((file) => {
        const content = readFileSync(join(localePath, file), 'utf8');
        const compiled = Handlebars.compile(content);

        const templateName = basename(file, '.html');

        if (!this.templateMap.has(templateName)) {
          this.templateMap.set(templateName, new Map());
        }

        this.templateMap.get(templateName).set(locale, compiled);
      });
    });

    Logger.log('Initialized templates', TemplateCacheService.name);
  }

  getTemplate(name: string, locale: string): Handlebars.TemplateDelegate|null {
    return this.templateMap.get(name)?.get(locale);
  }
}