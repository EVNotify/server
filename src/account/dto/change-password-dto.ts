import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './account.dto';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)
  @ApiProperty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)
  @ApiProperty()
  newPassword: string;
}
