import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { TripType } from "../entitites/trip-type.entity";

export class CreateTripDto {
  @IsString()
  @IsOptional()
  name?: string;

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