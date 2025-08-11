import { IsLatitude, IsLongitude, IsNumber, Min } from "class-validator";

export class ListStationsFilterDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsNumber()
  @Min(0)
  minKW: number = 0;
}