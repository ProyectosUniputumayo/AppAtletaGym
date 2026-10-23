import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserMembershipEntity } from './entities/user-membership.entity.js';
import { UserMembershipsService } from './user-memberships.service.js';
import { UserMembershipsController } from './user-memberships.controller.js';
import { MembershipPlanEntity } from '../membership-plans/entities/membership-plan.entity.js';
import { UserEntity } from '../users/entities/user.entity.js'; // Ajusta la ruta según dónde tengas tu entidad User

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserMembershipEntity, 
      MembershipPlanEntity, 
      UserEntity 
    ]),
  ],
  controllers: [UserMembershipsController],
  providers: [UserMembershipsService],
  exports: [UserMembershipsService],
})
export class UserMembershipsModule {}