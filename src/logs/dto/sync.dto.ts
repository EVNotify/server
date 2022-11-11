import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class SyncDto {
  @IsDateString()
  @IsOptional()
  timestamp: string;

  @IsNumber()
  @IsOptional()
  latitude: number;

  @IsNumber()
  @IsOptional()
  longitude: number;

  @IsNumber()
  @IsOptional()
  altitude: number;

  @IsNumber()
  @IsOptional()
  accuracy: number;

  @IsNumber()
  @IsOptional()
  speed: number;

  @IsBoolean()
  @IsOptional()
  charging: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  socDisplay: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  socBMS: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  soh: number;

  @IsBoolean()
  @IsOptional()
  slowChargePort: boolean;

  @IsBoolean()
  @IsOptional()
  normalChargePort: boolean;

  @IsBoolean()
  @IsOptional()
  rapidChargePort: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  odo: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  auxBatteryVoltage: number;

  @IsNumber()
  @IsOptional()
  dcBatteryVoltage: number;

  @IsNumber()
  @IsOptional()
  dcBatteryCurrent: number;

  @IsNumber()
  @IsOptional()
  dcBatteryPower: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  cec: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  ced: number;

  @IsNumber()
  @IsOptional()
  batteryMinTemperature: number;

  @IsNumber()
  @IsOptional()
  batteryMaxTemperature: number;

  @IsNumber()
  @IsOptional()
  batteryInletTemperature: number;

  @IsNumber()
  @IsOptional()
  outsideTemperature: number;
}
