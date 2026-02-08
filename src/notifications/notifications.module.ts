import { Module } from '@nestjs/common';
import { NotificationHandler } from './handler/notifications.handler';
import { EmailStrategy } from './strategies/email.strategy';
import { SettingsService } from '../settings/settings.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Settings, SettingsSchema } from '../settings/schemas/settings.schema';
import { Log, LogSchema } from '../logs/schemas/log.schema';
import { TemplateCacheService } from './templates/template-cache.service';
import { TranslatorService } from '../translator/translator.service';
import { NotificationController } from './notification.controller';
import { AccountService } from '../account/account.service';
import { Account, AccountSchema } from '../account/schemas/account.schema';
import { TelegramStrategy } from './strategies/telegram.strategy';
import { TelegramService } from './strategies/telegram.service';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema },
    ]),
    MongooseModule.forFeature([
      { name: Settings.name, schema: SettingsSchema },
    ]),
    MongooseModule.forFeature([
      { name: Log.name, schema: LogSchema },
    ]),
    LogsModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationHandler,
    EmailStrategy,
    TelegramStrategy,
    AccountService,
    SettingsService,
    TemplateCacheService,
    TelegramService,
    TranslatorService,
  ],
  exports: [],
})
export class NotificationsModule {}
