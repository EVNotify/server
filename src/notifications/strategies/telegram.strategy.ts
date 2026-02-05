import { Injectable } from '@nestjs/common';
import { Log } from '../../logs/schemas/log.schema';
import { Sync } from '../../logs/schemas/sync.schema';
import { NOTIFICATION_EVENT } from '../../notifications/entities/notification-event.entity';
import { SettingDto } from '../../settings/dto/setting.dto';
import { LANGUAGES } from '../../settings/entities/language.entity';
import { TelegramService } from './telegram.service';
import { StrategyInterface } from './strategy.interface';

@Injectable()
export class TelegramStrategy implements StrategyInterface {
  constructor(private readonly service: TelegramService) {}
  sendIfApplicable(event: NOTIFICATION_EVENT, settings: SettingDto, log: Log, sync: Sync): void {
    const receiver = settings.telegram;

    switch (event) {
      case NOTIFICATION_EVENT.THRESHOLD_REACHED:
        this.sendSocThresholdReachedMessage(receiver, settings.language, sync);
        break;
      default:
        break;
    }
  }

  private sendSocThresholdReachedMessage(receiver: number, language: LANGUAGES, sync: Sync) {
    const soc = sync.socDisplay || sync.socBMS;

    const message = this.service.translator.translate(
      'telegram.message.threshold_reached',
      language,
      { soc },
    );

    this.service.bot.sendMessage(receiver, message);
  }

}