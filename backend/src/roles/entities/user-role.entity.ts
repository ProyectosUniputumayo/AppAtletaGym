import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import type { UserEntity } from '../../users/entities/user.entity.js'; 
import type { RoleEntity } from './role.entity.js'; // <--- Cambiado a import type

@Entity('user_roles')
export class UserRoleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  role_id: number;

  @ManyToOne('UserEntity', (user: UserEntity) => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne('RoleEntity', (role: RoleEntity) => role.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;
}