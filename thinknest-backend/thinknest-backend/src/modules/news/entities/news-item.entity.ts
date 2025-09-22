import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable
} from "typeorm";
import { NewsTag } from "./news-tag.entity";

@Entity("news_items")
export class NewsItem {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Index("idx_news_slug", { unique: true })
  @Column({ type: "varchar", length: 160, unique: true })
  slug!: string;

  @Column({ type: "varchar", length: 180 })
  title!: string;

  @Column({ type: "varchar", length: 280 })
  summary!: string;

  @Column({ type: "text" })
  content!: string; // full article body (HTML/MD/Plain)

  @Index("idx_news_published_at")
  @Column({ type: "timestamptz", nullable: true })
  publishedAt!: Date | null;

  @Column({ type: "varchar", length: 80, nullable: true })
  category!: string | null;

  @Column({ type: "varchar", length: 8, nullable: true })
  coverKind!: "image" | "video" | null;

  @Column({ type: "text", nullable: true })
  coverUrl!: string | null;

  @Column({ type: "boolean", default: false })
  isFeatured!: boolean;

  @ManyToMany(() => NewsTag, (t) => t.items, { cascade: true })
  @JoinTable({
    name: "news_item_tags",
    joinColumn: { name: "news_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "tag_id", referencedColumnName: "id" }
  })
  tags!: NewsTag[];

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
