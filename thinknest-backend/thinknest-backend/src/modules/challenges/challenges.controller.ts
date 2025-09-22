import { Request, Response } from "express";
import { listQuerySchema } from "./dto/query.schema";
import { ChallengesService } from "./challenges.service";

const service = new ChallengesService();

export async function getChallengesConfig(_req: Request, res: Response) {
  const cfg = await service.getConfig();
  res.json(cfg);
}

export async function listChallenges(req: Request, res: Response) {
  const q = listQuerySchema.parse(req.query);
  const result = await service.list(q);
  res.json(result);
}

export async function getChallengeByIdOrSlug(req: Request, res: Response) {
  const { idOrSlug } = req.params;
  const include = (req.query.include as string | undefined)?.split(",").map(s => s.trim()).filter(Boolean) ?? [];
  const result = await service.get(idOrSlug, new Set(include));
  if (!result) return res.status(404).json({ error: "Not found" });
  res.json(result);
}
