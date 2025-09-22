import { Request, Response } from "express";
import { listQuerySchema } from "./dto/query.schema";
import { HofService } from "./hof.service";

const service = new HofService();

function parseInclude(raw?: string): Set<string> {
  return new Set((raw || "").split(",").map(s => s.trim()).filter(Boolean));
}

export async function listInnovators(req: Request, res: Response) {
  const q = listQuerySchema.parse(req.query);
  const tags = q.tags ? q.tags.split(",").map(s => s.trim()).filter(Boolean) : undefined;
  const include = parseInclude(q.include);
  const { total, data } = await service.listInnovators({
    tag: q.tag, tags, year: q.year, yearField: q.yearField,
    department: q.department, badge: q.badge, search: q.search,
    hasAwards: q.hasAwards, sort: q.sort,
    include, ideasLimit: q.ideasLimit, awardsLimit: q.awardsLimit, membersLimit: q.membersLimit,
    page: q.page, limit: q.limit,
  });
  res.json({ meta: { page: q.page, limit: q.limit, total }, data });
}

export async function listTeams(req: Request, res: Response) {
  const q = listQuerySchema.parse(req.query);
  const tags = q.tags ? q.tags.split(",").map(s => s.trim()).filter(Boolean) : undefined;
  const include = parseInclude(q.include);
  const { total, data } = await service.listTeams({
    tag: q.tag, tags, year: q.year, yearField: q.yearField,
    department: q.department, badge: q.badge, search: q.search,
    hasAwards: q.hasAwards, sort: q.sort,
    include, ideasLimit: q.ideasLimit, awardsLimit: q.awardsLimit, membersLimit: q.membersLimit,
    page: q.page, limit: q.limit,
  });
  res.json({ meta: { page: q.page, limit: q.limit, total }, data });
}

export async function getInnovator(req: Request, res: Response) {
  const id = req.params.id;
  const data = await service.getInnovator(id);
  if (!data) return res.status(404).json({ error: { message: "Innovator not found", status: 404 } });
  res.json(data);
}

export async function getTeam(req: Request, res: Response) {
  const id = req.params.id;
  const data = await service.getTeam(id);
  if (!data) return res.status(404).json({ error: { message: "Team not found", status: 404 } });
  res.json(data);
}

export async function getYears(_req: Request, res: Response) {
  const data = await service.listYears();
  res.json(data);
}

export async function getBadges(_req: Request, res: Response) {
  const data = await service.listBadges();
  res.json(data);
}

export async function getTags(_req: Request, res: Response) {
  const data = await service.listTags();
  res.json(data);
}
