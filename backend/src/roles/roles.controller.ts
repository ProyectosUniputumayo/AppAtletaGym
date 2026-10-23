import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { RolesService } from './roles.service.js';
import { RoleEntity } from './entities/role.entity.js';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll(): Promise<RoleEntity[]> {
    return this.rolesService.findAll();
  }

  @Post()
  async create(@Body('rol_name') rol_name: string): Promise<RoleEntity> {
    return this.rolesService.create(rol_name);
  }

  // <--- Nuevo endpoint DELETE
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.rolesService.remove(+id);
    return { message: `Rol con ID ${id} eliminado exitosamente` };
  }
}