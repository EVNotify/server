import { OnEvent } from '@nestjs/event-emitter';
import { SettingsService } from '../../settings/settings.service';
import { LOG_DATA_SYNCED_EVENT } from '../../logs/entities/log.entity';
import { Log } from '../../logs/schemas/log.schema';
import { Sync } from '../../logs/schemas/sync.schema';
import { NOTIFICATION_EVENT } from '../entities/notification-event.entity';
import { SocThresholdReachedEvent } from './events/soc-threshold-reached.event';
import { Injectable } from '@nestjs/common';
import { TelegramStrategy } from './strategies/telegram.strategy';

@Injectable()
export class NotificationHandler {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly telegramStrategy: TelegramStrategy,
  ) {}

  private async sendNotificationIfApplicable(
    log: Log,
    sync: Sync,
    event: NOTIFICATION_EVENT,
  ) {
    const settings = await this.settingsService.findOne(log.akey);
    // check when last notification was send

    let handler;

    switch (event) {
      case NOTIFICATION_EVENT.SOC_THRESHOLD_REACHED:
        handler = new SocThresholdReachedEvent();
        break;
      default:
        return;
    }

    if (await handler.shouldSend(settings, log, sync)) {
      // handle via strategies defined by user settings
      console.log('SHOULD HANDLE');
    }

    this.telegramStrategy.send();
  }

  @OnEvent(LOG_DATA_SYNCED_EVENT)
  async handleSyncEvent(payload: { log: Log; sync: Sync }) {
    this.sendNotificationIfApplicable(
      payload.log,
      payload.sync,
      NOTIFICATION_EVENT.SOC_THRESHOLD_REACHED,
    );
  }
}
