import { asyncHandler } from "../../utils/asyncHandler.js";
import * as svc from "./chat.service.js";

export const createConversation = asyncHandler(async (req, res) => {
  const c = await svc.createConversation(req);
  res.status(201).json(c);
});
export const listConversations = asyncHandler(async (req, res) => res.json(await svc.listConversations(req)));
export const listMessages = asyncHandler(async (req, res) => res.json(await svc.listMessages(req)));
export const sendMessage = asyncHandler(async (req, res) => {
  const m = await svc.sendMessage(req);
  res.status(201).json(m);
});
export const markMessagesRead = asyncHandler(async (req, res) => res.json(await svc.markMessagesRead(req)));
