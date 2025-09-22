import { Router } from "express";
import {
  listFeaturedIdeas,
  getFeaturedIdeaByIdOrSlug,
  listFeaturedCarousel,
  getFeaturedConfig
} from "./featured.controller";

const r = Router();

// Visibility/config
r.get("/config", getFeaturedConfig);

// Feed & carousel
r.get("/", listFeaturedIdeas);
r.get("/carousel", listFeaturedCarousel);

// Details
r.get("/:idOrSlug", getFeaturedIdeaByIdOrSlug);

export default r;
