import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { TripNotifyService } from "./tripnotify.service";
import { TripDto } from "./dto/trip.dto";
import { AuthGuard } from "src/account/account.guard";
import { Guest } from "src/account/decorators/guest.decorator";
import { CreateTripDto } from "./dto/create-trip.dto";

@Controller('trips')
@UseGuards(AuthGuard)
@ApiTags('TripNotify')
export class TripNotifyController {
  constructor(private readonly tripNotifyService: TripNotifyService) {}

  @Get(':code')
  @Guest()
  async getActiveTripByCode(
    @Param('code') code: string,
  ): Promise<TripDto> {
    return await this.tripNotifyService.findByCode(code);
  }

  @Post(':akey')
  async createTrip(
    @Param('akey') akey: string,
    @Body() createTripDto: CreateTripDto,
  ) {
    return await this.tripNotifyService.create(akey, createTripDto);
  }
}