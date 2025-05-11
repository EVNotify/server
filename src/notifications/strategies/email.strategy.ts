import { Injectable } from "@nestjs/common";
import { StrategyInterface } from "./strategy.interface";
import { Log } from "src/logs/schemas/log.schema";
import { Sync } from "src/logs/schemas/sync.schema";
import { SettingDto } from "src/settings/dto/setting.dto";
import { NOTIFICATION_EVENT } from "../entities/notification-event.entity";
import { Resend } from "resend";

@Injectable()
export class EmailStrategy implements StrategyInterface {
  resendInstance: Resend;

  constructor() {
    this.resendInstance = new Resend(process.env.RESEND_API_KEY)
  }

  sendIfApplicable(event: NOTIFICATION_EVENT, settings: SettingDto, log: Log, sync: Sync): void {
    if (!settings.email) {
      return;
    }

    // TODO Translate
    // TODO HTML Templates
    this.resendInstance.emails.send({
      from: process.env.MAIL_SENDER_ADDRESS,
      to: settings.email,
      subject: event,
      html: sync.socDisplay + '%',
    });
  }
}