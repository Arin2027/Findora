import { asyncHandler } from "../../utils/asyncHandler.js";
import * as svc from "./notifications.service.js";

export const listNotifications = asyncHandler(async (req, res) => res.json(await svc.listNotifications(req)));
export const unreadCount = asyncHandler(async (req, res) => res.json(await svc.unreadCount(req)));
export const markRead = asyncHandler(async (req, res) => res.json(await svc.markRead(req)));
export const markAllRead = asyncHandler(async (req, res) => res.json(await svc.markAllRead(req)));
