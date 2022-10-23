import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { CARS } from '../entities/car.entity';
import { CONSUMPTION_UNITS } from '../entities/consumption.entity';
import { LANGUAGES } from '../entities/language.entity';
import { RANGE_UNITS } from '../entities/range.entity';
import { Settings } from '../schemas/settings.schema';

export const FIELDS = [
  'logSummary',
  'socThreshold',
  'language',
  'car',
  'capacity',
  'consumption',
  'consumptionUnit',
  'rangeUnit',
  'device',
];

export class SettingDto {
  constructor(settings: Settings | null) {
    this.logSummary = settings?.logSummary;
    this.socThreshold = settings?.socThreshold;
    this.language = settings?.language;
    this.car = settings?.car;
    this.capacity = settings?.capacity;
    this.consumption = settings?.consumption;
    this.consumptionUnit = settings?.consumptionUnit;
    this.rangeUnit = settings?.rangeUnit;
    this.device = settings?.device;
  }

  @IsBoolean()
  @IsOptional()
  logSummary: boolean;

  @IsNumber()
  @Min(10)
  @Max(100)
  @IsOptional()
  socThreshold: number;

  @IsEnum(LANGUAGES)
  @IsOptional()
  language: string;

  @IsEnum(CARS)
  @IsOptional()
  car: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  capacity: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  consumption: number;

  @IsEnum(CONSUMPTION_UNITS)
  @IsOptional()
  consumptionUnit: string;

  @IsEnum(RANGE_UNITS)
  @IsOptional()
  rangeUnit: string;

  @IsString()
  @IsOptional()
  device: string;
}
