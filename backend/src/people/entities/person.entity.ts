import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import type { UserEntity } from '../../users/entities/user.entity.js';
import { UserMembershipEntity } from '../../user-memberships/entities/user-membership.entity.js';


@Entity('people')
export class PersonEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, unique: true, name: 'user_id' })
  user_id?: number;

  @Column({ type: 'varchar', length: 30, unique: true, nullable: true, name: 'document_number' })
  documentNumber?: string; // Cédula o documento (esencial para la recepción)

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 100, name: 'first_last_name' })
  firstLastName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cellphone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender?: string;

  @Column({ type: 'boolean', default: false, name: 'is_student_discount' })
  isStudentDiscount: boolean; // Para convenios de la UniPutumayo

  @Column({ type: 'text', nullable: true, name: 'avatar_url' })
  avatarUrl?: string;

  @OneToOne('UserEntity', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @OneToMany(() => UserMembershipEntity, (membership) => membership.person)
  memberships: UserMembershipEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}