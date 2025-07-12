import { Controller, Get, InternalServerErrorException, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "src/account/account.guard";
import { StationsService } from "./stations.service";
import { ListStationsDto } from "./dto/list-stations.dto";

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
    @Query() dto: ListStationsDto,
  ) {
    try {
      return await this.stationsService.findNearby(dto);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}