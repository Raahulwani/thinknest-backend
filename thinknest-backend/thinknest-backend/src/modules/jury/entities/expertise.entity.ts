import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, Index } from 'typeorm';
import { JuryMember } from './jury-member.entity';

@Entity('expertises')
export class Expertise {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('uq_expertises_name', { unique: true })
  @Column({ type: 'varchar', length: 80, unique: true })
  name!: string;

  @ManyToMany(() => JuryMember, (m) => m.expertise)
  members!: JuryMember[];
}
