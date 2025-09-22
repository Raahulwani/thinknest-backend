import { Request, Response } from "express";
import { FeaturedService } from "./featured.service";
import { listQuerySchema } from "../featured/dto/query.schema";


const service = new FeaturedService(); 

export async function getFeaturedConfig(_req: Request, res: Response) {
  const cfg = await service.getConfig();
  res.json(cfg);
}

export async function listFeaturedIdeas(req: Request, res: Response) {
  const q = listQuerySchema.parse(req.query);
  const result = await service.listIdeas(q);
  res.json(result);
}

export async function listFeaturedCarousel(req: Request, res: Response) {
  const q = listQuerySchema.parse(req.query);
  const result = await service.listCarousel(q);
  res.json(result);
}

export async function getFeaturedIdeaByIdOrSlug(req: Request, res: Response) {
  const { idOrSlug } = req.params;
  const include = (req.query.include as string | undefined)?.split(",").map(s => s.trim()).filter(Boolean) ?? [];
  const idea = await service.getIdea(idOrSlug, new Set(include));
  if (!idea) return res.status(404).json({ error: "Not found" });
  res.json(idea);
}
