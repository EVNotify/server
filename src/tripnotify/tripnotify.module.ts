import { Module } from "@nestjs/common";
import { TripNotifyController } from "./tripnotify.controller";
import { TripNotifyService } from "./tripnotify.service";
import { TripNotifyGateway } from "./tripnotify.gateway";
import { MongooseModule } from "@nestjs/mongoose";
import { Trip, TripSchema } from "./schemas/trip.schema";
import { AccountModule } from "src/account/account.module";
import { LogsModule } from "src/logs/logs.module";
import { PremiumModule } from "src/premium/premium.module";
import { TripNotifyHandler } from "./handler/tripnotify.handler";

@Module({
  controllers: [TripNotifyController],
  providers: [TripNotifyService, TripNotifyGateway, TripNotifyHandler],
  imports: [
    MongooseModule.forFeature([
      { name: Trip.name, schema: TripSchema },
    ]),
    AccountModule,
    LogsModule,
    PremiumModule,
  ],
})
export class TripNotifyModule {}
