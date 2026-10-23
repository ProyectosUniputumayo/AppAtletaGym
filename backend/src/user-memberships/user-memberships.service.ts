import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMembershipEntity, PaymentStatus } from './entities/user-membership.entity.js';
import { MembershipPlanEntity } from '../membership-plans/entities/membership-plan.entity.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { CreateUserMembershipDto } from './dtos/create-user-membership.dto.js';
import * as crypto from 'crypto';

@Injectable()
export class UserMembershipsService {
  constructor(
    @InjectRepository(UserMembershipEntity)
    private readonly userMembershipRepository: Repository<UserMembershipEntity>,
    @InjectRepository(MembershipPlanEntity)
    private readonly planRepository: Repository<MembershipPlanEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createCheckout(dto: CreateUserMembershipDto, userId?: string) {
    const plan = await this.planRepository.findOne({ where: { id: dto.membershipPlanId } });
    if (!plan || !plan.isActive) {
      throw new NotFoundException('El plan de membresía seleccionado no existe o no está activo');
    }

    let user: UserEntity;
    
    if (userId) {
      // Convertimos el userId de string a number con Number()
      const foundUser = await this.userRepository.findOne({ where: { id: Number(userId) } });
      if (!foundUser) {
        throw new NotFoundException('Usuario no encontrado');
      }
      user = foundUser;
    } else if (dto.email) {
      const foundUser = await this.userRepository.findOne({ where: { email: dto.email } });
      if (!foundUser) {
        throw new BadRequestException('El correo no está registrado. Debe registrarse o iniciar sesión.');
      }
      user = foundUser;
    } else {
      throw new BadRequestException('Se requiere un usuario autenticado o un correo válido');
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.durationDays);

    const userMembership = this.userMembershipRepository.create({
      user: user,
      membershipPlan: plan,
      startDate,
      endDate,
      sessionsRemaining: plan.sessions ?? undefined, // Si es null, pasa undefined
      paymentStatus: PaymentStatus.PENDING,
      amountPaid: plan.price,
    });

    await this.userMembershipRepository.save(userMembership);

    const amountInCents = Number(plan.price) * 100;
    const currency = 'COP';
    const reference = `ATLETA-GYM-${userMembership.id}`;
    
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET || 'test_integrity_secret';
    const concatenated = `${reference}${amountInCents}${currency}${integritySecret}`;
    const signature = crypto.createHash('sha256').update(concatenated).digest('hex');

    return {
      message: 'Intención de compra creada exitosamente',
      wompiData: {
        publicKey: process.env.WOMPI_PUBLIC_KEY,
        currency,
        amountInCents,
        reference,
        signature,
        redirectUrl: `${process.env.FRONTEND_URL}/payments/success`,
      },
      membershipId: userMembership.id,
    };
  }

  async handleWompiWebhook(eventData: any) {
    const event = eventData.event;
    if (event === 'transaction.updated') {
      const transaction = eventData.data.transaction;
      const reference = transaction.reference;
      const status = transaction.status;

      const membershipId = reference.replace('ATLETA-GYM-', '');
      const userMembership = await this.userMembershipRepository.findOne({ where: { id: membershipId } });

      if (!userMembership) return { received: true };

      if (status === 'APPROVED') {
        userMembership.paymentStatus = PaymentStatus.PAID;
        await this.userMembershipRepository.save(userMembership);
      } else if (status === 'DECLINED' || status === 'ERROR') {
        userMembership.paymentStatus = PaymentStatus.REJECTED;
        await this.userMembershipRepository.save(userMembership);
      }
    }
    return { received: true };
  }
}