import { IsLatitude, IsLongitude } from "class-validator";

export class RouteCalculationDto {
  @IsLatitude()
  startLatitude: number;

  @IsLongitude()
  startLongitude: number;

  @IsLatitude()
  endLatitude: number;

  @IsLongitude()
  endLongitude: number;
}