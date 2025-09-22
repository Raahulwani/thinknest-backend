// src/modules/news/news.service.ts
import { AppDataSource } from "../../config/data-source";
import { SelectQueryBuilder } from "typeorm";
import { NewsItem } from "./entities/news-item.entity";
import { NewsTag } from "./entities/news-tag.entity";

type ListArgs = {
  page: number;
  limit: number;
  q?: string;
  tag?: string;
  category?: string;
  featured?: boolean;
  from?: string;
  to?: string;
  publishedOnly: boolean;
  sort: "newest" | "oldest";
};

export class NewsService {
  private newsRepo = AppDataSource.getRepository(NewsItem);
  private tagRepo = AppDataSource.getRepository(NewsTag);

  private baseQB(): SelectQueryBuilder<NewsItem> {
    return this.newsRepo.createQueryBuilder("n").leftJoinAndSelect("n.tags", "t");
  }

  // ✅ Only treat the param as ID if it's a valid UUID; otherwise use slug
  private isUuid(v: string) {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
      v
    );
  }

  async list(query: ListArgs) {
    const skip = Math.max(0, (query.page - 1) * query.limit);
    const take = Math.max(1, Math.min(100, query.limit));

    const qb = this.baseQB();

    if (query.publishedOnly) qb.andWhere("n.publishedAt IS NOT NULL");
    if (query.q) {
      qb.andWhere("(n.title ILIKE :q OR n.summary ILIKE :q OR n.content ILIKE :q)", {
        q: `%${query.q}%`,
      });
    }
    if (query.tag) qb.andWhere("t.name = :tag", { tag: query.tag });
    if (query.category) qb.andWhere("n.category = :cat", { cat: query.category });
    if (query.featured !== undefined) qb.andWhere("n.isFeatured = :f", { f: query.featured });
    if (query.from) qb.andWhere("n.publishedAt >= :from", { from: query.from });
    if (query.to) qb.andWhere("n.publishedAt <= :to", { to: query.to });

    qb.orderBy("n.publishedAt", query.sort === "newest" ? "DESC" : "ASC");
    qb.skip(skip).take(take);

    const [items, total] = await qb.getManyAndCount();
    return {
      page: query.page,
      limit: query.limit,
      total,
      data: items.map((n) => ({
        id: n.id,
        slug: n.slug,
        title: n.title,
        summary: n.summary,
        publishedAt: n.publishedAt,
        cover: n.coverUrl ? { kind: n.coverKind, url: n.coverUrl } : null,
        category: n.category,
        tags: n.tags?.map((t) => t.name) ?? [],
        isFeatured: n.isFeatured, // ← included so the frontend can flag featured items
      })),
    };
  }

  // ✅ FIXED: no more "invalid input syntax for type uuid" when a slug is passed
  async get(idOrSlug: string) {
    const where = this.isUuid(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
    return this.newsRepo.findOne({
      where,
      relations: ["tags"],
    });
  }

  async upsert(
    payload: {
      slug: string;
      title: string;
      summary: string;
      content: string;
      publishedAt?: string | null;
      category?: string | null;
      coverKind?: "image" | "video" | null;
      coverUrl?: string | null;
      isFeatured?: boolean;
      tags?: string[];
    },
    id?: string
  ) {
    const entity = id
      ? await this.newsRepo.findOne({ where: { id }, relations: ["tags"] })
      : this.newsRepo.create();
    if (!entity) return null;

    entity.slug = payload.slug;
    entity.title = payload.title;
    entity.summary = payload.summary;
    entity.content = payload.content;
    entity.publishedAt = payload.publishedAt ? new Date(payload.publishedAt) : null;
    entity.category = payload.category ?? null;
    entity.coverKind = payload.coverKind ?? null;
    entity.coverUrl = payload.coverUrl ?? null;
    entity.isFeatured = payload.isFeatured ?? false;

    if (payload.tags) {
      const uniqueNames = [...new Set(payload.tags.map((s) => s.trim()).filter(Boolean))];
      const existing = await this.tagRepo.find({
        where: uniqueNames.map((name) => ({ name })),
      });
      const existingNames = new Set(existing.map((t) => t.name));
      const toCreate = uniqueNames
        .filter((n) => !existingNames.has(n))
        .map((name) => this.tagRepo.create({ name }));
      const savedNew = toCreate.length ? await this.tagRepo.save(toCreate) : [];
      entity.tags = [...existing, ...savedNew];
    }

    return await this.newsRepo.save(entity);
  }

  async remove(id: string) {
    await this.newsRepo.delete(id);
  }

  async highlights(limit: number = 5) {
    const qb = this.baseQB()
      .where("n.publishedAt IS NOT NULL")
      .orderBy("n.publishedAt", "DESC")
      .take(Math.max(1, Math.min(20, limit)));

    const items = await qb.getMany();
    return items.map((n) => ({
      id: n.id,
      slug: n.slug,
      title: n.title,
      summary: n.summary,
      publishedAt: n.publishedAt,
      cover: n.coverUrl ? { kind: n.coverKind, url: n.coverUrl } : null,
      category: n.category,
      tags: n.tags?.map((t) => t.name) ?? [],
    }));
  }
}
