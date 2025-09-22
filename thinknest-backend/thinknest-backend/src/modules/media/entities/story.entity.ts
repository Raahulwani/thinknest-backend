import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToMany, JoinTable, ManyToOne } from "typeorm";
import { MediaItem } from "./media-item.entity";

@Entity("stories")
export class Story {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Index() @Column({ type: "varchar", length: 160, unique: true }) slug!: string;
  @Column({ type: "varchar", length: 200 }) title!: string;

  @Column({ type: "text", nullable: true }) summary!: string | null;
  @Column({ type: "text", nullable: true }) body!: string | null;

  @Index() @Column({ type: "boolean", default: false }) isFeatured!: boolean;
  @Index() @Column({ type: "timestamp", nullable: true }) publishedAt!: Date | null;

  @ManyToOne(() => MediaItem, { nullable: true, eager: true })
  thumbnail!: MediaItem | null;

  @ManyToMany(() => MediaItem, { eager: true })
  @JoinTable({ name: "story_media_items" })
  gallery!: MediaItem[];

  @Column({ type: "varchar", length: 160, nullable: true }) tags!: string | null;
}
