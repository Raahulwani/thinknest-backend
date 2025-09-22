import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, Index } from "typeorm";
import { Innovator } from "./innovator.entity";

@Entity("badges")
export class Badge {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Index("uq_badges_name", { unique: true })
  @Column({ type: "varchar", length: 100, unique: true })
  name!: string;

  @Column({ type: "varchar", length: 80, nullable: true })
  icon?: string;

  @ManyToMany(() => Innovator, (i) => i.badges)
  innovators!: Innovator[];
}
