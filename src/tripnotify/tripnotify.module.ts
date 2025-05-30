import { Module } from "@nestjs/common";
import { TripNotifyController } from "./tripnotify.controller";
import { TripNotifyService } from "./tripnotify.service";
import { TripNotifyGateway } from "./tripnotify.gateway";
import { MongooseModule } from "@nestjs/mongoose";
import { Trip, TripSchema } from "./schemas/trip.schema";

@Module({
  controllers: [TripNotifyController],
  providers: [TripNotifyService, TripNotifyGateway],
  imports: [
    MongooseModule.forFeature([
      { name: Trip.name, schema: TripSchema },
    ]),
  ],
})
export class TripNotifyModule {}
