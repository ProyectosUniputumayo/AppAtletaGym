import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service.js';
import { AuthRegisterService } from './services/auth-register.service.js';
import { AuthLoginService } from './services/auth-login.service.js';
import { AuthPasswordService } from './services/auth-password.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

import { UserEntity } from '../users/entities/user.entity.js';
import { PersonEntity } from '../people/entities/person.entity.js';
import { UserRoleEntity } from '../roles/entities/user-role.entity.js';

// 1. IMPORTAR EL MÓDULO DE EMAIL AQUÍ:
import { EmailModule } from '../mails/mail.module.js';
import { JWT_SECRET } from '../config/constants.js';


@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(JWT_SECRET),
        signOptions: { expiresIn: '30m' },
      }),
    }),
    TypeOrmModule.forFeature([UserEntity, PersonEntity, UserRoleEntity]),
    EmailModule, 
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRegisterService,
    AuthLoginService,
    AuthPasswordService,
    JwtStrategy,
  ],
  exports: [JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}