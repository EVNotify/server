import { PointDto } from "./point.dto";

export class RoutePointsDto {
  constructor(points: PointDto[]) {
    this.points = points;
  }

  points: PointDto[];
}