import { Controller, Post, Body, Req, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserMembershipsService } from './user-memberships.service.js';
import { CreateUserMembershipDto } from './dtos/create-user-membership.dto.js';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

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
    let isStaff = false;

    // Intentamos extraer el usuario del token si viene en los Headers (Flujo 2)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = this.jwtService.verify(token);
        authUserId = payload.sub || payload.id || payload.user_id;
        const roles: string[] = Array.isArray(payload.roles) ? payload.roles : [];
        isStaff = roles.some((r) => ['Admin', 'SuperAdmin'].includes(r));
      } catch (error) {
        // Si el token es inválido o expiró, lo ignoramos para permitir que pase por cédula (Flujo 1 o 3)
      }
    }

    return await this.userMembershipsService.createCheckoutOrManual(
      dto, 
      authUserId ? String(authUserId) : undefined,
      isStaff,
    );
  }

  @Post('confirm/:transactionId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirma un pago consultando la transacción en Wompi (respaldo del webhook)' })
  async confirm(@Param('transactionId') transactionId: string, @Req() req: any) {
    const authUserId = this.extractAuthUserId(req);
    if (!authUserId) throw new UnauthorizedException('Debe iniciar sesión');
    return await this.userMembershipsService.confirmTransaction(transactionId, authUserId);
  }

  @Get('status/:reference')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Estado de pago de una referencia de Wompi del usuario autenticado' })
  async getStatus(@Param('reference') reference: string, @Req() req: any) {
    const authUserId = this.extractAuthUserId(req);
    if (!authUserId) throw new UnauthorizedException('Debe iniciar sesión');
    return await this.userMembershipsService.getStatusByReference(reference, authUserId);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtiene la membresía activa del usuario autenticado' })
  async getMyMembership(@Req() req: any) {
    const authUserId = this.extractAuthUserId(req);
    if (!authUserId) throw new UnauthorizedException('Debe iniciar sesión');
    return await this.userMembershipsService.getMyMembership(authUserId);
  }

  @Get('me/history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtiene el historial de membresías del usuario autenticado' })
  async getMyMembershipHistory(@Req() req: any) {
    const authUserId = this.extractAuthUserId(req);
    if (!authUserId) throw new UnauthorizedException('Debe iniciar sesión');
    return await this.userMembershipsService.getMyMembershipHistory(authUserId);
  }

  private extractAuthUserId(req: any): string | undefined {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = this.jwtService.verify(token);
        return String(payload.sub || payload.id || payload.user_id);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}