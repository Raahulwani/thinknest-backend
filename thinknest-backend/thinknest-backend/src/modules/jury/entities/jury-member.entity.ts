import {
  Entity, PrimaryGeneratedColumn, Column, ManyToMany,
  JoinTable, OneToMany, CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';
import { Expertise } from './expertise.entity';
import { JuryAssignment } from './jury-assignment.entity';

@Entity('jury_members')
export class JuryMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_jury_members_full_name')
  @Column({ name: 'full_name', type: 'varchar', length: 200 })
  fullName!: string;

  @Column({ name: 'profile_photo_url', type: 'text', nullable: true })
  profilePhotoUrl?: string;

  @Column({ type: 'varchar', length: 120 })
  designation!: string;

  @Column({ type: 'varchar', length: 160 })
  organization!: string;

  @Index('idx_jury_members_department')
  @Column({ type: 'varchar', length: 100 })
  department!: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @ManyToMany(() => Expertise, (e) => e.members, { eager: true })
  @JoinTable({
    name: 'member_expertises',
    joinColumn: { name: 'member_id' },
    inverseJoinColumn: { name: 'expertise_id' },
  })
  expertise!: Expertise[];

  @OneToMany(() => JuryAssignment, (a) => a.member, { cascade: true })
  assignments!: JuryAssignment[];

  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
