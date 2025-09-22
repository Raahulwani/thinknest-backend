import {
  Entity, PrimaryGeneratedColumn, Column, Index, ManyToMany, JoinTable, ManyToOne, OneToMany
} from "typeorm";
import { MediaAsset } from "../../featured/entities/media-asset.entity"; // reuse existing
import { CaseStudyTag } from "./case-study-tag.entity";
import { CaseStudyMetric } from "./case-study-metric.entity";
import { CaseStudyTimelineStep } from "./case-study-timeline-step.entity";
import { CaseStudyTestimonial } from "./case-study-testimonial.entity";

export type ImpactType = "Cost Savings" | "Operational Efficiency" | "User Satisfaction" | "Revenue Growth" | "Quality Improvement";

@Entity({ name: "case_studies" })
export class CaseStudy {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 200 })
  slug!: string;

  @Column({ type: "varchar", length: 250 })
  title!: string;

  @Column({ type: "varchar", length: 150, nullable: true })
  department!: string | null; // simple text to match filter

  @Column({ type: "int", nullable: true })
  yearOfImplementation!: number | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  impactType!: ImpactType | string | null;

  @Column({ type: "text", nullable: true })
  summary!: string | null;

  @Column({ type: "text", nullable: true })
  problemStatement!: string | null;

  @Column({ type: "text", nullable: true })
  ideaDescription!: string | null;

  @Column({ type: "text", nullable: true })
  implementationJourney!: string | null; // freeform narrative in addition to timeline steps

  @Column({ type: "boolean", default: false })
  isFeatured!: boolean;

  // Thumbnail
  @ManyToOne(() => MediaAsset, { nullable: true, eager: true })
  thumbnail?: MediaAsset | null;

  // Attachments / gallery (images, pdfs, charts screenshots, etc.)
  @ManyToMany(() => MediaAsset, { eager: true })
  @JoinTable({ name: "case_study_media_assets" })
  media!: MediaAsset[];

  // Tags
  @ManyToMany(() => CaseStudyTag, { eager: true })
  @JoinTable({ name: "case_study_tags_join" })
  tags!: CaseStudyTag[];

  // KPIs / metrics
  @OneToMany(() => CaseStudyMetric, m => m.caseStudy, { cascade: true, eager: true })
  metrics!: CaseStudyMetric[];

  // Timeline
  @OneToMany(() => CaseStudyTimelineStep, s => s.caseStudy, { cascade: true, eager: true })
  timeline!: CaseStudyTimelineStep[];

  // Quotes / testimonials
  @OneToMany(() => CaseStudyTestimonial, t => t.caseStudy, { cascade: true, eager: true })
  testimonials!: CaseStudyTestimonial[];

  @Column({ type: "timestamp with time zone", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column({ type: "timestamp with time zone", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
