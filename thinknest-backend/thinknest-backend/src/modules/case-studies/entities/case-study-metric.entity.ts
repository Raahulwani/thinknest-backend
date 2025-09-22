import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { CaseStudy } from "./case-study.entity";

@Entity({ name: "case_study_metrics" })
export class CaseStudyMetric {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => CaseStudy, cs => cs.metrics, { onDelete: "CASCADE" })
  caseStudy!: CaseStudy;

  @Column({ type: "varchar", length: 120 })
  kpi!: string; // e.g., "Cost Saved", "Processing Time"

  @Column({ type: "varchar", length: 120, nullable: true })
  value!: string | null; // e.g., "₹12L", "35%", "−3 days"

  @Column({ type: "text", nullable: true })
  note!: string | null;
}
