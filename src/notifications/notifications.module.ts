import { Module } from '@nestjs/common';
import { NotificationHandler } from './handler/notifications.handler';
import { EmailStrategy } from './strategies/email.strategy';
import { SettingsService } from 'src/settings/settings.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Settings, SettingsSchema } from 'src/settings/schemas/settings.schema';
import { Log, LogSchema } from 'src/logs/schemas/log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Settings.name, schema: SettingsSchema },
    ]),
    MongooseModule.forFeature([
      { name: Log.name, schema: LogSchema },
    ]),
  ],
  controllers: [],
  providers: [
    NotificationHandler,
    EmailStrategy,
    SettingsService,
  ],
  exports: [],
})
export class NotificationsModule {}
