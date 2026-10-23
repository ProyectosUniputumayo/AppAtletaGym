import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from './entities/role.entity.js';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async onModuleInit() {
    await this.initializeDefaultRoles();
  }

  private async initializeDefaultRoles() {
    const defaultRoles = [
      { rol_name: 'SuperAdmin' },
      { rol_name: 'Admin' },
      { rol_name: 'User' },
    ];

    for (const roleData of defaultRoles) {
      const existsByName = await this.roleRepository.findOne({
        where: { rol_name: roleData.rol_name },
      });
      if (!existsByName) {
        await this.roleRepository.save(roleData);
      }
    }
  }

  async findAll(): Promise<RoleEntity[]> {
    return this.roleRepository.find();
  }

  async create(rol_name: string): Promise<RoleEntity> {
    const newRole = this.roleRepository.create({ rol_name });
    return this.roleRepository.save(newRole);
  }

  // <--- Nuevo método para eliminar
  async remove(id: number): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }
    await this.roleRepository.remove(role);
  }
}