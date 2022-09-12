import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  akey: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 72)
  password: string;
}
