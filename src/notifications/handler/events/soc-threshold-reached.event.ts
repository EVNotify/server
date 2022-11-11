import { NotificationEventInterface } from '../../../notifications/notification-event.interface';

export class SocThresholdReachedEvent implements NotificationEventInterface {
  shouldSend(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
