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
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TripNotifyModule } from './tripnotify/tripnotify.module';

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
    TripNotifyModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/frontend',
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
