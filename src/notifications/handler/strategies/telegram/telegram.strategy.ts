import { Injectable } from '@nestjs/common';
import { NotificationStrategyInterface } from '../../../notification-strategy.interface';
import { TelegramService } from './telegram.service';

@Injectable()
export class TelegramStrategy implements NotificationStrategyInterface {
  constructor(private readonly service: TelegramService) {}

  send(): void {
    this.service.bot.sendMessage(0, 'send');
  }
}
