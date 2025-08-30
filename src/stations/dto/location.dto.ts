import { IsLatitude, IsLongitude } from "class-validator";
import { AddressInfo } from "../schemas/address-info.schema";

export class LocationDto {
  constructor(addressInfo: AddressInfo) {
    this.latitude = addressInfo.Latitude;
    this.longitude = addressInfo.Longitude;
    this.title = addressInfo.Title;
    this.street = addressInfo.AddressLine1;
    this.zipCode = addressInfo.Postcode;
    this.city = addressInfo.Town;
  }

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  title?: string;

  street?: string;

  zipCode?: string;

  city?: string;
}