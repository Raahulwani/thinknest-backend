import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne, Index } from "typeorm";
import { Innovator } from "./innovator.entity";
import { Team } from "./team.entity";
import { Tag } from "./tag.entity";

@Entity("ideas")
export class Idea {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Index("idx_ideas_title")
  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text", nullable: true })
  summary?: string;

  @Column({ type: "text", nullable: true })
  outcomes?: string;

  @Column({ name: "submission_date", type: "date", nullable: true })
  submissionDate?: string;

  @ManyToMany(() => Innovator, (i) => i.ideas)
  @JoinTable({
    name: "idea_contributors",
    joinColumn: { name: "idea_id" },
    inverseJoinColumn: { name: "innovator_id" },
  })
  contributors!: Innovator[];

  @ManyToOne(() => Team, (t) => t.ideas, { nullable: true })
  team?: Team;

  @ManyToMany(() => Tag, (t) => t.ideas)
  @JoinTable({
    name: "idea_tags",
    joinColumn: { name: "idea_id" },
    inverseJoinColumn: { name: "tag_id" },
  })
  tags!: Tag[];
}
