import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { FeaturedIdea } from "./featured-idea.entity";

@Entity("impact_records")
export class ImpactRecord {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @ManyToOne(() => FeaturedIdea, (f) => f.impact, { onDelete: "CASCADE" })
  featured!: FeaturedIdea;

  @Column({ type: "varchar", length: 200 }) metric!: string;      // e.g., "Cost Saved", "Users Impacted"
  @Column({ type: "varchar", length: 100 }) unit!: string;        // e.g., "INR", "users", "%"
  @Column({ type: "numeric", nullable: true }) value!: number | null;
  @Column({ type: "text", nullable: true }) details!: string | null;
}
