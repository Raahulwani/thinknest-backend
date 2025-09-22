import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: "case_study_tags" })
export class CaseStudyTag {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 100 })
  name!: string;
}
