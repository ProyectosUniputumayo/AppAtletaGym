import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserMembershipsService } from './user-memberships.service.js';
import { CreateUserMembershipDto } from './dtos/create-user-membership.dto.js';
import { JwtService } from '@nestjs/jwt';

@ApiTags('User Memberships & Payments (Membresías y Pagos)')
@Controller('user-memberships')
export class UserMembershipsController {
  constructor(
    private readonly userMembershipsService: UserMembershipsService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('checkout')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Checkout unificado (Soporta Clientes Presenciales en recepción, Web Logueados y Pre-registro de Invitados)' 
  })
  async createCheckout(@Body() dto: CreateUserMembershipDto, @Req() req: any) {
    let authUserId: string | undefined = undefined;

    // Intentamos extraer el usuario del token si viene en los Headers (Flujo 2)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = this.jwtService.verify(token);
        authUserId = payload.sub || payload.id || payload.user_id;
      } catch (error) {
        // Si el token es inválido o expiró, lo ignoramos para permitir que pase por cédula (Flujo 1 o 3)
      }
    }

    return await this.userMembershipsService.createCheckoutOrManual(
      dto, 
      authUserId ? String(authUserId) : undefined
    );
  }

  @Post('webhook/wompi')
  @ApiOperation({ summary: 'Endpoint receptor de eventos (Webhooks) de Wompi Sandbox' })
  async wompiWebhook(@Body() eventData: any) {
    return await this.userMembershipsService.handleWompiWebhook(eventData);
  }
}