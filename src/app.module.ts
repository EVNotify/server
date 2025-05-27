import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountModule } from './account/account.module';
import { SettingsModule } from './settings/settings.module';
import { LogsModule } from './logs/logs.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MigrationModule } from './migration/migration.module';
import { PremiumModule } from './premium/premium.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    EventEmitterModule.forRoot(),
    MongooseModule.forRoot(process.env.DATABASE_URI),
    ScheduleModule.forRoot(),
    AccountModule,
    SettingsModule,
    LogsModule,
    MigrationModule,
    PremiumModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
