import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { JuryMember } from './jury-member.entity';

export enum JuryRole { Chair = 'chair', CoChair = 'co-chair', Member = 'member', Advisor = 'advisor' }

@Entity('jury_assignments')
@Index('idx_assignments_year', ['year'])
@Index('idx_assignments_member_year', ['member', 'year'])
export class JuryAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  year!: number;

  @Column({ type: 'enum', enum: JuryRole, default: JuryRole.Member })
  role!: JuryRole;

  @ManyToOne(() => JuryMember, (m) => m.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member!: JuryMember;
}
