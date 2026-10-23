import { IsEmail, IsString, MinLength, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'marlon@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'securepassword123' })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'Marlon' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Moncayo' })
  @IsString()
  @IsNotEmpty()
  firstLastName: string;

  @ApiPropertyOptional({ example: '3101234567' })
  @IsOptional()
  @IsString()
  cellphone?: string;

  @ApiPropertyOptional({ example: 'Calle Principal #123, Mocoa' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Masculino' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: 3, description: 'ID del rol inicial (ej. 3 para Atleta)' })
  @IsOptional()
  @IsNumber()
  role_id?: number;
}