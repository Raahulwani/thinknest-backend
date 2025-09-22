import { Router } from "express";
import { upload } from "./uploader";
import {
  listMedia, getMedia, getMediaHighlights, createOrUpdateMedia, uploadMedia,
  listStories, getStory, upsertStory
} from "./media.controller";

const r = Router();

// ---- Stories FIRST (so "/stories" isn't eaten by "/:idOrSlug") ----
r.get("/stories", listStories);
r.get("/stories/:idOrSlug", getStory);
r.post("/stories", upsertStory);

// ---- Other fixed paths BEFORE the dynamic route ----
r.get("/highlights", getMediaHighlights);

// ---- Public Media ----
r.get("/", listMedia);
r.get("/:idOrSlug", getMedia);

// ---- Admin-ish (protect later) ----
r.post("/", createOrUpdateMedia);
r.post("/upload", upload.single("file"), uploadMedia);

export default r;
