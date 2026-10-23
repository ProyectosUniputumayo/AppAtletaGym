import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UserMembershipsController } from './user-memberships.controller.js';
import { UserMembershipsService } from './user-memberships.service.js';
import { UserMembershipEntity } from './entities/user-membership.entity.js';
import { MembershipPlanEntity } from '../membership-plans/entities/membership-plan.entity.js';
import { PersonEntity } from '../people/entities/person.entity.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { UserRoleEntity } from '../roles/entities/user-role.entity.js';
import { AuthModule } from '../auth/auth.module.js';
import { PaymentsAuditModule } from '../payments-audit/payments-audit.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserMembershipEntity,
      MembershipPlanEntity,
      PersonEntity,
      UserEntity,
      UserRoleEntity,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1d' },
    }),
    AuthModule,
    PaymentsAuditModule, 
  ],
  controllers: [UserMembershipsController],
  providers: [UserMembershipsService],
  exports: [UserMembershipsService],
})
export class UserMembershipsModule {}