import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RoleEntity } from '../roles/entities/role.entity.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { PersonEntity } from '../people/entities/person.entity.js';
import { UserRoleEntity } from '../roles/entities/user-role.entity.js';
import { MembershipPlanEntity, PlanType } from '../membership-plans/entities/membership-plan.entity.js';
import { UserMembershipEntity, PaymentStatus } from '../user-memberships/entities/user-membership.entity.js';

@Injectable()
export class DatabaseSeeder implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeeder.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    this.logger.log('Verificando datos del establecimiento en la base de datos...');
    await this.seedRoles();
    await this.seedPlans();
    await this.seedUsers();
    await this.seedMemberships();
    this.logger.log('Verificación/seeding completado.');
  }

  private async seedRoles() {
    const repo = this.dataSource.getRepository(RoleEntity);
    for (const name of ['SuperAdmin', 'Admin', 'User']) {
      const exists = await repo.findOne({ where: { rol_name: name } });
      if (!exists) {
        await repo.save(repo.create({ rol_name: name }));
      }
    }
  }

  private async seedPlans() {
    const repo = this.dataSource.getRepository(MembershipPlanEntity);
    if ((await repo.count()) > 0) return;

    const defaultPlans = [
      { name: 'Básico', description: 'Plan mensual general', price: 70000, planType: PlanType.TIME, durationDays: 30 },
      { name: 'Estudiantil', description: 'Plan exclusivo para estudiantes con carnet', price: 60000, planType: PlanType.TIME, durationDays: 30 },
      { name: 'Uniputumayo', description: 'Plan especial para la comunidad UniPutumayo', price: 56000, planType: PlanType.TIME, durationDays: 30 },
      { name: 'Pareja', description: 'Plan mensual para dos personas', price: 120000, planType: PlanType.TIME, durationDays: 30 },
      { name: '6 meses', description: 'Plan semestral con descuento', price: 400000, planType: PlanType.TIME, durationDays: 180 },
      { name: '1 Año', description: 'Plan anual completo', price: 700000, planType: PlanType.TIME, durationDays: 365 },
      { name: 'Plan Kids', description: 'Plan mensual infantil', price: 50000, planType: PlanType.TIME, durationDays: 30 },
      { name: '1 Sesión', description: 'Pase diario al gimnasio', price: 8000, planType: PlanType.SESSION, durationDays: 1, sessions: 1 },
      { name: '10 Sesiones', description: 'Bono de 10 entradas', price: 40000, planType: PlanType.SESSION, durationDays: 15, sessions: 10 },
      { name: '15 Sesiones', description: 'Bono de 15 entradas', price: 55000, planType: PlanType.SESSION, durationDays: 30, sessions: 15 },
      { name: '30 Sesiones', description: 'Bono de 30 entradas', price: 120000, planType: PlanType.SESSION, durationDays: 60, sessions: 30 },
    ];

    for (const planData of defaultPlans) {
      await repo.save(repo.create(planData as any));
    }
  }

  private async seedUsers() {
    const userRepo = this.dataSource.getRepository(UserEntity);
    const personRepo = this.dataSource.getRepository(PersonEntity);
    const userRoleRepo = this.dataSource.getRepository(UserRoleEntity);
    const roleRepo = this.dataSource.getRepository(RoleEntity);

    const samples = [
      {
        email: 'carlos.mendoza@atletagym.com',
        password: 'Admin123*',
        role: 'Admin',
        person: {
          documentNumber: '1001234567',
          firstName: 'Carlos',
          firstLastName: 'Mendoza',
          cellphone: '3101234567',
          address: 'Calle 10 #5-20, Mocoa, Putumayo',
          gender: 'Masculino',
          isStudentDiscount: false,
        },
      },
      {
        email: 'laura.gomez@atletagym.com',
        password: 'User123*',
        role: 'User',
        person: {
          documentNumber: '1002345678',
          firstName: 'Laura',
          firstLastName: 'Gómez',
          cellphone: '3112345678',
          address: 'Cra 5 #12-30, Pasto, Nariño',
          gender: 'Femenino',
          isStudentDiscount: true,
        },
      },
      {
        email: 'andres.torres@atletagym.com',
        password: 'User123*',
        role: 'User',
        person: {
          documentNumber: '1003456789',
          firstName: 'Andrés',
          firstLastName: 'Torres',
          cellphone: '3123456789',
          address: 'Av. 3 #8-15, Bogotá, Cundinamarca',
          gender: 'Masculino',
          isStudentDiscount: false,
        },
      },
      {
        email: 'valentina.ruiz@atletagym.com',
        password: 'User123*',
        role: 'User',
        person: {
          documentNumber: '1004567890',
          firstName: 'Valentina',
          firstLastName: 'Ruiz',
          cellphone: '3134567890',
          address: 'Calle 8 #2-10, Mocoa, Putumayo',
          gender: 'Femenino',
          isStudentDiscount: false,
        },
      },
    ];

    for (const sample of samples) {
      const exists = await userRepo.findOne({ where: { email: sample.email } });
      if (exists) continue;

      const role = await roleRepo.findOne({ where: { rol_name: sample.role } });
      if (!role) continue;

      const hashed = await bcrypt.hash(sample.password, 10);
      const user = await userRepo.save(
        userRepo.create({
          email: sample.email,
          password_hash: hashed,
          role_id: role.id,
          is_active: true,
        }),
      );

      await personRepo.save(
        personRepo.create({
          user_id: user.id,
          ...sample.person,
        }),
      );

      await userRoleRepo.save(
        userRoleRepo.create({
          user_id: user.id,
          role_id: role.id,
        }),
      );
    }
  }

  private async seedMemberships() {
    const membershipRepo = this.dataSource.getRepository(UserMembershipEntity);
    if ((await membershipRepo.count()) > 0) return;

    const personRepo = this.dataSource.getRepository(PersonEntity);
    const planRepo = this.dataSource.getRepository(MembershipPlanEntity);

    const people = await personRepo.find();
    const plans = await planRepo.find({ where: { isActive: true } });
    if (!people.length || !plans.length) return;

    for (const person of people) {
      const plan = plans[Math.floor(Math.random() * plans.length)];
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + (plan.durationDays ?? 30));

      await membershipRepo.save(
        membershipRepo.create({
          person,
          membershipPlan: plan,
          startDate: start,
          endDate: end,
          sessionsRemaining: plan.sessions ?? null,
          paymentStatus: Math.random() > 0.3 ? PaymentStatus.PAID : PaymentStatus.PENDING,
          amountPaid: plan.price,
        }),
      );
    }
  }
}
