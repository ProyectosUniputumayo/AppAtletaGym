import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsBoolean, Min, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanType } from '../entities/membership-plan.entity.js';

export class CreateMembershipPlanDto {
  @ApiProperty({ example: 'Estudiantil', description: 'Nombre del plan de membresía' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del plan es obligatorio' })
  name: string;

  @ApiPropertyOptional({ example: 'Plan exclusivo para estudiantes con carnet vigente', description: 'Descripción detallada' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 60000, description: 'Costo del plan' })
  @IsNumber({}, { message: 'El precio debe ser un número válido' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  price: number;

  @ApiProperty({ enum: PlanType, example: PlanType.TIME, description: 'Tipo de plan: time (tiempo) o session (sesiones)' })
  @IsEnum(PlanType, { message: 'El tipo de plan debe ser time o session' })
  planType: PlanType;

  @ApiProperty({ example: 30, description: 'Duración en días o vigencia del plan' })
  @IsInt({ message: 'La duración en días debe ser un número entero' })
  @Min(1, { message: 'La duración debe ser al menos de 1 día' })
  durationDays: number;

  @ApiPropertyOptional({ example: 10, description: 'Cantidad de sesiones (solo aplica si el plan es de tipo session)' })
  @IsInt({ message: 'Las sesiones deben ser un número entero' })
  @IsOptional()
  sessions?: number;

  @ApiPropertyOptional({ example: true, description: 'Estado activo del plan' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}