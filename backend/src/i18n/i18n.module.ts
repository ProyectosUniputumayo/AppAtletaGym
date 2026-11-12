import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LanguageEntity } from './entities/language.entity.js';
import { TranslationEntity } from './entities/translation.entity.js';
import { I18nService } from './i18n.service.js';
import { I18nController } from './i18n.controller.js';
import { I18nSeeder } from './i18n.seeder.js';

@Module({
  imports: [TypeOrmModule.forFeature([LanguageEntity, TranslationEntity])],
  controllers: [I18nController],
  providers: [I18nService, I18nSeeder],
  exports: [I18nService],
})
export class I18nModule {}
