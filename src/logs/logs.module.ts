import { Module } from '@nestjs/common';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountModule } from '../account/account.module';
import { Log, LogSchema } from './schemas/log.schema';
import { MetadataHandler } from './handler/metadata';
import { LastSyncHandler } from './handler/last-sync';
import { LastSync, LastSyncSchema } from './schemas/last-sync.schema';
import { CronHandler } from './handler/cron';

@Module({
  controllers: [LogsController],
  providers: [LogsService, MetadataHandler, LastSyncHandler, CronHandler],
  imports: [
    AccountModule,
    MongooseModule.forFeature([
      { name: Log.name, schema: LogSchema },
      { name: LastSync.name, schema: LastSyncSchema },
    ]),
  ],
})
export class LogsModule {}
