import { IsDate, IsNumber, IsOptional } from 'class-validator';

export class SyncDto {
  @IsDate()
  @IsOptional()
  timestamp: Date = new Date();

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
}
