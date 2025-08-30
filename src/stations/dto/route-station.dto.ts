import { Station } from "../schemas/station.schema";
import { StationDto } from "./station.dto";

export class RouteStationDto {
  constructor(station: Station, routeDistance: number, startDistance: number) {
    this.station = new StationDto(station, startDistance);
    this.distanceToRouteKm = parseFloat(routeDistance.toFixed(2));
    this.distanceToStartKm = parseFloat(startDistance.toFixed(2));
  }

  station: StationDto;

  distanceToRouteKm: number;

  distanceToStartKm: number;
}