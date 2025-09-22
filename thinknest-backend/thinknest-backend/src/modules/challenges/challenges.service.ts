import { AppDataSource } from "../../config/data-source";
import { ILike, SelectQueryBuilder } from "typeorm";
import { getPagination } from "../../common/utils/pagination";
import { Challenge } from "./entities/challenge.entity";
import { ChallengeFaq } from "./entities/challenge-faq.entity";
import { ChallengePrize } from "./entities/challenge-prize.entity";

type ListArgs = {
  page: number; limit: number;
  status?: "Open" | "Closed" | "Judging" | "Results";
  category?: string;
  participationType?: "Individual" | "Team" | "Both";
  deadlineBefore?: string;
  deadlineAfter?: string;
  search?: string;
  sort?: "deadline_asc" | "deadline_desc" | "recent";
};

function deriveStatus(row: {
  status: string | null;
  submission_deadline: string | null;
  judging_start: string | null;
  judging_end: string | null;
  results_date: string | null;
}) {
  const today = new Date();
  const d = (s: string | null) => (s ? new Date(s) : null);

  const sub = d(row.submission_deadline);
  const js = d(row.judging_start);
  const je = d(row.judging_end);
  const rd = d(row.results_date);

  if (rd && today >= rd) return "Results";
  if (js && je && today >= js && today <= je) return "Judging";
  if (sub && today > sub) return "Closed";
  return (row.status as any) || "Open";
}

function baseListSelect(qb: SelectQueryBuilder<Challenge>) {
  return qb
    .select([
      "c.id as id",
      "c.slug as slug",
      "c.title as title",
      "c.overview as overview",
      "c.category as category",
      "c.participationType as participation_type",
      "c.status as status",
      "c.startDate as start_date",
      "c.endDate as end_date",
      "c.submissionDeadline as submission_deadline",
      "c.judgingStart as judging_start",
      "c.judgingEnd as judging_end",
      "c.resultsDate as results_date",
      "c.thumbnailUrl as thumbnail_url",
      "c.applyUrl as apply_url",
      "c.createdAt as created_at",
    ]);
}

export class ChallengesService {
  async getConfig() {
    const enabled = process.env.CHALLENGES_ENABLED !== "false";
    // You can extend with lists of categories/participation types in future
    return { module: "challenges", enabled };
  }

  private applyFilters(qb: SelectQueryBuilder<Challenge>, q: ListArgs) {
    if (q.status) qb.andWhere("c.status = :status", { status: q.status });
    if (q.category) qb.andWhere("c.category = :category", { category: q.category });
    if (q.participationType) qb.andWhere("c.participationType = :pt", { pt: q.participationType });
    if (q.deadlineBefore) qb.andWhere("c.submissionDeadline <= :db", { db: q.deadlineBefore });
    if (q.deadlineAfter) qb.andWhere("c.submissionDeadline >= :da", { da: q.deadlineAfter });
    if (q.search) qb.andWhere("(c.title ILIKE :q OR c.overview ILIKE :q)", { q: `%${q.search}%` });
  }

  private applySorting(qb: SelectQueryBuilder<Challenge>, sort?: ListArgs["sort"]) {
    switch (sort) {
      case "deadline_asc":
        qb.orderBy("c.submissionDeadline", "ASC", "NULLS LAST");
        break;
      case "deadline_desc":
        qb.orderBy("c.submissionDeadline", "DESC", "NULLS LAST");
        break;
      default:
        qb.orderBy("c.createdAt", "DESC");
    }
  }

  async list(q: ListArgs) {
    const ds = AppDataSource;
    const repo = ds.getRepository(Challenge);
    const { skip, take, page, limit } = getPagination(q.page, q.limit);

    const qb = repo.createQueryBuilder("c");
    this.applyFilters(qb, q);
    this.applySorting(qb, q.sort);
    baseListSelect(qb);
    qb.offset(skip).limit(take);

    const [rows, total] = await Promise.all([qb.getRawMany(), qb.getCount()]);
    const data = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      overview: r.overview,
      category: r.category,
      participationType: r.participation_type,
      status: deriveStatus(r),
      dates: {
        start: r.start_date ?? null,
        end: r.end_date ?? null,
        submissionDeadline: r.submission_deadline ?? null,
      },
      thumbnailUrl: r.thumbnail_url ?? null,
      applyUrl: r.apply_url ?? null,
      createdAt: r.created_at,
    }));

    return { meta: { page, limit, total }, data };
  }

  async get(idOrSlug: string, include: Set<string>) {
    const ds = AppDataSource;
    const repo = ds.getRepository(Challenge);

    const where = idOrSlug.includes("-") ? { slug: idOrSlug } : { id: idOrSlug };
    const c = await repo.findOne({
      where: where as any,
      relations: {
        prizes: include.has("prizes"),
        faqs: include.has("faqs"),
      },
    });

    if (!c) return null;

    const todayStatus = deriveStatus({
      status: c.status,
      submission_deadline: c.submissionDeadline ?? null,
      judging_start: c.judgingStart ?? null,
      judging_end: c.judgingEnd ?? null,
      results_date: c.resultsDate ?? null,
    });

    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      overview: c.overview ?? null,
      theme: c.theme ?? null,
      goal: c.goal ?? null,
      rules: c.rules ?? null,
      eligibility: c.eligibility ?? null,
      category: c.category ?? null,
      participationType: c.participationType ?? null,
      status: todayStatus,
      timeline: {
        startDate: c.startDate ?? null,
        endDate: c.endDate ?? null,
        submissionDeadline: c.submissionDeadline ?? null,
        judgingStart: c.judgingStart ?? null,
        judgingEnd: c.judgingEnd ?? null,
        resultsDate: c.resultsDate ?? null,
      },
      thumbnailUrl: c.thumbnailUrl ?? null,
      applyUrl: c.applyUrl ?? null,
      prizes: include.has("prizes") ? c.prizes : undefined,
      faqs: include.has("faqs") ? c.faqs : undefined,
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    };
  }
}
