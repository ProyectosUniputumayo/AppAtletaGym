import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LanguageEntity } from './entities/language.entity.js';
import { TranslationEntity } from './entities/translation.entity.js';

@Injectable()
export class I18nService {
  constructor(
    @InjectRepository(LanguageEntity)
    private readonly languageRepo: Repository<LanguageEntity>,
    @InjectRepository(TranslationEntity)
    private readonly translationRepo: Repository<TranslationEntity>,
  ) {}

  async getLanguages() {
    const languages = await this.languageRepo.find({ order: { code: 'ASC' } });
    const def = languages.find((l) => l.isDefault)?.code ?? 'es';
    return {
      defaultLanguage: def,
      languages: languages.map((l) => ({
        code: l.code,
        label: l.label,
        flag: l.flag,
        enabled: l.enabled,
        isVariant: !!l.baseCode,
      })),
    };
  }

  /** Textos (clave -> valor) de un idioma y namespace; las variantes heredan de su idioma base. */
  async getTranslations(code: string, namespace: string): Promise<Record<string, string>> {
    const language = await this.languageRepo.findOne({ where: { code } });
    if (!language) throw new NotFoundException(`Idioma no soportado: ${code}`);

    const result: Record<string, string> = {};
    const codes = language.baseCode ? [language.baseCode, code] : [code];
    for (const c of codes) {
      const rows = await this.translationRepo.find({ where: { languageCode: c, namespace } });
      for (const row of rows) result[row.key] = row.value;
    }
    return result;
  }

  /** Crea o actualiza textos (uso administrativo). */
  async upsertTranslations(code: string, namespace: string, entries: Record<string, string>) {
    const language = await this.languageRepo.findOne({ where: { code } });
    if (!language) throw new NotFoundException(`Idioma no soportado: ${code}`);

    let count = 0;
    for (const [key, value] of Object.entries(entries)) {
      if (typeof value !== 'string') continue;
      const existing = await this.translationRepo.findOne({ where: { languageCode: code, namespace, key } });
      if (existing) {
        existing.value = value;
        await this.translationRepo.save(existing);
      } else {
        await this.translationRepo.save(this.translationRepo.create({ languageCode: code, namespace, key, value }));
      }
      count++;
    }
    return { updated: count };
  }
}
