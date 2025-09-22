import { Request, Response } from "express";
import { CaseStudiesService } from "./case-studies.service";
import { listQuerySchema } from "./dto/query.schema";

const service = new CaseStudiesService();

export async function listCaseStudies(req: Request, res: Response) {
  const q = listQuerySchema.parse(req.query);
  const data = await service.list(q);
  res.json(data);
}

export async function getCaseStudy(req: Request, res: Response) {
  const { idOrSlug } = req.params;
  const data = await service.get(idOrSlug);
  if (!data) return res.status(404).json({ message: "Case study not found" });
  res.json(data);
}

export async function featuredCaseStudies(req: Request, res: Response) {
  const limit = Number(req.query.limit ?? 2);
  const data = await service.featured(limit);
  res.json({ data });
}

export async function filtersMeta(req: Request, res: Response) {
  const data = await service.filtersMeta();
  res.json(data);
}
