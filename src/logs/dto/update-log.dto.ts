import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { TYPE } from '../entities/type.entity';

export class UpdateLogDto {
  @IsString()
  @IsOptional()
  title: string;

  @IsEnum(TYPE)
  @IsOptional()
  type: TYPE = TYPE.UNKNOWN;
}
