import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateLogDto {
  @IsString()
  @IsOptional()
  title: string;

  @IsBoolean()
  @IsOptional()
  isCharge = false;
}
