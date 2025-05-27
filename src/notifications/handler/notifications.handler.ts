import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { LOG_DATA_SYNCED_EVENT } from "src/logs/entities/log.entity";
import { Log } from "src/logs/schemas/log.schema";
import { Sync } from "src/logs/schemas/sync.schema";
import { NOTIFICATION_EVENT } from "../entities/notification-event.entity";
import { SettingsService } from "src/settings/settings.service";
import { EventHandlerInterface } from "./event-handler.interface";
import { ThresholdReachedHandler } from "./threshold-reached.handler";
import { EmailStrategy } from "../strategies/email.strategy";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class NotificationHandler {
  constructor(
    @InjectModel(Log.name) private logModel: Model<Log>,
    private readonly settingsService: SettingsService,
    private readonly emailStrategy: EmailStrategy,
  ) { }

  private async sendNotificationIfApplicable(
    log: Log,
    sync: Sync,
    event: NOTIFICATION_EVENT,
  ) {
    const settings = await this.settingsService.findOne(log.akey);

    let handler: EventHandlerInterface;

    switch (event) {
      case NOTIFICATION_EVENT.THRESHOLD_REACHED:
        handler = new ThresholdReachedHandler();
        break;
      default:
        return;
    }

    if (await handler.shouldProceed(settings, log, sync, event)) {
      if (handler instanceof ThresholdReachedHandler) {
        await this.logModel.updateOne(
          {
            _id: log._id,
            akey: log.akey,
          },
          {
            $set: {
              thresholdReached: new Date(),
            },
          },
        );
      }
      
      this.emailStrategy.sendIfApplicable(event, settings, log, sync);
    }
  }

  @OnEvent(LOG_DATA_SYNCED_EVENT)
  async handleSyncEvent(payload: { log: Log; sync: Sync }) {
    try {
      this.sendNotificationIfApplicable(
        payload.log,
        payload.sync,
        NOTIFICATION_EVENT.THRESHOLD_REACHED,
      );
    } catch (_) { }
  }
}