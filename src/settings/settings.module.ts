import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { AccountModule } from 'src/account/account.module';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
  imports: [AccountModule],
})
export class SettingsModule {}
