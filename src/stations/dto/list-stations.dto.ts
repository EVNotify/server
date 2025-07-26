import { IsLatitude, IsLongitude } from "class-validator";

export class ListStationsFilterDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;
}