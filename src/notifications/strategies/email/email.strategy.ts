import { Injectable } from '@nestjs/common';
import { Log } from 'src/logs/schemas/log.schema';
import { Sync } from 'src/logs/schemas/sync.schema';
import { NOTIFICATION_EVENT } from 'src/notifications/entities/notification-event.entity';
import { SettingDto } from 'src/settings/dto/setting.dto';
import { NotificationStrategyInterface } from '../notification-strategy.interface';
import { EmailService } from './email.service';
import { TemplateNotFoundException } from 'src/notifications/exceptions/template-not-found.exception';

@Injectable()
export class EmailStrategy implements NotificationStrategyInterface {
  constructor(private readonly service: EmailService) {}

  send(
    event: NOTIFICATION_EVENT,
    settings: SettingDto,
    log: Log,
    sync: Sync,
  ): void {
    const templateId = this.getTemplateId(event, settings.language);
    const socValue = sync.socDisplay || sync.socBMS;
    const subject = this.getSubject(templateId, socValue);

    this.service.send(
      templateId,
      settings.email,
      subject,
      this.getVariables(socValue),
    );
  }

  getTemplateId(event: NOTIFICATION_EVENT, language: string): number {
    // TODO extend
    const templates = {
      [NOTIFICATION_EVENT.SOC_THRESHOLD_REACHED]: {
        en: process.env.MAIL_TEMPLATE_SOC_REACHED_EN,
      },
    };

    const template = templates[event];

    const preferredTemplateId = template
      ? template[language] ?? template['en']
      : null;

    if (!preferredTemplateId) {
      throw new TemplateNotFoundException();
    }

    return parseInt(preferredTemplateId);
  }

  // TODO
  getSubject(templateId: number, soc: number): string {
    return `EVNotify - Desired state of charge of ${soc}% reached`;
  }

  // TODO
  getVariables(socValue: number): object {
    return {
      soc_value: socValue,
      range_value: '',
      range_unit: '',
      consumption_value: '',
      consumption_unit: '',
    };
  }
}
