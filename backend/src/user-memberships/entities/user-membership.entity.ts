import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

import type { PersonEntity } from '../../people/entities/person.entity.js'; // Solo import type para TypeScript
import { MembershipPlanEntity } from '../../membership-plans/entities/membership-plan.entity.js';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REJECTED = 'rejected',
}

@Entity('user_memberships')
export class UserMembershipEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;


  @ManyToOne('PersonEntity', (person: PersonEntity) => person.memberships, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'person_id' })
  person: PersonEntity;

  @ManyToOne(() => MembershipPlanEntity, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'membership_plan_id' })
  membershipPlan: MembershipPlanEntity;

  @Column({ type: 'datetime', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'datetime', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'int', name: 'sessions_remaining', nullable: true })
  sessionsRemaining?: number;

  @Column({ 
    type: 'enum', 
    enum: PaymentStatus, 
    default: PaymentStatus.PENDING,
    name: 'payment_status' 
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'amount_paid' })
  amountPaid: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}