import { IsLatitude, IsLongitude, IsNumber } from "class-validator";

export class RouteQueryDto {
  @IsLatitude()
  startLatitude: number;

  @IsLongitude()
  startLongitude: number;

  @IsLatitude()
  endLatitude: number;

  @IsLongitude()
  endLongitude: number;

  @IsNumber()
  minKW: number = 50;
}