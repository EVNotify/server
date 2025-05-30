import { IsBoolean, IsDateString, IsEnum } from "class-validator";
import { TripType } from "../entitites/trip-type.entity";

export class CreateTripDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsBoolean()
  locationEnabled: boolean;

  @IsBoolean()
  accessibleAfterEnd: boolean;

  @IsEnum(TripType)
  type: TripType;
}