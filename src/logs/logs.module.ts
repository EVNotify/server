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
import { PremiumModule } from '../premium/premium.module';
import { Station, StationSchema } from '../stations/schemas/station.schema';
import { MissingStation, MissingStationSchema } from '../stations/schemas/missing-station.schema';
import { StationAssociationHandler } from './handler/station-association.handler';

@Module({
  controllers: [LogsController],
  imports: [
    AccountModule,
    MongooseModule.forFeature([
      { name: Log.name, schema: LogSchema },
      { name: LastSync.name, schema: LastSyncSchema },
      { name: Station.name, schema: StationSchema },
      { name: MissingStation.name, schema: MissingStationSchema },
    ]),
    PremiumModule,
  ],
  providers: [LogsService, MetadataHandler, LastSyncHandler, CronHandler, StationAssociationHandler],
  exports: [LogsService],
})
export class LogsModule {}
