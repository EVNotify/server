import { Injectable } from '@nestjs/common';
import { Log } from 'src/logs/schemas/log.schema';
import { Sync } from 'src/logs/schemas/sync.schema';
import { NOTIFICATION_EVENT } from 'src/notifications/entities/notification-event.entity';
import { SettingDto } from 'src/settings/dto/setting.dto';
import { NotificationStrategyInterface } from '../../../notification-strategy.interface';
import { TelegramService } from './telegram.service';

@Injectable()
export class TelegramStrategy implements NotificationStrategyInterface {
  constructor(private readonly service: TelegramService) {}

  private sendSocTresholdReachedMessage(receiver: number, sync: Sync) {
    const soc = sync.socDisplay || sync.socBMS;

    this.service.bot.sendMessage(
      receiver,
      `Your desired state of charge of ${soc}% has been achieved`,
    );
  }

  send(
    event: NOTIFICATION_EVENT,
    settings: SettingDto,
    log: Log,
    sync: Sync,
  ): void {
    const receiver = settings.telegram;

    switch (event) {
      case NOTIFICATION_EVENT.SOC_THRESHOLD_REACHED:
        this.sendSocTresholdReachedMessage(receiver, sync);
        break;
      default:
        break;
    }
  }
}
