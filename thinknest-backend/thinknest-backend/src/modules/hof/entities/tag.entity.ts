import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, Index } from "typeorm";
import { Innovator } from "./innovator.entity";
import { Team } from "./team.entity";
import { Idea } from "./idea.entity";

@Entity("tags")
export class Tag {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Index("uq_tags_slug", { unique: true })
  @Column({ type: "varchar", length: 100, unique: true })
  slug!: string;

  @Column({ type: "varchar", length: 140, nullable: true })
  label?: string;

  @ManyToMany(() => Innovator, (i) => i.tags)
  innovators!: Innovator[];

  @ManyToMany(() => Team, (t) => t.tags)
  teams!: Team[];

  @ManyToMany(() => Idea, (i) => i.tags)
  ideas!: Idea[];
}
