import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { AccountModule } from 'src/account/account.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Settings, SettingsSchema } from './schemas/settings.schema';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
  imports: [
    AccountModule,
    MongooseModule.forFeature([
      { name: Settings.name, schema: SettingsSchema },
    ]),
  ],
})
export class SettingsModule {}
