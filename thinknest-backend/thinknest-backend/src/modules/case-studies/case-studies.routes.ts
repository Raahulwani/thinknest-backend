import { Router } from "express";
import { listCaseStudies, getCaseStudy, featuredCaseStudies, filtersMeta } from "./case-studies.controller";

const r = Router();

// Listing + filters
r.get("/", listCaseStudies);
r.get("/filters/meta", filtersMeta);

// Featured for Home Page rotator
r.get("/featured", featuredCaseStudies);

// Detail
r.get("/:idOrSlug", getCaseStudy);

export default r;
