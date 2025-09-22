import {
  Entity, PrimaryGeneratedColumn, Column, OneToMany, Index,
  CreateDateColumn, UpdateDateColumn
} from "typeorm";
import { ChallengePrize } from "./challenge-prize.entity";
import { ChallengeFaq } from "./challenge-faq.entity";

export type ChallengeStatus = "Open" | "Closed" | "Judging" | "Results";

@Entity("challenges")
export class Challenge {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index("idx_challenge_slug", { unique: true })
  @Column({ type: "varchar", length: 160, unique: true })
  slug!: string;

  @Index("idx_challenge_status")
  @Column({ type: "varchar", length: 20, default: "Open" })
  status!: ChallengeStatus; // fallback; service also derives from dates

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text", nullable: true })
  overview?: string | null;

  @Column({ type: "varchar", length: 160, nullable: true })
  theme?: string | null;

  @Column({ type: "text", nullable: true })
  goal?: string | null;

  @Column({ type: "text", nullable: true })
  rules?: string | null;

  @Column({ type: "text", nullable: true })
  eligibility?: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  category?: string | null;

  // "Individual" | "Team" | "Both"
  @Column({ type: "varchar", length: 30, nullable: true })
  participationType?: string | null;

  // Timeline
  @Column({ type: "date", nullable: true }) startDate?: string | null;
  @Column({ type: "date", nullable: true }) endDate?: string | null;
  @Column({ type: "date", nullable: true }) submissionDeadline?: string | null;
  @Column({ type: "date", nullable: true }) judgingStart?: string | null;
  @Column({ type: "date", nullable: true }) judgingEnd?: string | null;
  @Column({ type: "date", nullable: true }) resultsDate?: string | null;

  // Media & links
  @Column({ type: "text", nullable: true }) thumbnailUrl?: string | null;
  @Column({ type: "text", nullable: true }) applyUrl?: string | null;

  // Details
  @OneToMany(() => ChallengePrize, (p) => p.challenge, { cascade: true })
  prizes!: ChallengePrize[];

  @OneToMany(() => ChallengeFaq, (f) => f.challenge, { cascade: true })
  faqs!: ChallengeFaq[];

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
