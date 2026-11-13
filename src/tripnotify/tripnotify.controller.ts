import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { TripNotifyService } from './tripnotify.service';
import { TripDto } from './dto/trip.dto';
import { AuthGuard } from 'src/account/account.guard';
import { Guest } from 'src/account/decorators/guest.decorator';
import { CreateTripDto } from './dto/create-trip.dto';
import { TripNotExistsException } from './exceptions/trip-not-exists.exception';
import { TripCreationException } from './exceptions/trip-creation.exception';
import { LogsService } from 'src/logs/logs.service';
import { HISTORY_TYPE } from 'src/logs/entities/history-type.entity';
import { Premium } from 'src/premium/decorators/premium.decorator';
import { PremiumGuard } from 'src/premium/premium.guard';
import { TripNotStartedException } from './exceptions/trip-not-started.exception';
import { TripMissingPremiumException } from './exceptions/trip-missing-premium.exception';
import { TripInformationDto } from './dto/trip-information.dto';
import { sharedLog } from './utils/shared-log';

@Controller('trips')
@UseGuards(AuthGuard)
@UseGuards(PremiumGuard)
@ApiSecurity('custom-auth')
@ApiTags('TripNotify')
export class TripNotifyController {
  constructor(
    private readonly logsService: LogsService,
    private readonly tripNotifyService: TripNotifyService,
  ) {}

  @Get(':akey/list')
  async getActiveTripsByAKey(@Param('akey') akey: string): Promise<TripDto[]> {
    try {
      return (await this.tripNotifyService.findAccessibleByAkey(akey)).map(
        (trip) => new TripDto(trip),
      );
    } catch {
      throw new InternalServerErrorException();
    }
  }

  @Get(':code')
  @Guest()
  async getActiveTripByCode(@Param('code') code: string): Promise<TripDto> {
    try {
      return new TripDto(
        await this.tripNotifyService.findAccessibleByCode(code),
      );
    } catch (error) {
      if (error instanceof TripNotExistsException) {
        throw new NotFoundException(error.message);
      } else if (
        error instanceof TripNotStartedException ||
        error instanceof TripMissingPremiumException
      ) {
        throw new ForbiddenException(error.message);
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
      return new TripDto(
        await this.tripNotifyService.create(akey, createTripDto),
      );
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
  ): Promise<TripInformationDto> {
    try {
      const trip = await this.tripNotifyService.findAccessibleByCode(code);

      const logs = await this.logsService.findLogsWithinDateRange(
        trip.akey,
        trip.startDate,
        trip.endDate,
      );

      const now = new Date();
      const sharedLogs = [];
      for (const log of logs) {
        // Calculate on the bounded raw samples, then strip private fields.
        const history = await this.logsService.findOneWithHistory(
          log.akey,
          log._id.toString(),
          HISTORY_TYPE.ALL,
        );
        const view = sharedLog(log, history, trip, now);
        if (view) {
          sharedLogs.push(view);
        }
      }

      return new TripInformationDto(sharedLogs);
    } catch (error) {
      if (error instanceof TripNotExistsException) {
        throw new NotFoundException(error.message);
      } else if (
        error instanceof TripNotStartedException ||
        error instanceof TripMissingPremiumException
      ) {
        throw new ForbiddenException(error.message);
      }

      throw new InternalServerErrorException();
    }
  }

  @Delete(':akey/:code')
  async deleteTrip(@Param('akey') akey: string, @Param('code') code: string) {
    try {
      return await this.tripNotifyService.deleteTrip(akey, code);
    } catch (error) {
      if (error instanceof TripNotExistsException) {
        throw new NotFoundException(error.message);
      }

      throw new InternalServerErrorException();
    }
  }
}
