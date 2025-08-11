import { IsLatitude, IsLongitude, IsNumber, Min } from "class-validator";

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
  @Min(0)
  minKW: number = 50;
}