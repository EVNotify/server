import { IsNotEmpty, IsString, Length } from 'class-validator';
import { TOKEN_LENGTH } from './account.dto';

export class LoginTokenDto {
  @IsString()
  @IsNotEmpty()
  @Length(TOKEN_LENGTH, TOKEN_LENGTH)
  token: string;
}
