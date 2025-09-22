import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { CaseStudy } from "./case-study.entity";

@Entity({ name: "case_study_testimonials" })
export class CaseStudyTestimonial {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => CaseStudy, cs => cs.testimonials, { onDelete: "CASCADE" })
  caseStudy!: CaseStudy;

  @Column({ type: "varchar", length: 120 })
  stakeholder!: string; // e.g., "CIO", "Ops Head", "Team Lead"

  @Column({ type: "varchar", length: 150, nullable: true })
  organization!: string | null;

  @Column({ type: "text" })
  quote!: string;
}
