import { asyncHandler } from "../../utils/asyncHandler.js";
import * as svc from "./matches.service.js";

export const listMyMatches = asyncHandler(async (req, res) => res.json(await svc.listMyMatches(req)));
export const getMatch = asyncHandler(async (req, res) => res.json(await svc.getMatch(req)));
export const requestClaim = asyncHandler(async (req, res) => res.json(await svc.requestClaim(req)));
export const reviewClaim = asyncHandler(async (req, res) => res.json(await svc.reviewClaim(req)));
export const dismissMatch = asyncHandler(async (req, res) => res.json(await svc.dismissMatch(req)));
