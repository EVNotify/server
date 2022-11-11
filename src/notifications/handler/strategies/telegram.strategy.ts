import { NotificationStrategyInterface } from '../../../notifications/notification-strategy.interface';

export class TelegramStrategy implements NotificationStrategyInterface {
  send(): void {
    throw new Error('Method not implemented.');
  }
}
