import { Controller, Get, InternalServerErrorException, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "src/account/account.guard";
import { StationsService } from "./stations.service";
import { ListStationsFilterDto } from "./dto/list-stations.dto";

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
  ) {
    try {
      return await this.stationsService.findNearby(dto);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}