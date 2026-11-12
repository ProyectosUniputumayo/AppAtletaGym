import { Column, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Un texto de interfaz traducido: (idioma, namespace, clave) -> valor. */
@Entity('translations')
@Index(['languageCode', 'namespace', 'key'], { unique: true })
export class TranslationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10, name: 'language_code' })
  languageCode: string;

  @Column({ type: 'varchar', length: 50 })
  namespace: string;

  @Column({ type: 'varchar', length: 150, name: 'translation_key' })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
