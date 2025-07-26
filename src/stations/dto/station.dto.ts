import { IsNotEmpty, IsNotEmptyObject, IsUUID } from "class-validator";
import { Station } from "../schemas/station.schema";
import { LocationDto } from "./location.dto";

export class StationDto {
  constructor(station: Station) {
    this.uuid = station.UUID;
    this.location = new LocationDto(station.AddressInfo);
  }

  @IsUUID()
  uuid: string;

  @IsNotEmptyObject()
  location: LocationDto;
}