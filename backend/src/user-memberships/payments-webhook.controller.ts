import { Controller, Post, Body, HttpCode, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserMembershipsService } from './user-memberships.service.js';

@ApiTags('payments')
@Controller('payments')
export class PaymentsWebhookController {
  constructor(private readonly userMembershipsService: UserMembershipsService) {}

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook de eventos de Wompi (verifica checksum con WOMPI_EVENTS_SECRET)' })
  async handleWebhook(@Body() body: any) {
    if (!this.userMembershipsService.verifyWompiEventSignature(body)) {
      throw new UnauthorizedException('Firma del evento inválida');
    }
    return this.userMembershipsService.handleWompiWebhook(body);
  }
}
