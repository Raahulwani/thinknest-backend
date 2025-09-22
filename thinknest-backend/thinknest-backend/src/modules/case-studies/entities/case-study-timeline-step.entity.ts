import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { CaseStudy } from "./case-study.entity";

@Entity({ name: "case_study_timeline_steps" })
export class CaseStudyTimelineStep {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => CaseStudy, cs => cs.timeline, { onDelete: "CASCADE" })
  caseStudy!: CaseStudy;

  @Column({ type: "int" })
  orderIndex!: number;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  teamsInvolved!: string | null;

  @Column({ type: "varchar", length: 200, nullable: true })
  toolsUsed!: string | null;

  @Column({ type: "date", nullable: true })
  date!: string | null;
}
