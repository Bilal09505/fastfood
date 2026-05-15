// apps/api/src/auth/dto/login.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

// apps/api/src/auth/dto/refresh-token.dto.ts
export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
