import {
  IsHash,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  akey: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 72)
  password: string;

  @IsOptional()
  @IsHash('sha512')
  passwordHash: string;

  @IsString()
  @IsOptional()
  @Length(2)
  token: string;
}
