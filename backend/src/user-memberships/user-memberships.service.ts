import { Injectable, NotFoundException, BadRequestException, ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMembershipEntity, PaymentStatus } from './entities/user-membership.entity.js';
import { MembershipPlanEntity } from '../membership-plans/entities/membership-plan.entity.js';
import { PersonEntity } from '../people/entities/person.entity.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { UserRoleEntity } from '../roles/entities/user-role.entity.js';
import { CreateUserMembershipDto } from './dtos/create-user-membership.dto.js';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { PaymentsAuditService } from '../payments-audit/payments-audit.service.js';

@Injectable()
export class UserMembershipsService {
  private readonly logger = new Logger(UserMembershipsService.name);

  constructor(
    @InjectRepository(UserMembershipEntity)
    private readonly userMembershipRepository: Repository<UserMembershipEntity>,
    @InjectRepository(MembershipPlanEntity)
    private readonly planRepository: Repository<MembershipPlanEntity>,
    @InjectRepository(PersonEntity)
    private readonly personRepository: Repository<PersonEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    private readonly paymentsAuditService: PaymentsAuditService,
  ) {}

  async createCheckoutOrManual(dto: CreateUserMembershipDto, authUserId?: string, isStaff = false) {
    // 1. Validar plan
    const plan = await this.planRepository.findOne({ where: { id: dto.membershipPlanId } });
    if (!plan || !plan.isActive) {
      throw new NotFoundException('El plan de membresía seleccionado no existe o no está activo');
    }

    let person: PersonEntity | null = null;

    // --- FLUJO 1: Pago manual en recepción (Hecho por el Admin/Recepcionista para un cliente) ---
    if (dto.paymentType === 'manual') {
      if (!isStaff) {
        throw new ForbiddenException('Solo el personal autorizado puede registrar pagos manuales');
      }
      if (!dto.documentNumber) {
        throw new BadRequestException('Para pagos manuales en recepción es obligatorio proporcionar la cédula del cliente');
      }
      person = await this.findOrCreatePersonForClient(dto);
    } 
    // --- FLUJO 2: Usuario web autenticado comprando para sí mismo ---
    else if (authUserId) {
      const user = await this.userRepository.findOne({ where: { id: Number(authUserId) } });
      if (!user) throw new NotFoundException('Usuario autenticado no encontrado');

      person = await this.personRepository.findOne({ where: { user_id: user.id } });
      if (!person) {
        throw new NotFoundException('No se encontró el perfil de persona asociado al usuario logueado');
      }
    } 
    // --- FLUJO 3: Invitado web (Sin cuenta previa, pagando online por Wompi) ---
    else if (dto.documentNumber) {
      person = await this.findOrCreatePersonForClient(dto);
    } else {
      throw new BadRequestException('Debe iniciar sesión o proporcionar un número de documento (cédula)');
    }

    // --- VALIDACIÓN DE MEMBRESÍA ACTIVA ---
    const activeMembership = await this.userMembershipRepository.findOne({
      where: {
        person: { id: person.id },
        paymentStatus: PaymentStatus.PAID,
      },
      order: { endDate: 'DESC' },
      relations: { membershipPlan: true },
    });

    if (activeMembership && activeMembership.endDate > new Date()) {
      if (plan.price <= Number(activeMembership.membershipPlan?.price ?? 0)) {
        throw new BadRequestException(
          'No puedes comprar un plan inferior o igual al que ya tienes activo',
        );
      }
    }

    // 2. Calcular fechas de vigencia
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.durationDays);

    // 3. Definir estado inicial del pago según el flujo
    const isManual = dto.paymentType === 'manual';
    const initialStatus = isManual ? PaymentStatus.PAID : PaymentStatus.PENDING;

    // 4. Crear el registro de la membresía
    const userMembership = this.userMembershipRepository.create({
      person,
      membershipPlan: plan,
      startDate,
      endDate,
      sessionsRemaining: plan.sessions ?? undefined,
      paymentStatus: initialStatus,
      amountPaid: plan.price,
    });

    await this.userMembershipRepository.save(userMembership);

    // Si es pago manual en recepción, termina aquí con éxito inmediato
    if (isManual) {
      return {
        message: 'Membresía registrada y pagada exitosamente en recepción por el administrador',
        membershipId: userMembership.id,
        paymentStatus: PaymentStatus.PAID,
      };
    }

    // --- FLUJO 2 y 3 (Wompi Online): Generar firma de integridad Sandbox ---
    const amountInCents = Math.round(parseFloat(plan.price.toString()) * 100);
    const currency = 'COP';
    const reference = `ATLETA-GYM-${userMembership.id}`;
    
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
    if (!integritySecret || !process.env.WOMPI_PUBLIC_KEY) {
      throw new InternalServerErrorException('Wompi no está configurado en el servidor');
    }
    const concatenated = `${reference}${amountInCents}${currency}${integritySecret}`;
    const signature = crypto.createHash('sha256').update(concatenated).digest('hex');

    // --- REGISTRAR INTENCIÓN DE PAGO EN MONGODB ---
    await this.paymentsAuditService.createTransaction({
      membershipId: userMembership.id,
      reference,
      amountInCents,
      currency,
      status: 'PENDING',
    });

    return {
      message: 'Intención de compra generada exitosamente para Wompi',
      wompiData: {
        publicKey: process.env.WOMPI_PUBLIC_KEY,
        currency,
        amountInCents,
        reference,
        signature,
        redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payments/success`,
      },
      membershipId: userMembership.id,
    };
  }

  async getMyMembership(authUserId: string) {
    const user = await this.userRepository.findOne({ where: { id: Number(authUserId) } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const person = await this.personRepository.findOne({ where: { user_id: user.id } });
    if (!person) throw new NotFoundException('Perfil de persona no encontrado');

    const membership = await this.userMembershipRepository.findOne({
      where: { person: { id: person.id } },
      order: { createdAt: 'DESC' },
    });

    if (!membership) throw new NotFoundException('No tienes membresías registradas');
    return membership;
  }

  async getMyMembershipHistory(authUserId: string) {
    const user = await this.userRepository.findOne({ where: { id: Number(authUserId) } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const person = await this.personRepository.findOne({ where: { user_id: user.id } });
    if (!person) throw new NotFoundException('Perfil de persona no encontrado');

    return await this.userMembershipRepository.find({
      where: { person: { id: person.id } },
      order: { createdAt: 'DESC' },
    });
  }

  // --- Método auxiliar privado para buscar o crear al cliente por cédula (Flujos 1 y 3) ---
  private async findOrCreatePersonForClient(dto: CreateUserMembershipDto): Promise<PersonEntity> {
    let person = await this.personRepository.findOne({ where: { documentNumber: dto.documentNumber } });
    let savedUser: UserEntity | undefined = undefined;

    if (!person) {
      if (!dto.firstName || !dto.firstLastName) {
        throw new BadRequestException('La cédula no está registrada en el sistema. Debe proporcionar nombre y apellido.');
      }

      // Si el recepcionista o la web proporcionan correo, le creamos su cuenta web con la cédula como clave
      if (dto.email) {
        const existingEmail = await this.userRepository.findOne({ where: { email: dto.email } });
        if (existingEmail) throw new BadRequestException('El correo electrónico ya está registrado por otro usuario');

        const provisionalPassword = dto.documentNumber!; 
        const hashedPassword = await bcrypt.hash(provisionalPassword, 10);

        const newUser = this.userRepository.create({
          email: dto.email,
          password_hash: hashedPassword,
          role_id: 3, // Rol Atleta
        });
        savedUser = await this.userRepository.save(newUser);

        const newUserRole = this.userRoleRepository.create({
          user_id: savedUser.id,
          role_id: 3,
        });
        await this.userRoleRepository.save(newUserRole);
      }

      person = this.personRepository.create({
        documentNumber: dto.documentNumber,
        firstName: dto.firstName,
        firstLastName: dto.firstLastName,
        cellphone: dto.cellphone,
        isStudentDiscount: dto.isStudentDiscount ?? false,
        user_id: savedUser ? savedUser.id : undefined,
      });
      person = await this.personRepository.save(person);
    } else {
      // Si el cliente ya existía en recepción pero ahora el admin le añade un correo y no tenía cuenta web
      if (dto.email && !person.user_id) {
        const existingEmail = await this.userRepository.findOne({ where: { email: dto.email } });
        if (existingEmail) throw new BadRequestException('El correo electrónico ya está registrado por otro usuario');

        const provisionalPassword = dto.documentNumber!;
        const hashedPassword = await bcrypt.hash(provisionalPassword, 10);

        const newUser = this.userRepository.create({
          email: dto.email,
          password_hash: hashedPassword,
          role_id: 3,
        });
        savedUser = await this.userRepository.save(newUser);

        const newUserRole = this.userRoleRepository.create({
          user_id: savedUser.id,
          role_id: 3,
        });
        await this.userRoleRepository.save(newUserRole);

        person.user_id = savedUser.id;
        if (dto.cellphone) person.cellphone = dto.cellphone;
        await this.personRepository.save(person);
      }
    }

    return person;
  }

  // Webhook para sincronizar transacciones aprobadas/rechazadas desde Wompi
  async handleWompiWebhook(eventData: any) {
    if (eventData?.event !== 'transaction.updated') return { received: true };

    const transaction = eventData.data?.transaction;
    const reference: string | undefined = transaction?.reference;
    const status: string | undefined = transaction?.status;
    if (!reference?.startsWith('ATLETA-GYM-') || !status) return { received: true };

    const membershipId = reference.replace('ATLETA-GYM-', '');
    const userMembership = await this.userMembershipRepository.findOne({ where: { id: membershipId } });
    if (!userMembership) return { received: true };

    // Idempotencia: una membresía ya pagada no se reprocesa
    if (userMembership.paymentStatus === PaymentStatus.PAID) return { received: true };

    if (status === 'APPROVED') {
      // Validar monto y moneda contra lo cobrado (MySQL es la fuente de verdad)
      const expectedCents = Math.round(parseFloat(String(userMembership.amountPaid)) * 100);
      if (transaction.amount_in_cents !== expectedCents || transaction.currency !== 'COP') {
        this.logger.error(`Monto/moneda no coinciden para ${reference}: ${transaction.amount_in_cents} ${transaction.currency}`);
        return { received: true };
      }
      // La vigencia empieza al aprobarse el pago
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + (userMembership.membershipPlan?.durationDays ?? 0));
      userMembership.startDate = startDate;
      userMembership.endDate = endDate;
      userMembership.paymentStatus = PaymentStatus.PAID;
      await this.userMembershipRepository.save(userMembership);
    } else if (status === 'DECLINED' || status === 'ERROR' || status === 'VOIDED') {
      userMembership.paymentStatus = PaymentStatus.REJECTED;
      await this.userMembershipRepository.save(userMembership);
    }

    await this.paymentsAuditService.updateTransactionStatusByReference(reference, status, eventData);
    return { received: true };
  }

  // Verifica el checksum de un evento de Wompi: valores de signature.properties + timestamp + events secret
  verifyWompiEventSignature(eventData: any): boolean {
    const secret = process.env.WOMPI_EVENTS_SECRET;
    if (!secret) {
      this.logger.error('WOMPI_EVENTS_SECRET no configurado; se rechaza el evento');
      return false;
    }
    const properties: string[] | undefined = eventData?.signature?.properties;
    const checksum: string | undefined = eventData?.signature?.checksum;
    if (!Array.isArray(properties) || !checksum || eventData?.timestamp === undefined) return false;

    let concatenated = '';
    for (const prop of properties) {
      const value = prop.split('.').reduce((acc: any, key) => acc?.[key], eventData?.data);
      if (value === undefined || value === null) return false;
      concatenated += String(value);
    }
    concatenated += String(eventData.timestamp) + secret;

    const expected = Buffer.from(crypto.createHash('sha256').update(concatenated).digest('hex'));
    const received = Buffer.from(String(checksum).toLowerCase());
    return expected.length === received.length && crypto.timingSafeEqual(expected, received);
  }

  // Respaldo del webhook: consulta la transacción directamente a Wompi y aplica el resultado
  async confirmTransaction(transactionId: string, authUserId: string) {
    const base = (process.env.WOMPI_PUBLIC_KEY ?? '').startsWith('pub_test_')
      ? 'https://sandbox.wompi.co/v1'
      : 'https://production.wompi.co/v1';
    const res = await fetch(`${base}/transactions/${encodeURIComponent(transactionId)}`);
    if (!res.ok) throw new NotFoundException('Transacción no encontrada en Wompi');
    const transaction = (await res.json())?.data;
    const reference: string | undefined = transaction?.reference;
    if (!reference) throw new NotFoundException('Transacción sin referencia');

    // Solo el dueño de la membresía puede confirmar
    await this.getStatusByReference(reference, authUserId);

    await this.handleWompiWebhook({ event: 'transaction.updated', data: { transaction } });
    return this.getStatusByReference(reference, authUserId);
  }

  // Estado de una referencia, solo para el dueño de la membresía
  async getStatusByReference(reference: string, authUserId: string) {
    if (!reference.startsWith('ATLETA-GYM-')) throw new NotFoundException('Referencia no válida');
    const membership = await this.userMembershipRepository.findOne({
      where: { id: reference.replace('ATLETA-GYM-', '') },
    });
    if (!membership) throw new NotFoundException('Transacción no encontrada');
    if (String(membership.person?.user_id) !== String(authUserId)) {
      throw new ForbiddenException('No tienes acceso a esta transacción');
    }
    return { reference, paymentStatus: membership.paymentStatus, endDate: membership.endDate };
  }
}