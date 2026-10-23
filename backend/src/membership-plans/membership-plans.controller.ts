import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MembershipPlansService } from './membership-plans.service.js';
import { CreateMembershipPlanDto } from './dtos/create-membership-plan.dto.js';
import { UpdateMembershipPlanDto } from './dtos/update-membership-plan.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'; // Ajusta la ruta de tu guard si es necesario

@ApiTags('Membership Plans (Planes de Membresía)')
@Controller('membership-plans')
export class MembershipPlansController {
  constructor(private readonly plansService: MembershipPlansService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo plan de membresía' })
  @ApiResponse({ status: 201, description: 'Plan creado exitosamente' })
  create(@Body() dto: CreateMembershipPlanDto) {
    return this.plansService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los planes de membresía activos' })
  @ApiResponse({ status: 200, description: 'Lista de planes obtenida exitosamente' })
  findAll() {
    return this.plansService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un plan de membresía por su ID' })
  @ApiResponse({ status: 200, description: 'Plan encontrado' })
  @ApiResponse({ status: 404, description: 'Plan no encontrado' })
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un plan de membresía existente' })
  @ApiResponse({ status: 200, description: 'Plan actualizado exitosamente' })
  update(@Param('id') id: string, @Body() dto: UpdateMembershipPlanDto) {
    return this.plansService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar lógicamente un plan de membresía' })
  @ApiResponse({ status: 200, description: 'Plan desactivado exitosamente' })
  remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }
}