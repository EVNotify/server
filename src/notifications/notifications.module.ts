import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Settings, SettingsSchema } from 'src/settings/schemas/settings.schema';
import { SettingsService } from 'src/settings/settings.service';
import { NotificationHandler } from './handler/notification';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Settings.name, schema: SettingsSchema },
    ]),
  ],
  providers: [NotificationHandler, SettingsService],
})
export class NotificationsModule {}
