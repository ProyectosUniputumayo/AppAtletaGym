import { IsEmail, IsString, MinLength, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 1, description: 'Nuevo ID del rol asociado' })
  @IsOptional()
  @IsNumber()
  role_id?: number;


  @ApiPropertyOptional({ example: 'user.new@example.com', description: 'Nuevo correo electrónico' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'newsecurepassword123', description: 'Nueva contraseña (mínimo 6 caracteres)' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password_hash?: string;

  @ApiPropertyOptional({ example: true, description: 'Estado de actividad del usuario' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}