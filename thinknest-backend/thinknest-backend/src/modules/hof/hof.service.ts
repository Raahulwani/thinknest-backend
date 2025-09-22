import { AppDataSource } from "../../config/data-source";
import { Innovator } from "./entities/innovator.entity";
import { Team } from "./entities/team.entity";
import { Idea } from "./entities/idea.entity";
import { Award } from "./entities/award.entity";
import { Badge } from "./entities/badge.entity";
import { Tag } from "./entities/tag.entity";
import { applyHofSort } from "../../common/utils/sort-hof";
import { In } from "typeorm";

type ListArgs = {
  tag?: string;
  tags?: string[];
  year?: number;
  yearField?: "award" | "idea";
  department?: string;
  badge?: string;
  search?: string;
  hasAwards?: boolean;
  sort?: string;
  include?: Set<string>;
  ideasLimit: number;
  awardsLimit: number;
  membersLimit: number;
  page: number;
  limit: number;
};

export class HofService {
  private innovatorRepo = AppDataSource.getRepository(Innovator);
  private teamRepo = AppDataSource.getRepository(Team);
  private ideaRepo = AppDataSource.getRepository(Idea);
  private awardRepo = AppDataSource.getRepository(Award);
  private badgeRepo = AppDataSource.getRepository(Badge);
  private tagRepo = AppDataSource.getRepository(Tag);

  async listInnovators(args: ListArgs) {
    const {
      tag, tags, year, yearField = "award", department, badge, search, hasAwards,
      sort, include = new Set(), ideasLimit, awardsLimit, page, limit
    } = args;

    const qb = this.innovatorRepo
      .createQueryBuilder("inv")
      .leftJoin("inv.badges", "bdg")
      .leftJoin("inv.tags", "tg")
      .leftJoin("inv.ideas", "idea")
      .leftJoin("inv.awards", "awd")
      .select([
        "inv.id as id",
        "inv.full_name as name",
        "inv.photo_url as photo_url",
        "inv.department as department",
        "COUNT(DISTINCT idea.id) as ideas_count",
        "COUNT(DISTINCT awd.id) as awards_count",
        "MAX(awd.year) as recent_award_year",
      ])
      .groupBy("inv.id");

    if (department) qb.andWhere("inv.department ILIKE :dept", { dept: `%${department}%` });
    if (badge) qb.andWhere("bdg.name = :badge", { badge });
    if (search) qb.andWhere("(inv.full_name ILIKE :s OR inv.department ILIKE :s)", { s: `%${search}%` });

    if (tag) qb.andWhere("tg.slug = :tag", { tag });
    if (tags && tags.length) qb.andWhere("tg.slug = ANY(:tags)", { tags });

    if (year) {
      if (yearField === "award") qb.andWhere("awd.year = :year", { year });
      else qb.andWhere("EXTRACT(YEAR FROM idea.submission_date) = :year", { year });
    }

    if (hasAwards === true) qb.having("COUNT(DISTINCT awd.id) > 0");

    applyHofSort(qb as any, sort);
    qb.offset((page - 1) * limit).limit(limit);

    const rows = await qb.getRawMany<any>();
    const ids = rows.map(r => r.id);

    const badgesById = new Map<string, string[]>();
    const ideasById = new Map<string, any[]>();
    const awardsById = new Map<string, any[]>();

    if (include.has("badges") && ids.length) {
      const withBadges = await this.innovatorRepo.find({ where: { id: In(ids) }, relations: { badges: true } });
      for (const inv of withBadges) badgesById.set(inv.id, (inv.badges ?? []).map(b => b.name));
    }

    if (include.has("ideas") && ids.length) {
      const ideaRows = await this.ideaRepo
        .createQueryBuilder("idea")
        .leftJoin("idea.contributors", "inv")
        .select([ "idea.id as idea_id", "idea.title as title", "idea.outcomes as outcomes", "inv.id as inv_id", "idea.submission_date as submission_date" ])
        .where("inv.id IN (:...ids)", { ids })
        .orderBy("idea.submission_date", "DESC", "NULLS LAST")
        .getRawMany<any>();

      const grouped = new Map<string, any[]>();
      for (const r of ideaRows) {
        if (!grouped.has(r.inv_id)) grouped.set(r.inv_id, []);
        const list = grouped.get(r.inv_id)!;
        if (list.length < ideasLimit) list.push({ id: r.idea_id, title: r.title, outcomes: r.outcomes ?? undefined });
      }
      for (const [k, v] of grouped) ideasById.set(k, v);
    }

    if (include.has("awards") && ids.length) {
      const awardRows = await this.awardRepo
        .createQueryBuilder("awd")
        .leftJoin("awd.innovatorRecipients", "inv")
        .select([ "awd.id as award_id", "awd.name as name", "awd.year as year", "awd.category as category", "awd.level as level", "inv.id as inv_id" ])
        .where("inv.id IN (:...ids)", { ids })
        .orderBy("awd.year", "DESC")
        .addOrderBy("awd.level", "ASC")
        .getRawMany<any>();

      const grouped = new Map<string, any[]>();
      for (const r of awardRows) {
        if (!grouped.has(r.inv_id)) grouped.set(r.inv_id, []);
        const list = grouped.get(r.inv_id)!;
        if (list.length < awardsLimit) list.push({ id: r.award_id, name: r.name, year: Number(r.year), category: r.category ?? undefined, level: r.level });
      }
      for (const [k, v] of grouped) awardsById.set(k, v);
    }

    const data = rows.map((r: any) => ({
      id: r.id,
      type: "innovator",
      name: r.name,
      photoUrl: r.photo_url ?? undefined,
      department: r.department,
      badges: badgesById.get(r.id) ?? [],
      counts: include.has("counts") ? { ideas: Number(r.ideas_count || 0), awards: Number(r.awards_count || 0) } : undefined,
      ideas: ideasById.get(r.id),
      awards: awardsById.get(r.id),
    }));

    const countQb = this.innovatorRepo
      .createQueryBuilder("inv")
      .leftJoin("inv.badges", "bdg")
      .leftJoin("inv.tags", "tg")
      .leftJoin("inv.ideas", "idea")
      .leftJoin("inv.awards", "awd")
      .select("COUNT(DISTINCT inv.id)", "cnt");

    if (department) countQb.andWhere("inv.department ILIKE :dept", { dept: `%${department}%` });
    if (badge) countQb.andWhere("bdg.name = :badge", { badge });
    if (search) countQb.andWhere("(inv.full_name ILIKE :s OR inv.department ILIKE :s)", { s: `%${search}%` });
    if (tag) countQb.andWhere("tg.slug = :tag", { tag });
    if (tags && tags.length) countQb.andWhere("tg.slug = ANY(:tags)", { tags });
    if (year) {
      if (yearField === "award") countQb.andWhere("awd.year = :year", { year });
      else countQb.andWhere("EXTRACT(YEAR FROM idea.submission_date) = :year", { year });
    }
    if (hasAwards === true) countQb.andWhere("EXISTS (SELECT 1 FROM award_innovators ai WHERE ai.innovator_id = inv.id)");

    const totalRow = await countQb.getRawOne<{ cnt: string }>();
    const total = Number(totalRow?.cnt || 0);

    return { total, data };
  }

  async getInnovator(id: string) {
    const inv = await this.innovatorRepo.findOne({
      where: { id },
      relations: { badges: true, ideas: true, awards: true, teams: true, tags: true },
    });
    if (!inv) return null;
    const awards = (inv.awards ?? []).sort((a, b) => (b.year || 0) - (a.year || 0));
    return {
      id: inv.id,
      name: inv.fullName,
      photoUrl: inv.photoUrl ?? undefined,
      department: inv.department,
      bio: inv.bio ?? undefined,
      badges: (inv.badges ?? []).map(b => b.name),
      ideas: (inv.ideas ?? []).map(i => ({ id: i.id, title: i.title, outcomes: i.outcomes ?? undefined })),
      awards: awards.map(a => ({ id: a.id, name: a.name, year: a.year, category: a.category ?? undefined, level: a.level })),
      teams: (inv.teams ?? []).map(t => ({ id: t.id, name: t.name })),
      tags: (inv.tags ?? []).map(t => t.slug),
    };
  }

  async listTeams(args: ListArgs) {
    const {
      tag, tags, year, yearField = "award", department, badge, search, hasAwards,
      sort, include = new Set(), ideasLimit, awardsLimit, membersLimit, page, limit
    } = args;

    const qb = this.teamRepo
      .createQueryBuilder("tm")
      .leftJoin("tm.members", "mem")
      .leftJoin("tm.awards", "awd")
      .leftJoin("tm.ideas", "idea")
      .leftJoin("tm.badges", "bdg")
      .leftJoin("tm.tags", "tg")
      .select([
        "tm.id as id",
        "tm.name as name",
        "COUNT(DISTINCT mem.id) as members_count",
        "COUNT(DISTINCT idea.id) as ideas_count",
        "COUNT(DISTINCT awd.id) as awards_count",
        "MAX(awd.year) as recent_award_year"
      ])
      .groupBy("tm.id");

    if (department) qb.andWhere("mem.department ILIKE :dept", { dept: `%${department}%` });
    if (badge) qb.andWhere("bdg.name = :badge", { badge });
    if (search) qb.andWhere("(tm.name ILIKE :s OR idea.title ILIKE :s)", { s: `%${search}%` });
    if (tag) qb.andWhere("tg.slug = :tag", { tag });
    if (tags && tags.length) qb.andWhere("tg.slug = ANY(:tags)", { tags });

    if (year) {
      if (yearField === "award") qb.andWhere("awd.year = :year", { year });
      else qb.andWhere("EXTRACT(YEAR FROM idea.submission_date) = :year", { year });
    }

    if (hasAwards === true) qb.having("COUNT(DISTINCT awd.id) > 0");

    switch (sort) {
      case "name_asc": qb.addOrderBy("name", "ASC"); break;
      case "name_desc": qb.addOrderBy("name", "DESC"); break;
      case "awards_desc": qb.addOrderBy("awards_count", "DESC").addOrderBy("recent_award_year", "DESC"); break;
      case "ideas_desc": qb.addOrderBy("ideas_count", "DESC"); break;
      case "recent_award_desc": qb.addOrderBy("recent_award_year", "DESC").addOrderBy("awards_count", "DESC"); break;
      default: qb.addOrderBy("name", "ASC"); break;
    }

    qb.offset((page - 1) * limit).limit(limit);

    const rows = await qb.getRawMany<any>();
    const ids = rows.map((r:any) => r.id);

    const badgesById = new Map<string, string[]>();
    const membersById = new Map<string, any[]>();
    const ideasById = new Map<string, any[]>();
    const awardsById = new Map<string, any[]>();

    if (include.has("badges") && ids.length) {
      const withBadges = await this.teamRepo.find({ where: { id: In(ids) }, relations: { badges: true } });
      for (const t of withBadges) badgesById.set(t.id, (t.badges ?? []).map(b => b.name));
    }

    if (include.has("members") && ids.length) {
      const mrows = await this.teamRepo
        .createQueryBuilder("tm")
        .leftJoin("tm.members", "mem")
        .select(["tm.id as team_id", "mem.id as mem_id", "mem.full_name as name", "mem.photo_url as photo_url"])
        .where("tm.id IN (:...ids)", { ids })
        .orderBy("name", "ASC")
        .getRawMany<any>();

      const grouped = new Map<string, any[]>();
      for (const r of mrows) {
        if (!grouped.has(r.team_id)) grouped.set(r.team_id, []);
        const list = grouped.get(r.team_id)!;
        if (list.length < membersLimit) list.push({ id: r.mem_id, name: r.name, photoUrl: r.photo_url ?? undefined });
      }
      for (const [k, v] of grouped) membersById.set(k, v);
    }

    if (include.has("ideas") && ids.length) {
      const irows = await this.ideaRepo
        .createQueryBuilder("idea")
        .leftJoin("idea.team", "tm")
        .select(["idea.id as idea_id", "idea.title as title", "idea.outcomes as outcomes", "tm.id as team_id", "idea.submission_date as submission_date"])
        .where("tm.id IN (:...ids)", { ids })
        .orderBy("idea.submission_date", "DESC", "NULLS LAST")
        .getRawMany<any>();

      const grouped = new Map<string, any[]>();
      for (const r of irows) {
        if (!grouped.has(r.team_id)) grouped.set(r.team_id, []);
        const list = grouped.get(r.team_id)!;
        if (list.length < ideasLimit) list.push({ id: r.idea_id, title: r.title, outcomes: r.outcomes ?? undefined });
      }
      for (const [k, v] of grouped) ideasById.set(k, v);
    }

    if (include.has("awards") && ids.length) {
      const arows = await this.awardRepo
        .createQueryBuilder("awd")
        .leftJoin("awd.teamRecipients", "tm")
        .select(["awd.id as award_id", "awd.name as name", "awd.year as year", "awd.category as category", "awd.level as level", "tm.id as team_id"])
        .where("tm.id IN (:...ids)", { ids })
        .orderBy("awd.year", "DESC")
        .addOrderBy("awd.level", "ASC")
        .getRawMany<any>();

      const grouped = new Map<string, any[]>();
      for (const r of arows) {
        if (!grouped.has(r.team_id)) grouped.set(r.team_id, []);
        const list = grouped.get(r.team_id)!;
        if (list.length < awardsLimit) list.push({ id: r.award_id, name: r.name, year: Number(r.year), category: r.category ?? undefined, level: r.level });
      }
      for (const [k, v] of grouped) awardsById.set(k, v);
    }

    const data = rows.map((r:any) => ({
      id: r.id,
      type: "team",
      name: r.name,
      badges: badgesById.get(r.id) ?? [],
      counts: include.has("counts")
        ? { ideas: Number(r.ideas_count || 0), awards: Number(r.awards_count || 0), members: Number(r.members_count || 0) }
        : undefined,
      members: membersById.get(r.id),
      ideas: ideasById.get(r.id),
      awards: awardsById.get(r.id),
    }));

    const countQb = this.teamRepo
      .createQueryBuilder("tm")
      .leftJoin("tm.members", "mem")
      .leftJoin("tm.awards", "awd")
      .leftJoin("tm.ideas", "idea")
      .leftJoin("tm.badges", "bdg")
      .leftJoin("tm.tags", "tg")
      .select("COUNT(DISTINCT tm.id)", "cnt");

    if (department) countQb.andWhere("mem.department ILIKE :dept", { dept: `%${department}%` });
    if (badge) countQb.andWhere("bdg.name = :badge", { badge });
    if (search) countQb.andWhere("(tm.name ILIKE :s OR idea.title ILIKE :s)", { s: `%${search}%` });
    if (tag) countQb.andWhere("tg.slug = :tag", { tag });
    if (tags && tags.length) countQb.andWhere("tg.slug = ANY(:tags)", { tags });
    if (year) {
      if (yearField === "award") countQb.andWhere("awd.year = :year", { year });
      else countQb.andWhere("EXTRACT(YEAR FROM idea.submission_date) = :year", { year });
    }
    if (hasAwards === true) countQb.andWhere("EXISTS (SELECT 1 FROM award_teams at WHERE at.team_id = tm.id)");

    const totalRow = await countQb.getRawOne<{ cnt: string }>();
    const total = Number(totalRow?.cnt || 0);

    return { total, data };
  }

  async getTeam(id: string) {
    const team = await this.teamRepo.findOne({
      where: { id },
      relations: { members: true, badges: true, ideas: true, awards: true, tags: true },
    });
    if (!team) return null;
    const awards = (team.awards ?? []).sort((a, b) => (b.year || 0) - (a.year || 0));
    return {
      id: team.id,
      name: team.name,
      badges: (team.badges ?? []).map(b => b.name),
      members: (team.members ?? []).map(m => ({ id: m.id, name: m.fullName, photoUrl: m.photoUrl ?? undefined })),
      ideas: (team.ideas ?? []).map(i => ({ id: i.id, title: i.title, outcomes: i.outcomes ?? undefined })),
      awards: awards.map(a => ({ id: a.id, name: a.name, year: a.year, category: a.category ?? undefined, level: a.level })),
      tags: (team.tags ?? []).map(t => t.slug),
    };
  }

  async listYears() {
    const rows = await this.awardRepo
      .createQueryBuilder("a")
      .select("a.year", "year")
      .addSelect("COUNT(1)", "count")
      .groupBy("a.year")
      .orderBy("a.year", "DESC")
      .getRawMany<{ year: string; count: string }>();
    return rows.map(r => ({ year: Number(r.year), count: Number(r.count) }));
  }

  async listBadges() {
    const raw = await this.innovatorRepo
      .createQueryBuilder("inv")
      .leftJoin("inv.badges", "bdg")
      .select(["bdg.name as name", "COUNT(DISTINCT inv.id) as cnt"])
      .groupBy("bdg.name")
      .orderBy("bdg.name", "ASC")
      .getRawMany<{ name: string; cnt: string }>();
    return raw.filter(r => r.name).map(r => ({ name: r.name, count: Number(r.cnt) }));
  }

  async listTags() {
    const tags = await this.tagRepo.find({ order: { slug: "ASC" } });
    return tags.map(t => t.slug);
  }
}
