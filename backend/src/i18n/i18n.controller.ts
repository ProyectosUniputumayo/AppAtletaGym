import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nService } from './i18n.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('platform (idiomas y traducciones)')
@Controller('platform')
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  @Get('languages')
  @ApiOperation({ summary: 'Idiomas disponibles (público)' })
  getLanguages() {
    return this.i18nService.getLanguages();
  }

  @Get('translations/:lang/:namespace')
  @ApiOperation({ summary: 'Textos de interfaz de un idioma/namespace (público)' })
  getTranslations(@Param('lang') lang: string, @Param('namespace') namespace: string) {
    return this.i18nService.getTranslations(lang, namespace);
  }

  @Put('translations/:lang/:namespace')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Crear/actualizar textos de interfaz (Admin/SuperAdmin)' })
  upsert(
    @Param('lang') lang: string,
    @Param('namespace') namespace: string,
    @Body() entries: Record<string, string>,
  ) {
    return this.i18nService.upsertTranslations(lang, namespace, entries);
  }
}
