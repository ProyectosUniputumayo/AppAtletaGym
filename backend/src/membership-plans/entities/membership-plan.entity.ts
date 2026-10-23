import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PlanType {
  TIME = 'time',        
  SESSION = 'session',   
}

@Entity('membership_plans')
export class MembershipPlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string; // Ej: "Básico", "Estudiantil", "Uniputumayo", "Pareja", "6 meses", "1 Año", "Plan Kids", "10 Sesiones"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ 
    type: 'enum', 
    enum: PlanType, 
    default: PlanType.TIME,
    name: 'plan_type' 
  })
  planType: PlanType;

  @Column({ type: 'int', name: 'duration_days', nullable: true })
  durationDays: number; // Para planes de tiempo: 30 días, 180 días (6 meses), 365 días (1 año), o vigencia en sesiones (15, 30, 60 días)

  @Column({ type: 'int', nullable: true })
  sessions: number; // Solo aplica si es por sesiones (Ej: 1, 10, 15, 30). Null para los mensuales.

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}