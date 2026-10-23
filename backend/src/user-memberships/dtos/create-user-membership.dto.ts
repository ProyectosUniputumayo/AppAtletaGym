import { IsNotEmpty, IsUUID, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserMembershipDto {
  @ApiProperty({ description: 'ID del plan de membresía del catálogo' })
  @IsUUID('4', { message: 'El ID del plan debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El plan de membresía es obligatorio' })
  membershipPlanId: string;

  @ApiPropertyOptional({ description: 'Correo electrónico (necesario si paga como invitado)' })
  @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
  @IsOptional()
  email?: string;
}