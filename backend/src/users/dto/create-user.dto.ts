import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsInt, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 1, description: 'ID del rol asociado al usuario' })
  @IsInt()
  @IsNotEmpty()
  role_id: number;


  @ApiProperty({ example: 'rootn@example.com', description: 'Correo electrónico del usuario' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'securepassword123', description: 'Contraseña encriptada o texto plano para hash' })
  @IsString()
  @IsNotEmpty()
  password_hash: string;
}