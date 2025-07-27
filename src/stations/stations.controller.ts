import { Controller, Get, InternalServerErrorException, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "src/account/account.guard";
import { StationsService } from "./stations.service";
import { ListStationsFilterDto } from "./dto/list-stations.dto";
import { StationDto } from "./dto/station.dto";
import { RouteQueryDto } from "./dto/route-query.dto";

@Controller('stations')
@UseGuards(AuthGuard)
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
      return await this.stationsService.findNearby(dto);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  @Get(':akey/plan-route')
  async planRoute(
    @Param('akey') akey: string,
    @Query() dto: RouteQueryDto,
  ) {
    // TODO start + end soc, buffer, detour, charge power
    try {
      return await this.stationsService.planRoute(dto);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}