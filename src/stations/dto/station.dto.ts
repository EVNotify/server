import { IsNotEmptyObject, IsNumber, IsUUID } from "class-validator";
import { Station } from "../schemas/station.schema";
import { LocationDto } from "./location.dto";

export class StationDto {
  constructor(station: Station, distanceInKm?: number) {
    this.uuid = station.UUID;
    this.location = new LocationDto(station.AddressInfo);
    this.maxKW = station.maxKW;
    this.distanceInKm = parseFloat(distanceInKm?.toFixed(2)) || null;
  }

  @IsUUID()
  uuid: string;

  @IsNotEmptyObject()
  location: LocationDto;

  @IsNumber()
  maxKW: number;

  @IsNumber()
  distanceInKm?: number;
}