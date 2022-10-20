import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountModule } from './account/account.module';
import { SettingsModule } from './settings/settings.module';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    EventEmitterModule.forRoot(),
    MongooseModule.forRoot(process.env.DATABASE_URI),
    AccountModule,
    SettingsModule,
    LogsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
