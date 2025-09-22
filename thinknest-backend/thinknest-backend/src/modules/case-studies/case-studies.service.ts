import { AppDataSource } from "../../config/data-source";
import { SelectQueryBuilder } from "typeorm";
import { CaseStudy } from "./entities/case-study.entity";
import { CaseStudyTag } from "./entities/case-study-tag.entity";
import { ListQuery } from "./dto/query.schema";

export class CaseStudiesService {
  private qb(): SelectQueryBuilder<CaseStudy> {
    return AppDataSource.getRepository(CaseStudy)
      .createQueryBuilder("cs")
      .distinct(true) // prevent duplicates from joins
      .leftJoinAndSelect("cs.tags", "t")
      .leftJoinAndSelect("cs.thumbnail", "thumb")
      .leftJoinAndSelect("cs.media", "m")
      .leftJoinAndSelect("cs.metrics", "met")
      .leftJoinAndSelect("cs.timeline", "tl")
      .leftJoinAndSelect("cs.testimonials", "tes")
      .orderBy("cs.updatedAt", "DESC");
  }

  async list(query: ListQuery) {
    const page = Math.max(1, query.page);
    const take = Math.max(1, Math.min(100, query.limit));
    const skip = (page - 1) * take;

    const qb = this.qb();

    if (query.q) {
      qb.andWhere(
        "(cs.title ILIKE :q OR cs.summary ILIKE :q OR cs.problemStatement ILIKE :q OR cs.ideaDescription ILIKE :q)",
        { q: `%${query.q}%` }
      );
    }
    if (query.department) qb.andWhere("cs.department = :dep", { dep: query.department });
    if (query.year) qb.andWhere("cs.yearOfImplementation = :yr", { yr: query.year });
    if (query.impactType) qb.andWhere("cs.impactType = :it", { it: query.impactType });
    if (query.tag) qb.andWhere("t.name = :tag", { tag: query.tag });
    if (typeof query.featured === "boolean") qb.andWhere("cs.isFeatured = :f", { f: query.featured });

    const [items, total] = await qb.skip(skip).take(take).getManyAndCount();

    return {
      data: items.map((i) => {
        // ALWAYS send a usable URL for the card image
        const thumbnail =
          (i as any)?.thumbnail?.url ??
          ((i.media?.[0] as any)?.url ?? null);

        return {
          id: i.id,
          slug: i.slug,
          title: i.title,
          thumbnail, // string | null (frontend helper handles null)
          department: i.department,
          yearOfImplementation: i.yearOfImplementation,
          impactType: i.impactType,
          summary: i.summary,
          tags: i.tags?.map((t) => t.name) ?? [],
        };
      }),
      page,
      limit: take,
      total,
    };
  }

  // id or slug
  async get(idOrSlug: string) {
    const isUUID = /^[0-9a-f-]{36}$/i.test(idOrSlug);
    const where = isUUID ? { id: idOrSlug } : { slug: idOrSlug };
    const repo = AppDataSource.getRepository(CaseStudy);
    const item = await repo.findOne({ where });
    if (!item) return null;

    const thumbnail =
      (item as any)?.thumbnail?.url ??
      ((item.media?.[0] as any)?.url ?? null);

    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      department: item.department,
      yearOfImplementation: item.yearOfImplementation,
      impactType: item.impactType,
      summary: item.summary,
      problemStatement: item.problemStatement,
      ideaDescription: item.ideaDescription,
      implementationJourney: item.implementationJourney,
      tags: item.tags?.map((t) => t.name) ?? [],
      metrics: item.metrics ?? [],
      timeline: (item.timeline ?? []).sort((a, b) => a.orderIndex - b.orderIndex),
      testimonials: item.testimonials ?? [],
      thumbnail, // string | null
      media: item.media ?? [],
    };
  }

  // homepage “Featured Case Study” rotator
  async featured(limit = 2) {
    const items = await this.qb()
      .where("cs.isFeatured = TRUE")
      .take(Math.max(1, Math.min(4, limit)))
      .getMany();

    return items.map((i) => ({
      id: i.id,
      slug: i.slug,
      title: i.title,
      summary: i.summary,
      thumbnail:
        (i as any)?.thumbnail?.url ??
        ((i.media?.[0] as any)?.url ?? null),
    }));
  }

  // safer meta (no DISTINCT syntax issues)
  async filtersMeta() {
    const repo = AppDataSource.getRepository(CaseStudy);

    const depRows = await repo
      .createQueryBuilder("cs")
      .select("cs.department", "department")
      .where("cs.department IS NOT NULL")
      .groupBy("cs.department")
      .getRawMany();

    const yearRows = await repo
      .createQueryBuilder("cs")
      .select("cs.yearOfImplementation", "year")
      .where("cs.yearOfImplementation IS NOT NULL")
      .groupBy("cs.yearOfImplementation")
      .orderBy("cs.yearOfImplementation", "DESC")
      .getRawMany();

    const impactRows = await repo
      .createQueryBuilder("cs")
      .select("cs.impactType", "impactType")
      .where("cs.impactType IS NOT NULL")
      .groupBy("cs.impactType")
      .getRawMany();

    return {
      departments: depRows.map((r) => r.department),
      years: yearRows.map((r) => Number(r.year)).sort((a, b) => b - a),
      impactTypes: impactRows.map((r) => r.impacttype ?? r.impactType),
    };
  }
}
