import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserMembershipsService } from './user-memberships.service.js';
import { CreateUserMembershipDto } from './dtos/create-user-membership.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('User Memberships & Payments (Membresías y Pagos)')
@Controller('user-memberships')
export class UserMembershipsController {
  constructor(private readonly userMembershipsService: UserMembershipsService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Iniciar proceso de compra de un plan de membresía con Wompi' })
  createCheckout(@Body() dto: CreateUserMembershipDto, @Req() req: any) {
    // Leemos user_id tal como lo retorna el validate de tu JwtStrategy
    const userId = req.user?.user_id; 
    return this.userMembershipsService.createCheckout(dto, userId);
  }

  @Post('webhook/wompi')
  @ApiOperation({ summary: 'Endpoint receptor de eventos (Webhooks) de Wompi' })
  async wompiWebhook(@Body() eventData: any) {
    return await this.userMembershipsService.handleWompiWebhook(eventData);
  }

  
}