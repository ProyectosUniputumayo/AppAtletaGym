import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../users/entities/user.entity.js';

import { ForgotPasswordDto } from '../dtos/forgot-password.dto.js';
import { ResetPasswordDto } from '../dtos/reset-password.dto.js';
import { JWT_SECRET } from '../../config/constants.js';
import { EmailService } from '../../mails/mail.service.js';
import { PersonEntity } from '../../people/entities/person.entity.js';

@Injectable()
export class AuthPasswordService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PersonEntity)
    private readonly personRepository: Repository<PersonEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('No existe un usuario registrado con este correo electrónico');
    }

    // Generar un código de 4 dígitos aleatorio (ej: 4829)
    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();

    const secret = this.configService.get<string>(JWT_SECRET) + user.password_hash;
    const payload = { sub: user.id, email: user.email, code: resetCode };
    const resetToken = this.jwtService.sign(payload, { secret, expiresIn: '30m' });

    // Buscar el nombre de la persona asociada
    const person = await this.personRepository.findOne({
      where: { user_id: user.id },
    });

    await this.emailService.sendEmail({
      to: user.email,
      subject: 'Código de recuperación de contraseña — Atleta x Gym',
      template: 'reset-password',
      context: {
        name: person?.firstName || 'Atleta',
        resetCode: resetCode,
      },
    });

    return {
      message: 'Se ha enviado el código de verificación de 4 dígitos a tu correo electrónico',
      resetToken,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      // 1. Decodificar el token sin verificar para obtener el ID del usuario (sub)
      const decoded: any = this.jwtService.decode(dto.token);
      if (!decoded || !decoded.sub) {
        throw new BadRequestException('Token de recuperación inválido');
      }

      const user = await this.userRepository.findOne({ where: { id: decoded.sub } });
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // 2. Verificar el token usando el secret dinámico basado en su contraseña actual
      const secret = this.configService.get<string>(JWT_SECRET) + user.password_hash;
      this.jwtService.verify(dto.token, { secret });

      // 3. Encriptar la nueva contraseña con bcrypt
      const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

      // 4. Actualizar la contraseña en la base de datos
      user.password_hash = hashedPassword;
      await this.userRepository.save(user);

      return { message: 'Contraseña actualizada exitosamente' };
    } catch (error) {
      throw new BadRequestException('El token de recuperación es inválido o ha expirado');
    }
  }
}