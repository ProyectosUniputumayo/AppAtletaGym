import { IsEmail, IsNotEmpty, IsString, MinLength, IsNumber } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsNumber()
  role_id: number;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password_hash: string;
}