import { IsLatitude, IsLongitude } from "class-validator";

export class ListStationsDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;
}