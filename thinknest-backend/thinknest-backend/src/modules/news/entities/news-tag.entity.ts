import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToMany } from "typeorm";
import { NewsItem } from "./news-item.entity";

@Entity("news_tags")
export class NewsTag {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Index("idx_news_tag_name", { unique: true })
  @Column({ type: "varchar", length: 64, unique: true })
  name!: string;

  @ManyToMany(() => NewsItem, (n) => n.tags)
  items!: NewsItem[];
}
