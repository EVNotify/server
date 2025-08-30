import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { StationsController } from "./stations.controller";
import { StationsService } from "./stations.service";
import { Station, StationSchema } from "./schemas/station.schema";
import { HttpModule } from "@nestjs/axios";
import { AccountModule } from "src/account/account.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Account, AccountSchema } from "src/account/schemas/account.schema";
import { PremiumModule } from "src/premium/premium.module";

@Module({
  controllers: [StationsController],
  providers: [StationsService],
  imports: [
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema}
    ]),
    MongooseModule.forFeature([
      { name: Station.name, schema: StationSchema}
    ]),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: 10000,
        maxRedirects: 1,
        headers: {
          'User-Agent': 'EVNotify',
          'X-API-Key': process.env.OPEN_CHARGE_MAP_API_KEY,
        }
      }),
      inject: [ConfigService],
    }),
    AccountModule,
    PremiumModule,
  ],
})

export class StationsModule {}