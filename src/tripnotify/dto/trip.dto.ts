import { IsDate, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Trip } from "../schemas/trip.schema";

export class TripDto {
  constructor(trip: Trip) {
    this.name = trip.name;
    this.code = trip.code;
    this.start = trip.startDate;
    this.end = trip.endDate;
  }

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsDate()
  @IsNotEmpty()
  start: Date;

  @IsDate()
  @IsNotEmpty()
  end: Date;
}