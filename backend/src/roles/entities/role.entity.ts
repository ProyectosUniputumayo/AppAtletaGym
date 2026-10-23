import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import type { UserRoleEntity } from './user-role.entity.js';

@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  rol_name: string;

  @OneToMany('UserRoleEntity', (userRole: UserRoleEntity) => userRole.role)
  userRoles: UserRoleEntity[];
}