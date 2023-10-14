import { OnEvent } from '@nestjs/event-emitter';
import { SettingsService } from '../../settings/settings.service';
import { LOG_DATA_SYNCED_EVENT } from '../../logs/entities/log.entity';
import { Log } from '../../logs/schemas/log.schema';
import { Sync } from '../../logs/schemas/sync.schema';
import { NOTIFICATION_EVENT } from '../entities/notification-event.entity';
import { Injectable } from '@nestjs/common';
import { SocThresholdReachedEvent } from '../events/soc-threshold-reached.event';
import { NotificationEventInterface } from '../events/notification-event.interface';
import { TelegramStrategy } from '../strategies/telegram/telegram.strategy';
import { EmailStrategy } from '../strategies/email/email.strategy';

@Injectable()
export class NotificationHandler {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly telegramStrategy: TelegramStrategy,
    private readonly emailStrategy: EmailStrategy,
  ) {}

  private async sendNotificationIfApplicable(
    log: Log,
    sync: Sync,
    event: NOTIFICATION_EVENT,
  ) {
    const settings = await this.settingsService.findOne(log.akey);
    // TODO check when last notification was send

    let handler: NotificationEventInterface;

    switch (event) {
      case NOTIFICATION_EVENT.SOC_THRESHOLD_REACHED:
        handler = new SocThresholdReachedEvent();
        break;
      default:
        return;
    }

    if (await handler.shouldSend(settings, log, sync, event)) {
      // TODO handle via strategies defined by user settings and validate them
      this.telegramStrategy.send(event, settings, log, sync);
      this.emailStrategy.send(event, settings, log, sync);
    }
  }

  // FIXME event consumer
  @OnEvent(LOG_DATA_SYNCED_EVENT)
  async handleSyncEvent(payload: { log: Log; sync: Sync }) {
    this.sendNotificationIfApplicable(
      payload.log,
      payload.sync,
      NOTIFICATION_EVENT.SOC_THRESHOLD_REACHED,
    );
  }
}
