import { Injectable } from "@nestjs/common";
import { StrategyInterface } from "./strategy.interface";
import { Log } from "src/logs/schemas/log.schema";
import { Sync } from "src/logs/schemas/sync.schema";
import { SettingDto } from "src/settings/dto/setting.dto";
import { NOTIFICATION_EVENT } from "../entities/notification-event.entity";
import { Resend } from "resend";
import { TemplateCacheService } from "../templates/template-cache.service";
import { TranslatorService } from "src/translator/translator.service";
import { LANGUAGES } from "src/settings/entities/language.entity";

@Injectable()
export class EmailStrategy implements StrategyInterface {
  resendInstance: Resend;

  constructor(
    private readonly translator: TranslatorService,
    private readonly templateCache: TemplateCacheService,
  ) {
    this.resendInstance = new Resend(process.env.RESEND_API_KEY)
  }

  sendIfApplicable(event: NOTIFICATION_EVENT, settings: SettingDto, log: Log, sync: Sync): void {
    if (!settings.email) {
      return;
    }

    const template = this.templateCache.getTemplate(event.toLowerCase(), settings.language);

    if (!template) {
      return;
    }

    let data = {};

    if (event == NOTIFICATION_EVENT.THRESHOLD_REACHED) {
      data = { soc: sync.socDisplay || sync.socBMS };
    }

    const subject = this.translator.translate('email_subject_' + event.toLowerCase(), settings.language ?? LANGUAGES.en, data);

    this.resendInstance.emails.send({
      from: process.env.MAIL_SENDER_ADDRESS,
      to: settings.email,
      subject,
      html: template(data),
    });
  }
}