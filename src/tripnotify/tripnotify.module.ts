import { Module } from "@nestjs/common";
import { TripNotifyController } from "./tripnotify.controller";
import { TripNotifyService } from "./tripnotify.service";
import { TripNotifyGateway } from "./tripnotify.gateway";
import { MongooseModule } from "@nestjs/mongoose";
import { Trip, TripSchema } from "./schemas/trip.schema";
import { AccountModule } from "src/account/account.module";
import { LogsModule } from "src/logs/logs.module";

@Module({
  controllers: [TripNotifyController],
  providers: [TripNotifyService, TripNotifyGateway],
  imports: [
    MongooseModule.forFeature([
      { name: Trip.name, schema: TripSchema },
    ]),
    AccountModule,
    LogsModule,
  ],
})
export class TripNotifyModule {}
