import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

export type MediaKind = "image" | "video" | "youtube";

@Entity("media_items")
export class MediaItem {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Index() @Column({ type: "varchar", length: 24 }) kind!: MediaKind; // image | video | youtube
  @Index() @Column({ type: "varchar", length: 160, unique: true }) slug!: string;

  @Column({ type: "varchar", length: 200 }) title!: string;
  @Column({ type: "text", nullable: true }) description!: string | null;

  // File/CDN url (images/videos), optional for embeds
  @Column({ type: "text", nullable: true }) url!: string | null;

  // Embed providers (e.g., YouTube)
  @Column({ type: "varchar", length: 80, nullable: true }) provider!: string | null;
  @Column({ type: "varchar", length: 120, nullable: true }) providerId!: string | null;

  // Rendering hints for carousels/galleries
  @Column({ type: "int", nullable: true }) width!: number | null;
  @Column({ type: "int", nullable: true }) height!: number | null;
  @Column({ type: "varchar", length: 16, nullable: true }) format!: string | null;
  @Column({ type: "varchar", length: 16, nullable: true }) duration!: string | null;

  @Column({ type: "varchar", length: 80, nullable: true }) event!: string | null;
  @Column({ type: "varchar", length: 160, nullable: true }) tags!: string | null;

  @Index() @Column({ type: "boolean", default: false }) isFeatured!: boolean;
  @Index() @Column({ type: "timestamp", nullable: true }) publishedAt!: Date | null;

  @Column({ type: "varchar", length: 64, nullable: true }) blurhash!: string | null;
  @Column({ type: "jsonb", nullable: true }) meta!: Record<string, any> | null;
}
