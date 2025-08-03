import { IsNotEmptyObject, IsNumber, IsUUID } from "class-validator";
import { Station } from "../schemas/station.schema";
import { LocationDto } from "./location.dto";

export class StationDto {
  constructor(station: Station) {
    this.uuid = station.UUID;
    this.location = new LocationDto(station.AddressInfo);
    this.maxKW = station.maxKW;
  }

  @IsUUID()
  uuid: string;

  @IsNotEmptyObject()
  location: LocationDto;

  @IsNumber()
  maxKW: number;
}