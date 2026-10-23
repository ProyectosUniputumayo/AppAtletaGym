import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipPlanEntity } from './entities/membership-plan.entity.js';
import { CreateMembershipPlanDto } from './dtos/create-membership-plan.dto.js';
import { UpdateMembershipPlanDto } from './dtos/update-membership-plan.dto.js';

@Injectable()
export class MembershipPlansService {
  constructor(
    @InjectRepository(MembershipPlanEntity)
    private readonly planRepository: Repository<MembershipPlanEntity>,
  ) {}

  async create(dto: CreateMembershipPlanDto) {
    const existingPlan = await this.planRepository.findOne({ where: { name: dto.name } });
    if (existingPlan) {
      throw new ConflictException('Ya existe un plan de membresía con este nombre');
    }

    const newPlan = this.planRepository.create(dto);
    await this.planRepository.save(newPlan);

    return {
      message: 'Plan de membresía creado exitosamente',
      plan: newPlan,
    };
  }

  async findAll() {
    return await this.planRepository.find({
      order: { price: 'ASC' },
    });
  }

  async findOne(id: string) {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plan de membresía no encontrado');
    }
    return plan;
  }

  async update(id: string, dto: UpdateMembershipPlanDto) {
    const plan = await this.findOne(id);

    if (dto.name && dto.name !== plan.name) {
      const existingName = await this.planRepository.findOne({ where: { name: dto.name } });
      if (existingName) {
        throw new ConflictException('Ya existe otro plan con ese nombre');
      }
    }

    Object.assign(plan, dto);
    await this.planRepository.save(plan);

    return {
      message: 'Plan de membresía actualizado exitosamente',
      plan,
    };
  }

  async remove(id: string) {
    const plan = await this.findOne(id);
    // Eliminación lógica cambiando el isActive a false para no romper historial de usuarios
    plan.isActive = false;
    await this.planRepository.save(plan);

    return {
      message: 'Plan de membresía desactivado exitosamente',
    };
  }
}