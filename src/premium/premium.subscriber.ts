import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PubSub } from '@google-cloud/pubsub';
import { PremiumService } from './premium.service';

@Injectable()
export class PremiumSubscriber implements OnModuleInit {
  private readonly projectId = process.env.GCP_PROJECT_ID || 'evnotify-v3-prod';
  private readonly pubsub = new PubSub({ projectId: this.projectId });
  private readonly topicName = process.env.PUBSUB_TOPIC || 'evnotify-v3-prod-topic';
  private readonly subscriptionName = process.env.PUBSUB_SUBSCRIPTION || 'evnotify-v3-prod-topic-sub';

  constructor(
    private readonly premiumService: PremiumService,
  ) {}

  onModuleInit() {
    this.pubsub
      .topic(this.topicName)
      .subscription(this.subscriptionName)
      .on('error', (error) => {
        Logger.error('Pub/Sub subscription error', error);
      })
      .on('message', this.handleMessage.bind(this));
  }

  private async handleMessage(message: any) {
    let data;

    try {
      data = JSON.parse(message.data.toString());
    } catch (error) {
      Logger.error('Error processing RTDN', error);
      message.ack();
      return;
    }

    Logger.debug('Decoded RTDN message:', data);

    if (!data?.subscriptionNotification) {
      Logger.error('Invalid RTDN message format', data);
      message.ack();
      return;
    }

    const { purchaseToken } = data.subscriptionNotification;

    const subscription = await this.premiumService.findSubscriptionByPurchaseToken(purchaseToken);

    if (!subscription) {
      Logger.error('Subscription not found for purchase token', purchaseToken);
      message.ack();
      return;
    }

    await this.premiumService.redeemSubscription(subscription.akey, purchaseToken);

    message.ack();
  }
}