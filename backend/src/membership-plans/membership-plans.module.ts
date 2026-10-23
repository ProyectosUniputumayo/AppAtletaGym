import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipPlanEntity } from './entities/membership-plan.entity.js';
import { MembershipPlansService } from './membership-plans.service.js';
import { MembershipPlansController } from './membership-plans.controller.js';
import { MembershipPlansSeeder } from './membership-plans.seeder.js'; 

@Module({
  imports: [TypeOrmModule.forFeature([MembershipPlanEntity])],
  controllers: [MembershipPlansController],
  providers: [MembershipPlansService, MembershipPlansSeeder],
  exports: [MembershipPlansService],
})
export class MembershipPlansModule {}