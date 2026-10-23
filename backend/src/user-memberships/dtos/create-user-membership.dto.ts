import { IsNotEmpty, IsUUID, IsEmail, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserMembershipDto {
  @ApiProperty({ description: 'ID del plan de membresía del catálogo' })
  @IsUUID('4', { message: 'El ID del plan debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El plan de membresía es obligatorio' })
  membershipPlanId: string;

  @ApiPropertyOptional({ description: 'Cédula o documento de identidad (Obligatorio para recepción y pre-registro web)' })
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico (Obligatorio para compras o registros digitales)' })
  @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Nombre' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Apellido' })
  @IsString()
  @IsOptional()
  firstLastName?: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto' })
  @IsString()
  @IsOptional()
  cellphone?: string;

  @ApiPropertyOptional({ description: 'Aplica al convenio de la UniPutumayo' })
  @IsBoolean()
  @IsOptional()
  isStudentDiscount?: boolean;

  @ApiPropertyOptional({ description: 'Tipo de pago: "wompi" (online) o "manual" (efectivo/nequi en recepción)' })
  @IsString()
  @IsOptional()
  paymentType?: 'wompi' | 'manual';
}