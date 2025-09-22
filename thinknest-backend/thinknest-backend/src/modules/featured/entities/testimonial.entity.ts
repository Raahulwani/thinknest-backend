import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { FeaturedIdea } from "./featured-idea.entity";

@Entity("testimonials")
export class Testimonial {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @ManyToOne(() => FeaturedIdea, (f) => f.testimonials, { onDelete: "CASCADE" })
  featured!: FeaturedIdea;

  @Column({ type: "varchar", length: 200 }) author!: string;
  @Column({ type: "varchar", length: 200, nullable: true }) role!: string | null;
  @Column({ type: "text" }) quote!: string;
}
