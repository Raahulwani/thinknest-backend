import { AppDataSource } from "../../config/data-source";
import { ILike, SelectQueryBuilder } from "typeorm";

import { Idea } from "../hof/entities/idea.entity";
import { Team } from "../hof/entities/team.entity";
import { Innovator } from "../hof/entities/innovator.entity";
import { Tag } from "../hof/entities/tag.entity";

import { FeaturedIdea } from "./entities/featured-idea.entity";
import { MediaAsset } from "./entities/media-asset.entity";
import { Testimonial } from "./entities/testimonial.entity";
import { ImpactRecord } from "./entities/impact-record.entity";

import { getPagination } from "../../common/utils/pagination";

type ListArgs = {
  page: number; limit: number;
  status?: string; category?: string; year?: number; businessUnit?: string;
  domain?: string; challenge?: string; tags?: string; search?: string;
  sort?: "recent" | "popular" | "year_desc" | "title_asc";
};

// --- Helpers to safely pick display fields from unknown entity shapes ---
function pickNameLike(obj: any): string | undefined {
  if (!obj) return undefined;
  return (
    obj.name ??
    obj.fullName ??
    obj.full_name ??
    obj.title ??
    obj.label ??
    obj.tag ??
    obj.displayName ??
    obj.display_name
  );
}
function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function baseCardSelect(qb: SelectQueryBuilder<FeaturedIdea>) {
  // We avoid referencing specific tag/contributor columns (like tag.name).
  // Instead, we aggregate full JSON rows and shape them in TS.
  return qb
    .leftJoin("fi.idea", "idea")
    .leftJoin("idea.tags", "tag")
    .leftJoin("idea.team", "team")
    .leftJoin("idea.contributors", "inv")
    .leftJoin("fi.mediaPreview", "mp")
    .select([
      // identity
      "fi.id as id",
      "fi.slug as slug",

      // idea card basics
      "idea.title as title",
      "idea.summary as summary",

      // featured metadata
      "fi.status as status",
      "fi.category as category",
      "fi.businessUnit as business_unit",
      "fi.year as year",

      // preview (use generic url+kind fields we know exist)
      "mp.url as preview_url",
      "mp.kind as preview_kind",
      "mp.width as preview_w",
      "mp.height as preview_h",
      "mp.blurhash as preview_blur",

      // aggregate full JSON rows to avoid relying on unknown column names
      "jsonb_agg(DISTINCT to_jsonb(tag)) as tags_json",
      "jsonb_agg(DISTINCT to_jsonb(inv)) as team_json",
    ])
    .groupBy(
      [
        "fi.id", "fi.slug",
        "idea.title", "idea.summary",
        "fi.status", "fi.category", "fi.businessUnit", "fi.year",
        "mp.url", "mp.kind", "mp.width", "mp.height", "mp.blurhash",
      ].join(", ")
    );
}

export class FeaturedService {
  async getConfig() {
    const enabled = process.env.FEATURED_IDEAS_ENABLED !== "false";
    return { module: "featured_ideas", enabled };
  }

  private applyFilters(qb: SelectQueryBuilder<FeaturedIdea>, q: ListArgs) {
    if (q.status) qb.andWhere("fi.status = :status", { status: q.status });
    if (q.category) qb.andWhere("fi.category = :category", { category: q.category });
    if (q.year) qb.andWhere("fi.year = :year", { year: q.year });
    if (q.businessUnit) qb.andWhere("fi.businessUnit = :bu", { bu: q.businessUnit });
    if (q.domain) qb.andWhere("fi.domain = :domain", { domain: q.domain });
    if (q.challenge) qb.andWhere("fi.challenge = :challenge", { challenge: q.challenge });

    // Safe text search
    if (q.search) {
      qb.andWhere("(idea.title ILIKE :q OR idea.summary ILIKE :q)", { q: `%${q.search}%` });
    }

    // IMPORTANT: We cannot safely reference tag.name because your Tag schema
    // doesn't expose a stable 'name' column. As a *working fallback*,
    // when tags= is provided we apply the text filter on title/summary too.
    if (q.tags) {
      const tokens = q.tags.split(",").map(s => s.trim()).filter(Boolean);
      if (tokens.length > 0) {
        qb.andWhere(
          tokens
            .map((_, i) => `(idea.title ILIKE :t${i} OR idea.summary ILIKE :t${i})`)
            .join(" OR "),
          Object.fromEntries(tokens.map((t, i) => [`t${i}`, `%${t}%`]))
        );
      }
    }

    // Only visible
    qb.andWhere("fi.isVisible = true");
  }

  private applySort(qb: SelectQueryBuilder<FeaturedIdea>, sort?: ListArgs["sort"]) {
    switch (sort) {
      case "popular":
        return qb.addOrderBy("fi.popularityScore", "DESC")
                 .addOrderBy("fi.updatedAt", "DESC");
      case "year_desc":
        return qb.addOrderBy("fi.year", "DESC")
                 .addOrderBy("fi.updatedAt", "DESC");
      case "title_asc":
        return qb.addOrderBy("idea.title", "ASC");
      case "recent":
      default:
        return qb.addOrderBy("fi.updatedAt", "DESC");
    }
  }

  async listIdeas(q: ListArgs) {
    const repo = AppDataSource.getRepository(FeaturedIdea);
    const qb = repo.createQueryBuilder("fi");
    baseCardSelect(qb);
    this.applyFilters(qb, q);
    this.applySort(qb, q.sort);

    const { skip, take, page, limit } = getPagination(q.page, q.limit);
    qb.skip(skip).take(take);

    const [rows, total] = await Promise.all([qb.getRawMany(), qb.getCount()]);

    const data = rows.map((r: any) => {
      // tags_json and team_json are arrays of full rows; pick best display fields
      const tagsArr: string[] = Array.isArray(r.tags_json)
        ? uniq(
            r.tags_json
              .map((t: any) => pickNameLike(t))
              .filter(Boolean)
          ) as string[]
        : [];

      const teamMembers: string[] = Array.isArray(r.team_json)
        ? uniq(
            r.team_json
              .map((m: any) => pickNameLike(m))
              .filter(Boolean)
          ) as string[]
        : [];

      const preview =
        r.preview_url
          ? (r.preview_kind === "video"
              ? {
                  imageUrl: null,
                  videoUrl: r.preview_url,
                  width: r.preview_w || null,
                  height: r.preview_h || null,
                  blurhash: r.preview_blur || null,
                }
              : {
                  imageUrl: r.preview_url,
                  videoUrl: null,
                  width: r.preview_w || null,
                  height: r.preview_h || null,
                  blurhash: r.preview_blur || null,
                })
          : null;

      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        summary: r.summary,
        status: r.status,
        tags: tagsArr,
        year: r.year,
        businessUnit: r.business_unit,
        category: r.category,
        preview,
        teamMembers,
        link: `/featured-ideas/${r.slug || r.id}`,
      };
    });

    return { page, limit, total, data };
  }

  async listCarousel(q: ListArgs) {
    const res = await this.listIdeas({
      ...q,
      page: 1,
      limit: Math.min(q.limit || 10, 12),
      sort: q.sort || "popular",
    });
    return res;
  }

  async getIdea(idOrSlug: string, include: Set<string>) {
    const fiRepo = AppDataSource.getRepository(FeaturedIdea);

    const qb = fiRepo.createQueryBuilder("fi")
      .leftJoinAndSelect("fi.idea", "idea")
      .leftJoinAndSelect("idea.team", "team")
      .leftJoinAndSelect("idea.contributors", "inv")
      .leftJoinAndSelect("idea.tags", "tag")
      .leftJoinAndSelect("fi.mediaPreview", "mp")
      .where("fi.isVisible = true")
      .andWhere("(fi.id = :idOrSlug OR fi.slug = :idOrSlug)", { idOrSlug });

    if (include.has("media")) qb.leftJoinAndSelect("fi.media", "media");
    if (include.has("impact")) qb.leftJoinAndSelect("fi.impact", "impact");
    if (include.has("testimonials")) qb.leftJoinAndSelect("fi.testimonials", "testimonials");

    const fi = await qb.getOne();
    if (!fi) return null;

    // Shape tags / contributors with best-effort display fields
    const tags = (fi.idea as any)?.tags
      ? uniq(
          (fi.idea as any).tags
            .map((t: any) => pickNameLike(t))
            .filter(Boolean)
        )
      : [];

    const contributors = (fi.idea as any)?.contributors
      ? (fi.idea as any).contributors.map((c: any) => ({
          id: c.id,
          name: pickNameLike(c) ?? "",
          department: c.department ?? c.org ?? c.role ?? null,
        }))
      : [];

    const team =
      (fi.idea as any)?.team
        ? {
            id: (fi.idea as any).team.id,
            name: pickNameLike((fi.idea as any).team) ?? (fi.idea as any).team.name ?? null,
            members: Array.isArray((fi.idea as any).team.members)
              ? (fi.idea as any).team.members.map((m: any) => ({
                  id: m.id,
                  name: pickNameLike(m) ?? "",
                }))
              : [],
          }
        : null;

    const preview = fi.mediaPreview
      ? {
          imageUrl: fi.mediaPreview.kind === "image" ? fi.mediaPreview.url : null,
          videoUrl: fi.mediaPreview.kind === "video" ? fi.mediaPreview.url : null,
          width: fi.mediaPreview.width ?? null,
          height: fi.mediaPreview.height ?? null,
          blurhash: (fi.mediaPreview as any).blurhash ?? null,
        }
      : null;

    return {
      id: fi.id,
      slug: fi.slug,
      status: fi.status,
      category: fi.category,
      businessUnit: fi.businessUnit,
      year: fi.year,
      domain: fi.domain,
      challenge: fi.challenge,

      title: (fi.idea as any)?.title,
      summary: (fi.idea as any)?.summary,
      description: fi.description ?? null,

      team,
      tags,
      contributors,

      media: include.has("media") ? (fi as any).media ?? [] : undefined,
      impact: include.has("impact") ? (fi as any).impact ?? [] : undefined,
      testimonials: include.has("testimonials") ? (fi as any).testimonials ?? [] : undefined,

      preview,
    };
  }
}
