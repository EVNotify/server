import { BadRequestException, Body, Controller, Get, InternalServerErrorException, NotFoundException, Param, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { TripNotifyService } from "./tripnotify.service";
import { TripDto } from "./dto/trip.dto";
import { AuthGuard } from "src/account/account.guard";
import { Guest } from "src/account/decorators/guest.decorator";
import { CreateTripDto } from "./dto/create-trip.dto";
import { TripNotExistsException } from "./exceptions/trip-not-exists.exception";
import { TripCreationException } from "./exceptions/trip-creation.exception";
import { LogsService } from "src/logs/logs.service";
import { HISTORY_TYPE } from "src/logs/entities/history-type.entity";
import { LogDto } from "src/logs/dto/log.dto";
import { STATUS } from "src/logs/entities/status.entity";
import { LogWithHistoryDto } from "./dto/log-with-history.dto";
import { Premium } from "src/premium/decorators/premium.decorator";
import { PremiumGuard } from "src/premium/premium.guard";

@Controller('trips')
@UseGuards(AuthGuard)
@UseGuards(PremiumGuard)
@ApiTags('TripNotify')
export class TripNotifyController {
  constructor(
    private readonly logsService: LogsService,
    private readonly tripNotifyService: TripNotifyService,
  ) {}

  @Get(':code')
  @Guest()
  async getActiveTripByCode(
    @Param('code') code: string,
  ): Promise<TripDto> {
    try {
      return new TripDto(await this.tripNotifyService.findAccessibleByCode(code));
    } catch (error) {
      if (error instanceof TripNotExistsException) {
        throw new NotFoundException(error.message);
      }

      throw new InternalServerErrorException();
    }
  }

  @Post(':akey')
  @Premium()
  async createTrip(
    @Param('akey') akey: string,
    @Body() createTripDto: CreateTripDto,
  ): Promise<TripDto> {
    try {
      return new TripDto(await this.tripNotifyService.create(akey, createTripDto));
    } catch (error) {
      if (error instanceof TripCreationException) {
        throw new BadRequestException(error.message);
      }

      throw new InternalServerErrorException();
    }
  }

  @Get(':code/info')
  @Guest()
  async tripInformation(
    @Param('code') code: string,
  ): Promise<LogDto[]> {
    try {
      const trip = await this.tripNotifyService.findAccessibleByCode(code);

      const logs = await this.logsService.findLogsWithinDateRange(trip.akey, trip.startDate, trip.endDate);

      for(const log of logs) {
        log.history = await this.logsService.findOneWithHistory(log.akey, log._id.toString(), trip.locationEnabled ? HISTORY_TYPE.ALL : HISTORY_TYPE.BATTERY_DATA);

        if (log.startDate < trip.startDate || log.endDate > trip.endDate || log.status === STATUS.RUNNING) {
          log.history = log.history.filter((entry) => new Date(entry.timestamp) <= trip.endDate);
        }
      }


      return logs.map((log) => new LogWithHistoryDto(log));
    } catch (error) {
      if (error instanceof TripNotExistsException) {
        throw new NotFoundException(error.message);
      }

      throw new InternalServerErrorException();
    }
  }
}