import { Request, Response } from "express";
import { listQuerySchema } from "./dto/query.schema";
import { upsertMediaSchema, upsertStorySchema } from "./dto/mutation.schema";
import { MediaService } from "./media.service";

const service = new MediaService();

export async function listMedia(req: Request, res: Response) {
  const q = listQuerySchema.parse(req.query);
  const result = await service.listMedia(q);
  res.json(result);
}
export async function getMedia(req: Request, res: Response) {
  const { idOrSlug } = req.params;
  const item = await service.getMediaBySlugOrId(idOrSlug);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
}
export async function getMediaHighlights(_req: Request, res: Response) {
  res.json(await service.getHighlights(12));
}
export async function createOrUpdateMedia(req: Request, res: Response) {
  const body = upsertMediaSchema.parse(req.body);
  const saved = await service.upsertMedia({ ...body, publishedAt: body.publishedAt ? new Date(body.publishedAt) : null });
  res.status(201).json(saved);
}
export async function uploadMedia(req: Request, res: Response) {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const body = upsertMediaSchema.partial().parse(req.body);
  const saved = await service.upsertMedia({
    ...body,
    kind: body.kind ?? "image",
    slug: body.slug ?? file.filename,
    title: body.title ?? file.originalname,
    url: `/uploads/${file.filename}`,
    format: file.mimetype,
    width: body.width ?? null,
    height: body.height ?? null,
    duration: body.duration ?? null,
    publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
  });
  res.status(201).json(saved);
}

// Stories
export async function listStories(req: Request, res: Response) {
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 10), 100);
  const q = (req.query.q as string | undefined) ?? undefined;
  const tag = (req.query.tag as string | undefined) ?? undefined;
  const featured = req.query.featured === "true";
  const publishedOnly = (req.query.publishedOnly ?? "true") !== "false";
  const result = await service.listStories({ page, limit, q, tag, featured, publishedOnly });
  res.json(result);
}
export async function getStory(req: Request, res: Response) {
  const { idOrSlug } = req.params;
  const story = await service.getStory(idOrSlug);
  if (!story) return res.status(404).json({ error: "Not found" });
  res.json(story);
}
export async function upsertStory(req: Request, res: Response) {
  const body = upsertStorySchema.parse(req.body);
  const saved = await service.upsertStory(body);
  res.status(201).json(saved);
}
