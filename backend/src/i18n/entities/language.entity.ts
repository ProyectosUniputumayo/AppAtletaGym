import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Idiomas disponibles en la plataforma. Las variantes (es-CO…) heredan de `baseCode`. */
@Entity('languages')
export class LanguageEntity {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  code: string;

  @Column({ type: 'varchar', length: 80 })
  label: string;

  @Column({ type: 'varchar', length: 16, default: '' })
  flag: string;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'boolean', name: 'is_default', default: false })
  isDefault: boolean;

  /** Idioma base del que hereda traducciones (ej. 'es' para 'es-CO'). */
  @Column({ type: 'varchar', length: 10, name: 'base_code', nullable: true })
  baseCode: string | null;
}
