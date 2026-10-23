import { IsString, IsNotEmpty, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...', description: 'Token temporal devuelto en forgot-password' })
  @IsString()
  @IsNotEmpty({ message: 'El token es obligatorio' })
  token: string;

  @ApiProperty({ example: '4829', description: 'Código de verificación de 4 dígitos recibido por correo' })
  @IsString()
  @IsNotEmpty({ message: 'El código de verificación es obligatorio' })
  @Length(4, 4, { message: 'El código debe tener exactamente 4 dígitos' })
  code: string;

  @ApiProperty({ example: 'newSecurePassword123', description: 'Nueva contraseña' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty()
  newPassword: string;
}