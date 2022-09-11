import { IsNotEmpty } from 'class-validator';

export class CreateAccountDto {
  @IsNotEmpty()
  akey: string;

  @IsNotEmpty()
  passwordHash: string;
}
