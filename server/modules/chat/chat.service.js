import mongoose from "mongoose";
import { validationResult } from "express-validator";
import { Conversation } from "../../models/Conversation.js";
import { Message } from "../../models/Message.js";
import { Match } from "../../models/Match.js";
import { Item } from "../../models/Item.js";
import { AppError } from "../../utils/AppError.js";

async function userOwnsItemInMatch(userId, match) {
  const [a, b] = await Promise.all([
    Item.findById(match.itemA).select("postedBy").lean(),
    Item.findById(match.itemB).select("postedBy").lean(),
  ]);
  const uid = userId.toString();
  return a?.postedBy?.toString() === uid || b?.postedBy?.toString() === uid;
}

export function validateRequest(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw AppError.badRequest("Validation failed", errors.array());
}

export async function createConversation(req) {
  validateRequest(req);
  const { matchId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(matchId)) {
    throw AppError.badRequest("Invalid matchId");
  }
  const match = await Match.findById(matchId).lean();
  if (!match) throw AppError.notFound("Match not found");
  if (!(await userOwnsItemInMatch(req.user.id, match))) {
    throw AppError.forbidden("You are not part of this match");
  }

  const [itemA, itemB] = await Promise.all([
    Item.findById(match.itemA).select("postedBy").lean(),
    Item.findById(match.itemB).select("postedBy").lean(),
  ]);
  const participants = [itemA.postedBy, itemB.postedBy].filter(Boolean);
  if (participants.length !== 2) throw AppError.badRequest("Invalid match participants");

  let convo = await Conversation.findOne({ match: matchId });
  if (!convo) {
    convo = await Conversation.create({
      match: matchId,
      participants,
      lastMessageAt: new Date(),
    });
  }
  return Conversation.findById(convo._id).populate("match").populate("participants", "email").lean();
}

export async function listConversations(req) {
  return Conversation.find({ participants: req.user.id })
    .populate("match")
    .populate("participants", "email")
    .sort({ lastMessageAt: -1 })
    .lean();
}

export async function listMessages(req) {
  const convo = await Conversation.findById(req.params.id);
  if (!convo) throw AppError.notFound("Conversation not found");
  if (!convo.participants.some((p) => p.toString() === req.user.id)) {
    throw AppError.forbidden("Access denied");
  }
  const messages = await Message.find({ conversation: convo._id })
    .sort({ createdAt: 1 })
    .populate("sender", "email")
    .lean();

  await Message.updateMany(
    { conversation: convo._id, sender: { $ne: req.user.id }, readBy: { $ne: req.user.id } },
    { $addToSet: { readBy: req.user.id } }
  );

  return messages;
}

export async function sendMessage(req) {
  validateRequest(req);
  const convo = await Conversation.findById(req.params.id);
  if (!convo) throw AppError.notFound("Conversation not found");
  if (!convo.participants.some((p) => p.toString() === req.user.id)) {
    throw AppError.forbidden("Access denied");
  }

  const msg = await Message.create({
    conversation: convo._id,
    sender: req.user.id,
    body: req.body.body || "",
    imageUrl: req.body.imageUrl || "",
    deliveredAt: new Date(),
    readBy: [req.user.id],
  });
  convo.lastMessageAt = new Date();
  await convo.save();

  const populated = await Message.findById(msg._id).populate("sender", "email").lean();
  const io = req.app.get("io");
  const room = `conversation:${convo._id.toString()}`;
  if (io) {
    io.to(room).emit("message:new", {
      conversationId: convo._id.toString(),
      message: populated,
    });
    for (const p of convo.participants) {
      if (p.toString() !== req.user.id) {
        io.to(`user:${p}`).emit("notification:new", {
          type: "message",
          payload: { conversationId: convo._id, messageId: msg._id },
        });
      }
    }
  }
  return populated;
}

export async function markMessagesRead(req) {
  const convo = await Conversation.findById(req.params.id);
  if (!convo) throw AppError.notFound("Conversation not found");
  await Message.updateMany(
    { conversation: convo._id, sender: { $ne: req.user.id } },
    { $addToSet: { readBy: req.user.id } }
  );
  const io = req.app.get("io");
  if (io) {
    io.to(`conversation:${convo._id}`).emit("message:read", {
      conversationId: convo._id.toString(),
      userId: req.user.id,
    });
  }
  return { ok: true };
}
