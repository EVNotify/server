import { BadRequestException, Body, Controller, Get, InternalServerErrorException, NotFoundException, Param, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { TripNotifyService } from "./tripnotify.service";
import { TripDto } from "./dto/trip.dto";
import { AuthGuard } from "src/account/account.guard";
import { Guest } from "src/account/decorators/guest.decorator";
import { CreateTripDto } from "./dto/create-trip.dto";
import { TripNotExistsException } from "./exceptions/trip-not-exists.exception";
import { TripCreationException } from "./exceptions/trip-creation.exception";

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
    try {
      return await this.tripNotifyService.findByCode(code);      
    } catch (error) {
      if (error instanceof TripNotExistsException) {
        throw new NotFoundException(error.message);
      }

      throw new InternalServerErrorException();
    }
  }

  @Post(':akey')
  async createTrip(
    @Param('akey') akey: string,
    @Body() createTripDto: CreateTripDto,
  ) {
    try {
      return await this.tripNotifyService.create(akey, createTripDto);      
    } catch (error) {
      if (error instanceof TripCreationException) {
        throw new BadRequestException(error.message);
      }

      throw new InternalServerErrorException();
    }
  }
}