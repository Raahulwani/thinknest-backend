// modules/featured/entities/featured-idea.entity.ts

import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, OneToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn, Index
} from "typeorm";
import { Idea } from "../../hof/entities/idea.entity";
import { MediaAsset } from "./media-asset.entity";
import { Testimonial } from "./testimonial.entity";
import { ImpactRecord } from "./impact-record.entity";

@Entity("featured_ideas")
export class FeaturedIdea {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Index("idx_featured_slug", { unique: true })
  @Column({ type: "varchar", length: 160, unique: true })
  slug!: string;

  @ManyToOne(() => Idea, { eager: false, nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "idea_id" })
  idea!: Idea;

  @Column({ type: "varchar", length: 64 }) status!: string;
  @Column({ type: "varchar", length: 64, nullable: true }) category!: string | null;
  @Column({ type: "varchar", length: 64, nullable: true }) businessUnit!: string | null;
  @Column({ type: "int", nullable: true }) year!: number | null;
  @Column({ type: "varchar", length: 64, nullable: true }) domain!: string | null;
  @Column({ type: "varchar", length: 64, nullable: true }) challenge!: string | null;

  @Column({ type: "boolean", default: true }) isVisible!: boolean;
  @Column({ type: "text", nullable: true }) description!: string | null;

  @OneToOne(() => MediaAsset, { cascade: true, nullable: true })
  @JoinColumn({ name: "media_preview_id" })
  mediaPreview?: MediaAsset | null;

  @OneToMany(() => MediaAsset, (m) => m.featured, { cascade: true })
  media!: MediaAsset[];

  @OneToMany(() => Testimonial, (t) => t.featured, { cascade: true })
  testimonials!: Testimonial[];

  @OneToMany(() => ImpactRecord, (i) => i.featured, { cascade: true })
  impact!: ImpactRecord[];

  @Column({ type: "int", default: 0 }) popularityScore!: number;

  // 👇 Map to existing DB columns
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
