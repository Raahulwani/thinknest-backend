import { AppDataSource } from "../../config/data-source";
import { In, SelectQueryBuilder } from "typeorm";
import { MediaItem } from "./entities/media-item.entity";
import { Story } from "./entities/story.entity";

type MediaListArgs = {
  page: number; limit: number; kind?: string; tag?: string; event?: string; q?: string;
  from?: string; to?: string; featured?: boolean; sort?: string; publishedOnly: boolean;
};

// UUID validator to avoid invalid uuid casts in queries
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class MediaService {
  private qbBase(): SelectQueryBuilder<MediaItem> {
    return AppDataSource.getRepository(MediaItem).createQueryBuilder("m");
  }

  async listMedia(query: MediaListArgs) {
    const qb = this.qbBase();

    if (query.publishedOnly) qb.andWhere("m.publishedAt IS NOT NULL");
    if (query.kind) qb.andWhere("m.kind = :k", { k: query.kind });
    if (query.featured) qb.andWhere("m.isFeatured = true");
    if (query.tag)
      qb.andWhere(`(',' || COALESCE(m.tags,'') || ',') ILIKE :tag`, {
        tag: `%,${query.tag},%`,
      });
    if (query.event) qb.andWhere("m.event ILIKE :ev", { ev: `%${query.event}%` });
    if (query.q)
      qb.andWhere("(m.title ILIKE :q OR m.description ILIKE :q)", {
        q: `%${query.q}%`,
      });
    if (query.from)
      qb.andWhere("m.publishedAt >= :from", { from: new Date(query.from) });
    if (query.to)
      qb.andWhere("m.publishedAt <= :to", { to: new Date(query.to) });

    qb.addOrderBy(
      query.sort === "title_asc" ? "m.title" : "m.publishedAt",
      query.sort === "title_asc" ? "ASC" : "DESC"
    );

    const skip = (query.page - 1) * query.limit;
    const [rows, total] = await qb.skip(skip).take(query.limit).getManyAndCount();

    const data = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      kind: r.kind,
      title: r.title,
      url: r.url,
      provider: r.provider,
      providerId: r.providerId,
      width: r.width,
      height: r.height,
      duration: r.duration,
      blurhash: r.blurhash,
    }));
    return { page: query.page, limit: query.limit, total, data };
  }

  async getHighlights(limit = 12) {
    const rows = await AppDataSource.getRepository(MediaItem).find({
      where: { isFeatured: true },
      order: { publishedAt: "DESC" },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      kind: r.kind,
      title: r.title,
      url: r.url,
      provider: r.provider,
      providerId: r.providerId,
      width: r.width,
      height: r.height,
      duration: r.duration,
      blurhash: r.blurhash,
    }));
  }

  async getMediaBySlugOrId(idOrSlug: string) {
    const repo = AppDataSource.getRepository(MediaItem);
    if (UUID_RE.test(idOrSlug)) {
      return await repo.findOne({ where: { id: idOrSlug } });
    }
    return await repo.findOne({ where: { slug: idOrSlug } });
  }

  async upsertMedia(payload: Partial<MediaItem>, id?: string) {
    const repo = AppDataSource.getRepository(MediaItem);
    const entity = id ? await repo.findOneBy({ id }) : repo.create();
    if (!entity && id) return null;
    Object.assign(entity ?? {}, payload);
    return await repo.save(entity ?? repo.create(payload));
  }

  // Stories
  async listStories(args: {
    page: number;
    limit: number;
    q?: string;
    tag?: string;
    featured?: boolean;
    publishedOnly: boolean;
  }) {
    const repo = AppDataSource.getRepository(Story);
    const qb = repo.createQueryBuilder("s");

    if (args.publishedOnly) qb.andWhere("s.publishedAt IS NOT NULL");
    if (args.featured) qb.andWhere("s.isFeatured = true");
    if (args.tag)
      qb.andWhere(`(',' || COALESCE(s.tags,'') || ',') ILIKE :tag`, {
        tag: `%,${args.tag},%`,
      });
    if (args.q)
      qb.andWhere("(s.title ILIKE :q OR s.summary ILIKE :q)", {
        q: `%${args.q}%`,
      });
    qb.orderBy("s.publishedAt", "DESC");

    const skip = (args.page - 1) * args.limit;
    const [rows, total] = await qb.skip(skip).take(args.limit).getManyAndCount();

    return {
      page: args.page,
      limit: args.limit,
      total,
      data: rows.map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        summary: s.summary,
        publishedAt: s.publishedAt,
        thumbnail: s.thumbnail
          ? {
              id: s.thumbnail.id,
              kind: s.thumbnail.kind,
              url: s.thumbnail.url,
              provider: s.thumbnail.provider,
              providerId: s.thumbnail.providerId,
            }
          : null,
      })),
    };
  }

  async getStory(idOrSlug: string) {
    const repo = AppDataSource.getRepository(Story);
    if (UUID_RE.test(idOrSlug)) {
      return await repo.findOne({ where: { id: idOrSlug } });
    }
    return await repo.findOne({ where: { slug: idOrSlug } });
  }

  async upsertStory(payload: any, id?: string) {
    const storyRepo = AppDataSource.getRepository(Story);
    const mediaRepo = AppDataSource.getRepository(MediaItem);

    const entity = id
      ? await storyRepo.findOne({
          where: { id },
          relations: ["gallery", "thumbnail"],
        })
      : storyRepo.create();
    if (!entity && id) return null;

    entity!.slug = payload.slug;
    entity!.title = payload.title;
    entity!.summary = payload.summary ?? null;
    entity!.body = payload.body ?? null;
    entity!.tags = payload.tags ?? null;
    entity!.isFeatured = !!payload.isFeatured;
    entity!.publishedAt = payload.publishedAt
      ? new Date(payload.publishedAt)
      : null;

    entity!.thumbnail = payload.thumbnailId
      ? await mediaRepo.findOneBy({ id: payload.thumbnailId })
      : null;

    entity!.gallery =
      payload.galleryIds?.length
        ? await mediaRepo.findBy({ id: In(payload.galleryIds) })
        : [];

    return await storyRepo.save(entity!);
  }
}
