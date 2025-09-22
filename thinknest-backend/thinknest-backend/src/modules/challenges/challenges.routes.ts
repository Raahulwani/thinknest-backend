import { Router } from "express";
import { getChallengesConfig, listChallenges, getChallengeByIdOrSlug } from "./challenges.controller";

const r = Router();

// Config / toggle
r.get("/config", getChallengesConfig);

// Lists (open/past/judging/results all via ?status=)
r.get("/", listChallenges);

// Details
r.get("/:idOrSlug", getChallengeByIdOrSlug);

export default r;
