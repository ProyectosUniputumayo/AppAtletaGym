import { Controller, Get, Post, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PeopleService } from './people.service.js';
import { UpdatePeopleDto } from './dtos/update-people.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('people')
@ApiBearerAuth() 
@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Obtener todas las personas (Solo Admin / SuperAdmin)' })
  async findAll() {
    return this.peopleService.obtenerPersonas();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Crear un perfil de persona manualmente' })
  async create(
    @Body() dto: { user_id: number; firstName: string; firstLastName: string; cellphone?: string; address?: string; gender?: string },
  ) {
    return this.peopleService.create(dto);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener persona por ID de usuario' })
  async findByUserId(@Param('userId') userId: string) {
    return this.peopleService.obtenerPersonaPorUserId(+userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener persona por ID de perfil' })
  async findById(@Param('id') id: string) {
    return this.peopleService.obtenerPersonaPorId(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Actualizar información de la persona (Dueño o Admin)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePeopleDto,
    @Req() req: any,
  ) {
    // req.user viene directamente del Token JWT decodificado por la JwtStrategy
    const currentUser = req.user; 
    return this.peopleService.actualizarPersona(+id, dto, currentUser);
  }
}