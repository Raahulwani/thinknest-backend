import { Request, Response } from "express";
import { listQuerySchema } from "./dto/query.schema";
import { upsertNewsSchema } from "./dto/mutation.schema";
import { NewsService } from "./news.service";

const service = new NewsService();

// Public list (pagination / filters / tags / categories)
export async function listNews(req: Request, res: Response) {
  const q = listQuerySchema.parse(req.query);
  const result = await service.list(q);
  res.json(result);
}

// Public details (id or slug)
export async function getNews(req: Request, res: Response) {
  const { idOrSlug } = req.params;
  const item = await service.get(idOrSlug);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
}

// Public highlights for homepage
export async function getHighlights(req: Request, res: Response) {
  const limit = Number(req.query.limit ?? 5);
  const data = await service.highlights(limit);
  res.json({ data });
}

// Admin upsert
export async function createNews(req: Request, res: Response) {
  const body = upsertNewsSchema.parse(req.body);
  const saved = await service.upsert(body);
  res.status(201).json(saved);
}

export async function updateNews(req: Request, res: Response) {
  const { id } = req.params;
  const body = upsertNewsSchema.parse(req.body);
  const saved = await service.upsert(body, id);
  if (!saved) return res.status(404).json({ error: "Not found" });
  res.json(saved);
}

export async function deleteNews(req: Request, res: Response) {
  const { id } = req.params;
  await service.remove(id);
  res.status(204).send();
}
