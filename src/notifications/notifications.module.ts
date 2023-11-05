import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Settings, SettingsSchema } from 'src/settings/schemas/settings.schema';
import { SettingsService } from 'src/settings/settings.service';
import { NotificationHandler } from './handler/notification';
import { TelegramStrategy } from './strategies/telegram/telegram.strategy';
import { TelegramService } from './strategies/telegram/telegram.service';
import { EmailService } from './strategies/email/email.service';
import { EmailStrategy } from './strategies/email/email.strategy';
import { LogsService } from '../logs/logs.service';
import { Log, LogSchema } from '../logs/schemas/log.schema';
import { LastSync, LastSyncSchema } from '../logs/schemas/last-sync.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Settings.name, schema: SettingsSchema },
    ]),
    MongooseModule.forFeature([
      { name: Log.name, schema: LogSchema },
      { name: LastSync.name, schema: LastSyncSchema },
    ]),
  ],
  providers: [
    LogsService,
    NotificationHandler,
    SettingsService,
    TelegramStrategy,
    TelegramService,
    EmailService,
    EmailStrategy,
  ],
})
export class NotificationsModule {}
