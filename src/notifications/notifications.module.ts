import { Module } from '@nestjs/common';
import { NotificationHandler } from './handler/notifications.handler';
import { EmailStrategy } from './strategies/email.strategy';
import { SettingsService } from 'src/settings/settings.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Settings, SettingsSchema } from 'src/settings/schemas/settings.schema';
import { Log, LogSchema } from 'src/logs/schemas/log.schema';
import { TemplateCacheService } from './templates/template-cache.service';
import { TranslatorService } from 'src/translator/translator.service';
import { NotificationController } from './notification.controller';
import { AccountService } from 'src/account/account.service';
import { Account, AccountSchema } from 'src/account/schemas/account.schema';

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
  ],
  controllers: [NotificationController],
  providers: [
    NotificationHandler,
    EmailStrategy,
    AccountService,
    SettingsService,
    TemplateCacheService,
    TranslatorService,
  ],
  exports: [],
})
export class NotificationsModule {}
