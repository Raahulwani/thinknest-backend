import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Challenge } from "./challenge.entity";

@Entity("challenge_faqs")
export class ChallengeFaq {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Challenge, (c) => c.faqs, { onDelete: "CASCADE" })
  challenge!: Challenge;

  @Column({ type: "varchar", length: 240 })
  question!: string;

  @Column({ type: "text" })
  answer!: string;
}
