import { Controller, Get, HttpException, HttpStatus, InternalServerErrorException, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "src/account/account.guard";
import { StationsService } from "./stations.service";
import { ListStationsFilterDto } from "./dto/list-stations.dto";
import { StationDto } from "./dto/station.dto";
import { RouteQueryDto } from "./dto/route-query.dto";
import { PremiumGuard } from "src/premium/premium.guard";
import { Premium } from "src/premium/decorators/premium.decorator";
import { RoutePlannedRecentlyException } from "./exceptions/route-planned-recently.exception";
import { RouteCalculationDto } from "./dto/route-calculation.dto";
import { RouteCalculatedRecentlyException } from "./exceptions/route-calculated-recently.exception";

@Controller('stations')
@UseGuards(AuthGuard)
@UseGuards(PremiumGuard)
@ApiTags('Stations')
export class StationsController {
  constructor(
    private readonly stationsService: StationsService,
  ) {}

  @Get(':akey')
  async list(
    @Param('akey') akey: string,
    @Query() dto: ListStationsFilterDto,
  ): Promise<StationDto[]> {
    try {
      return await this.stationsService.findNearby(dto, akey);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  @Get(':akey/nearest')
  async findNearest(
    @Param('akey') akey: string,
    @Query() dto: ListStationsFilterDto,
  ): Promise<StationDto> {
    try {
      return await this.stationsService.findNearest(dto, akey);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  @Get(':akey/plan-route')
  @Premium()
  async planRoute(
    @Param('akey') akey: string,
    @Query() dto: RouteQueryDto,
  ) {
    // TODO start + end soc, buffer, detour
    try {
      return await this.stationsService.planRoute(dto, akey);
    } catch (error) {
      if (error instanceof RoutePlannedRecentlyException) {
        throw new HttpException(error.message, HttpStatus.TOO_MANY_REQUESTS);
      }
      
      throw new InternalServerErrorException();
    }
  }

  @Get(':akey/calculate-route')
  @Premium()
  async calculateRoute(
    @Param('akey') akey: string,
    @Query() dto: RouteCalculationDto,
  ) {
    try {
      return await this.stationsService.calculateRoute(dto, akey);
    } catch (error) {
      if (error instanceof RouteCalculatedRecentlyException) {
        throw new HttpException(error.message, HttpStatus.TOO_MANY_REQUESTS);
      }

      throw new InternalServerErrorException();
    }
  }
}