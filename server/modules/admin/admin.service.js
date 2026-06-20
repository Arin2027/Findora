import { validationResult } from "express-validator";
import { User } from "../../models/User.js";
import { Item } from "../../models/Item.js";
import { Match } from "../../models/Match.js";
import { AppError } from "../../utils/AppError.js";
import { applyImageUrlsToItems } from "../../utils/imageUrl.js";
import { logAudit } from "../auth/auth.service.js";
import { cacheGet, cacheSet } from "../../services/cache.service.js";

export function validateRequest(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw AppError.badRequest("Validation failed", errors.array());
}

export async function listUsers() {
  return User.find().select("email role createdAt emailVerified banned").sort({ createdAt: -1 }).lean();
}

export async function updateUser(req) {
  validateRequest(req);
  const user = await User.findById(req.params.id);
  if (!user) throw AppError.notFound("User not found");
  if (req.body.role && ["user", "admin"].includes(req.body.role)) user.role = req.body.role;
  if (req.body.banned !== undefined) {
    user.banned = !!req.body.banned;
    user.banReason = req.body.banReason || "";
    await logAudit(req.user.id, user.banned ? "user_ban" : "user_unban", "User", user._id);
  }
  await user.save();
  return { id: user._id, email: user.email, role: user.role, banned: user.banned };
}

export async function deleteUser(req) {
  const user = await User.findById(req.params.id);
  if (!user) throw AppError.notFound("User not found");
  if (user._id.toString() === req.user.id) throw AppError.badRequest("Cannot delete yourself");
  await Item.deleteMany({ postedBy: user._id });
  await User.deleteOne({ _id: user._id });
  await logAudit(req.user.id, "user_delete", "User", user._id);
}

export async function listAllItems(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Item.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate("postedBy", "email").lean(),
    Item.countDocuments(),
  ]);
  applyImageUrlsToItems(req, items);
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

export async function adminDeleteItem(req) {
  const item = await Item.findByIdAndDelete(req.params.id);
  if (!item) throw AppError.notFound("Item not found");
  await logAudit(req.user.id, "item_delete", "Item", item._id);
}

export async function flagItem(req) {
  const item = await Item.findById(req.params.id);
  if (!item) throw AppError.notFound("Item not found");
  item.flagged = true;
  item.flagReason = req.body.reason || "spam";
  await item.save();
  await logAudit(req.user.id, "item_flag", "Item", item._id, { reason: item.flagReason });
  return item;
}

export async function getAnalyticsOverview() {
  const cached = await cacheGet("admin:analytics:overview");
  if (cached) return cached;

  const [totalUsers, activeUsers, totalItems, totalMatches, recoveries, avgScore] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ lastActiveAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    Item.countDocuments(),
    Match.countDocuments(),
    Match.countDocuments({ status: "confirmed" }),
    Match.aggregate([{ $group: { _id: null, avg: { $avg: "$score" } } }]),
  ]);

  const data = {
    totalUsers,
    activeUsers,
    totalItems,
    totalMatches,
    successfulRecoveries: recoveries,
    matchRate: totalItems ? ((totalMatches / totalItems) * 100).toFixed(1) : 0,
    avgMatchScore: avgScore[0]?.avg?.toFixed(3) || 0,
  };
  await cacheSet("admin:analytics:overview", data, 120);
  return data;
}

export async function getCategoryAnalytics() {
  return Item.aggregate([
    { $group: { _id: { category: "$category", type: "$type" }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
}

export async function getLocationAnalytics() {
  return Item.aggregate([
    { $group: { _id: "$location", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);
}

export async function getMatchAnalytics() {
  const cached = await cacheGet("admin:analytics:matches");
  if (cached) return cached;

  const [byMode, recent, scoreHistory, componentAverages, confidenceDistribution] = await Promise.all([
    Match.aggregate([
      { $group: { _id: "$scoreBreakdown.mode", count: { $sum: 1 }, avgScore: { $avg: "$score" } } },
    ]),
    Match.find()
      .sort({ createdAt: -1 })
      .limit(15)
      .populate("itemA", "title type")
      .populate("itemB", "title type")
      .select("score scoreBreakdown createdAt status")
      .lean(),
    Match.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          avgScore: { $avg: "$score" },
          avgText: { $avg: "$scoreBreakdown.text" },
          avgImage: { $avg: "$scoreBreakdown.image" },
          avgLocation: { $avg: "$scoreBreakdown.location" },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]),
    Match.aggregate([
      {
        $group: {
          _id: null,
          avgText: { $avg: "$scoreBreakdown.text" },
          avgImage: { $avg: "$scoreBreakdown.image" },
          avgLocation: { $avg: "$scoreBreakdown.location" },
          avgFinal: { $avg: "$score" },
          total: { $sum: 1 },
        },
      },
    ]),
    Match.aggregate([
      {
        $bucket: {
          groupBy: "$score",
          boundaries: [0, 0.75, 0.85, 1.01],
          default: "other",
          output: { count: { $sum: 1 } },
        },
      },
    ]),
  ]);

  const confidence = { high: 0, medium: 0, low: 0 };
  for (const bucket of confidenceDistribution) {
    const id = bucket._id;
    if (id >= 0.85) confidence.high += bucket.count;
    else if (id >= 0.75) confidence.medium += bucket.count;
    else if (id >= 0) confidence.low += bucket.count;
  }

  const data = {
    byMode,
    recent,
    scoreHistory: scoreHistory.map((row) => ({
      date: row._id,
      count: row.count,
      avgScore: Number(((row.avgScore || 0) * 100).toFixed(1)),
      avgText: Number(((row.avgText || 0) * 100).toFixed(1)),
      avgImage: Number(((row.avgImage || 0) * 100).toFixed(1)),
      avgLocation: Number(((row.avgLocation || 0) * 100).toFixed(1)),
    })),
    componentAverages: componentAverages[0]
      ? {
          avgText: Number(((componentAverages[0].avgText || 0) * 100).toFixed(1)),
          avgImage: Number(((componentAverages[0].avgImage || 0) * 100).toFixed(1)),
          avgLocation: Number(((componentAverages[0].avgLocation || 0) * 100).toFixed(1)),
          avgFinal: Number(((componentAverages[0].avgFinal || 0) * 100).toFixed(1)),
          total: componentAverages[0].total || 0,
        }
      : { avgText: 0, avgImage: 0, avgLocation: 0, avgFinal: 0, total: 0 },
    confidenceDistribution: confidence,
  };

  await cacheSet("admin:analytics:matches", data, 120);
  return data;
}

export async function exportReport() {
  const [users, items, matches] = await Promise.all([
    User.find().select("email role createdAt").lean(),
    Item.find().select("title type category location status createdAt").lean(),
    Match.find().select("score status createdAt scoreBreakdown").lean(),
  ]);
  return { exportedAt: new Date(), users, items, matches };
}
