import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as svc from "./admin.service.js";

export const listUsers = asyncHandler(async (req, res) => res.json(await svc.listUsers()));
export const updateUser = asyncHandler(async (req, res) => res.json(await svc.updateUser(req)));
export const deleteUser = asyncHandler(async (req, res) => {
  await svc.deleteUser(req);
  return ApiResponse.noContent(res);
});
export const listAllItems = asyncHandler(async (req, res) => res.json(await svc.listAllItems(req)));
export const adminDeleteItem = asyncHandler(async (req, res) => {
  await svc.adminDeleteItem(req);
  return ApiResponse.noContent(res);
});
export const flagItem = asyncHandler(async (req, res) => res.json(await svc.flagItem(req)));
export const analyticsOverview = asyncHandler(async (req, res) => res.json(await svc.getAnalyticsOverview()));
export const analyticsCategories = asyncHandler(async (req, res) => res.json(await svc.getCategoryAnalytics()));
export const analyticsLocations = asyncHandler(async (req, res) => res.json(await svc.getLocationAnalytics()));
export const analyticsMatches = asyncHandler(async (req, res) => res.json(await svc.getMatchAnalytics()));
export const exportReport = asyncHandler(async (req, res) => res.json(await svc.exportReport()));
