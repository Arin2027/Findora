import { Notification } from "../../models/Notification.js";
import { AppError } from "../../utils/AppError.js";

export async function listNotifications(req) {
  return Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(100).lean();
}

export async function unreadCount(req) {
  const count = await Notification.countDocuments({ user: req.user.id, read: false });
  return { count };
}

export async function markRead(req) {
  const n = await Notification.findOne({ _id: req.params.id, user: req.user.id });
  if (!n) throw AppError.notFound("Notification not found");
  n.read = true;
  await n.save();
  return n;
}

export async function markAllRead(req) {
  await Notification.updateMany({ user: req.user.id, read: false }, { $set: { read: true } });
  return { ok: true };
}
