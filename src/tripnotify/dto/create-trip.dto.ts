import { IsBoolean, IsDate, IsEnum } from "class-validator";
import { TripType } from "../entitites/trip-type.entity";

export class CreateTripDto {
  @IsDate()
  startDate: Date;

  @IsDate()
  endDate: Date;

  @IsBoolean()
  locationEnabled: boolean;

  @IsBoolean()
  accessibleAfterEnd: boolean;

  @IsEnum(TripType)
  type: TripType;
}