import { Router } from "express";
import {
  listNews, getNews, getHighlights,
  createNews, updateNews, deleteNews
} from "./news.controller";

const r = Router();

// Public
r.get("/", listNews);
r.get("/highlights", getHighlights);
r.get("/:idOrSlug", getNews);

// Admin (protect via your auth middleware when available)
r.post("/", createNews);
r.put("/:id", updateNews);
r.delete("/:id", deleteNews);

export default r;
