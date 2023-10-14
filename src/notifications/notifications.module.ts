import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Settings, SettingsSchema } from 'src/settings/schemas/settings.schema';
import { SettingsService } from 'src/settings/settings.service';
import { NotificationHandler } from './handler/notification';
import { TelegramStrategy } from './strategies/telegram/telegram.strategy';
import { TelegramService } from './strategies/telegram/telegram.service';
import { EmailService } from './strategies/email/email.service';
import { EmailStrategy } from './strategies/email/email.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Settings.name, schema: SettingsSchema },
    ]),
  ],
  providers: [
    NotificationHandler,
    SettingsService,
    TelegramStrategy,
    TelegramService,
    EmailService,
    EmailStrategy,
  ],
})
export class NotificationsModule {}
