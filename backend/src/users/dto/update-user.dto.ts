import { IsEmail, IsString, MinLength, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsNumber()
  role_id?: number;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password_hash?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}