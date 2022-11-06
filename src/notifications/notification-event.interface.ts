export interface NotificationEventInterface {
  shouldSend(): Promise<boolean>;
}
