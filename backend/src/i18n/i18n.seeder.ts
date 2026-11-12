import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LanguageEntity } from './entities/language.entity.js';
import { TranslationEntity } from './entities/translation.entity.js';
import { SEED_LANGUAGES, SEED_TRANSLATIONS } from './seed/translations.seed.js';

/**
 * Carga inicial de idiomas y textos de interfaz. Solo inserta lo que falta:
 * los textos editados después en la base de datos nunca se sobrescriben.
 */
@Injectable()
export class I18nSeeder implements OnModuleInit {
  private readonly logger = new Logger(I18nSeeder.name);

  constructor(
    @InjectRepository(LanguageEntity)
    private readonly languageRepo: Repository<LanguageEntity>,
    @InjectRepository(TranslationEntity)
    private readonly translationRepo: Repository<TranslationEntity>,
  ) {}

  async onModuleInit() {
    for (const lang of SEED_LANGUAGES) {
      if (!(await this.languageRepo.findOne({ where: { code: lang.code } }))) {
        await this.languageRepo.save(this.languageRepo.create(lang));
      }
    }

    let inserted = 0;
    for (const [code, namespaces] of Object.entries(SEED_TRANSLATIONS)) {
      for (const [namespace, entries] of Object.entries(namespaces)) {
        const existing = await this.translationRepo.find({ where: { languageCode: code, namespace } });
        const known = new Set(existing.map((e) => e.key));
        const missing = Object.entries(entries)
          .filter(([key]) => !known.has(key))
          .map(([key, value]) => this.translationRepo.create({ languageCode: code, namespace, key, value }));
        if (missing.length) {
          await this.translationRepo.save(missing);
          inserted += missing.length;
        }
      }
    }
    if (inserted) this.logger.log(`Traducciones cargadas: ${inserted} textos nuevos.`);
  }
}
