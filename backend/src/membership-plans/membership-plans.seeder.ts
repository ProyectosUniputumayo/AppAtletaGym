import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipPlanEntity, PlanType } from './entities/membership-plan.entity.js';

@Injectable()
export class MembershipPlansSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(MembershipPlanEntity)
    private readonly planRepository: Repository<MembershipPlanEntity>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultPlans();
  }

  async seedDefaultPlans() {
    const count = await this.planRepository.count();
    
    // Si ya existen planes, no duplicamos nada
    if (count > 0) {
      return;
    }

    const defaultPlans = [
      // Planes por Tiempo
      { name: 'Básico', description: 'Plan mensual general', price: 70000, planType: PlanType.TIME, durationDays: 30 },
      { name: 'Estudiantil', description: 'Plan exclusivo para estudiantes con carnet', price: 60000, planType: PlanType.TIME, durationDays: 30 },
      { name: 'Uniputumayo', description: 'Plan especial para la comunidad UniPutumayo', price: 56000, planType: PlanType.TIME, durationDays: 30 },
      { name: 'Pareja', description: 'Plan mensual para dos personas', price: 120000, planType: PlanType.TIME, durationDays: 30 },
      { name: '6 meses', description: 'Plan semestral con descuento', price: 400000, planType: PlanType.TIME, durationDays: 180 },
      { name: '1 Año', description: 'Plan anual completo', price: 700000, planType: PlanType.TIME, durationDays: 365 },
      { name: 'Plan Kids', description: 'Plan mensual infantil', price: 50000, planType: PlanType.TIME, durationDays: 30 },

      // Paquetes por Sesiones
      { name: '1 Sesión', description: 'Pase diario al gimnasio', price: 8000, planType: PlanType.SESSION, durationDays: 1, sessions: 1 },
      { name: '10 Sesiones', description: 'Bono de 10 entradas', price: 40000, planType: PlanType.SESSION, durationDays: 15, sessions: 10 },
      { name: '15 Sesiones', description: 'Bono de 15 entradas', price: 55000, planType: PlanType.SESSION, durationDays: 30, sessions: 15 },
      { name: '30 Sesiones', description: 'Bono de 30 entradas', price: 120000, planType: PlanType.SESSION, durationDays: 60, sessions: 30 },
    ];

    for (const planData of defaultPlans) {
      const plan = this.planRepository.create(planData);
      await this.planRepository.save(plan);
    }

    console.log('✅ ¡Planes oficiales de Atleta x Gym sembrados exitosamente en la base de datos!');
  }
}