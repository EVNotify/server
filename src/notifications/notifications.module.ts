import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Settings, SettingsSchema } from 'src/settings/schemas/settings.schema';
import { SettingsService } from 'src/settings/settings.service';
import { NotificationHandler } from './handler/notification';
import { TelegramService } from './handler/strategies/telegram/telegram.service';
import { TelegramStrategy } from './handler/strategies/telegram/telegram.strategy';

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
  ],
})
export class NotificationsModule {}
