import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne, Index } from "typeorm";
import { Innovator } from "./innovator.entity";
import { Team } from "./team.entity";
import { Idea } from "./idea.entity";

export enum AwardLevel { Winner = "winner", RunnerUp = "runner_up", Finalist = "finalist" }

@Entity("awards")
export class Award {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  category?: string;

  @Index("idx_awards_year")
  @Column({ type: "int" })
  year!: number;

  @Column({ type: "enum", enum: AwardLevel, default: AwardLevel.Finalist })
  level!: AwardLevel;

  @Column({ type: "text", nullable: true })
  description?: string;

  @ManyToOne(() => Idea, { nullable: true })
  idea?: Idea;

  @ManyToMany(() => Innovator, (i) => i.awards)
  @JoinTable({
    name: "award_innovators",
    joinColumn: { name: "award_id" },
    inverseJoinColumn: { name: "innovator_id" },
  })
  innovatorRecipients!: Innovator[];

  @ManyToMany(() => Team, (t) => t.awards)
  @JoinTable({
    name: "award_teams",
    joinColumn: { name: "award_id" },
    inverseJoinColumn: { name: "team_id" },
  })
  teamRecipients!: Team[];
}
