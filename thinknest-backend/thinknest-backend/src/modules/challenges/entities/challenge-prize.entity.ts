import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Challenge } from "./challenge.entity";

@Entity("challenge_prizes")
export class ChallengePrize {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Challenge, (c) => c.prizes, { onDelete: "CASCADE" })
  challenge!: Challenge;

  @Column({ type: "varchar", length: 160 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string | null;

  @Column({ type: "numeric", nullable: true })
  amount?: number | null;

  @Column({ type: "varchar", length: 10, nullable: true })
  currency?: string | null;

  @Column({ type: "int", nullable: true })
  rank?: number | null; // 1, 2, 3, ...
}
