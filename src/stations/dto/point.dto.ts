import { IsLatitude, IsLongitude } from "class-validator";

export class PointDto {
  constructor(coordinates: [number, number]) {
    this.lat = coordinates[0];
    this.lng = coordinates[1];
  }

  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;
}