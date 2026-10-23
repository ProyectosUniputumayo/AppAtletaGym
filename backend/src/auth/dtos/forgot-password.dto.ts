import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'marlon@example.com', description: 'Correo electrónico registrado del usuario' })
  @IsEmail({}, { message: 'El formato del correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico no puede estar vacío' })
  email: string;
}