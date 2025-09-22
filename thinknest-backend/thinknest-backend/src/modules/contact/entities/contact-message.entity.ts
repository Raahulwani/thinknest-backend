import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type ContactType = 'General' | 'Partnership' | 'Feedback';

@Entity({ name: 'contact_messages' })
export class ContactMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ length: 180 })
  email!: string;

  @Column({ length: 160 })
  subject!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'varchar', length: 40 })
  type!: ContactType;

  @Column({ nullable: true })
  ip?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  recaptchaScore?: number;

  @CreateDateColumn()
  createdAt!: Date;
}
