import {
  Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany, Index
} from "typeorm";
import { Innovator } from "./innovator.entity";
import { Badge } from "./badge.entity";
import { Tag } from "./tag.entity";
import { Idea } from "./idea.entity";
import { Award } from "./award.entity";

@Entity("teams")
export class Team {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Index("idx_teams_name")
  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @ManyToMany(() => Innovator, (i) => i.teams)
  @JoinTable({
    name: "team_members",
    joinColumn: { name: "team_id" },
    inverseJoinColumn: { name: "innovator_id" },
  })
  members!: Innovator[];

  @ManyToMany(() => Badge)
  @JoinTable({
    name: "team_badges",
    joinColumn: { name: "team_id" },
    inverseJoinColumn: { name: "badge_id" },
  })
  badges!: Badge[];

  @ManyToMany(() => Tag, (t) => t.teams)
  @JoinTable({
    name: "team_tags",
    joinColumn: { name: "team_id" },
    inverseJoinColumn: { name: "tag_id" },
  })
  tags!: Tag[];

  @OneToMany(() => Idea, (i) => i.team)
  ideas!: Idea[];

  @ManyToMany(() => Award, (a) => a.teamRecipients)
  awards!: Award[];
}
