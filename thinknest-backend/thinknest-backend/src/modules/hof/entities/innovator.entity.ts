import {
  Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, Index,
  CreateDateColumn, UpdateDateColumn
} from "typeorm";
import { Badge } from "./badge.entity";
import { Tag } from "./tag.entity";
import { Idea } from "./idea.entity";
import { Award } from "./award.entity";
import { Team } from "./team.entity";

@Entity("innovators")
export class Innovator {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Index("idx_innovators_full_name")
  @Column({ name: "full_name", type: "varchar", length: 200 })
  fullName!: string;

  @Column({ name: "photo_url", type: "text", nullable: true })
  photoUrl?: string;

  @Index("idx_innovators_department")
  @Column({ type: "varchar", length: 120 })
  department!: string;

  @Column({ type: "text", nullable: true })
  bio?: string;

  @ManyToMany(() => Badge, (b) => b.innovators)
  @JoinTable({
    name: "innovator_badges",
    joinColumn: { name: "innovator_id" },
    inverseJoinColumn: { name: "badge_id" },
  })
  badges!: Badge[];

  @ManyToMany(() => Tag, (t) => t.innovators)
  @JoinTable({
    name: "innovator_tags",
    joinColumn: { name: "innovator_id" },
    inverseJoinColumn: { name: "tag_id" },
  })
  tags!: Tag[];

  @ManyToMany(() => Idea, (i) => i.contributors)
  ideas!: Idea[];

  @ManyToMany(() => Award, (a) => a.innovatorRecipients)
  awards!: Award[];

  @ManyToMany(() => Team, (t) => t.members)
  teams!: Team[];

  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt!: Date;
}
