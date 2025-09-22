import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from "typeorm";
import { FeaturedIdea } from "./featured-idea.entity";

@Entity("media_assets")
export class MediaAsset {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @ManyToOne(() => FeaturedIdea, (f) => f.media, { onDelete: "CASCADE" })
  featured!: FeaturedIdea;

  @Index()
  @Column({ type: "varchar", length: 8 }) kind!: "image" | "video";

  @Column({ type: "text" }) url!: string;
  @Column({ type: "int", nullable: true }) width!: number | null;
  @Column({ type: "int", nullable: true }) height!: number | null;
  @Column({ type: "varchar", length: 16, nullable: true }) format!: string | null;
  @Column({ type: "varchar", length: 16, nullable: true }) duration!: string | null; // for videos, optional

  // preview extras
  @Column({ type: "varchar", length: 64, nullable: true }) blurhash!: string | null;
  @Column({ type: "jsonb", nullable: true }) meta!: Record<string, any> | null;
}
