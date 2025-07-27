import { RouteStationDto } from "./route-station.dto";

export class RouteDto {
  constructor(stations: RouteStationDto[]) {
    this.stations = stations;
  }

  stations: RouteStationDto[];
}