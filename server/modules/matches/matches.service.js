import { Match } from "../../models/Match.js";
import { Item } from "../../models/Item.js";
import { AppError } from "../../utils/AppError.js";
import { applyImageUrlsToItems } from "../../utils/imageUrl.js";

async function getMatchParticipants(match) {
  const [a, b] = await Promise.all([
    Item.findById(match.itemA).select("postedBy").lean(),
    Item.findById(match.itemB).select("postedBy").lean(),
  ]);
  return [a?.postedBy?.toString(), b?.postedBy?.toString()].filter(Boolean);
}

function enrichMatches(req, matches) {
  const base = `${req.protocol}://${req.get("host")}`;
  for (const m of matches) {
    for (const key of ["itemA", "itemB"]) {
      const it = m[key];
      if (it?.imageUrl && !it.imageUrl.startsWith("http")) {
        it.imageUrl = `${base}${it.imageUrl.startsWith("/") ? "" : "/"}${it.imageUrl}`;
      }
    }
  }
  return matches;
}

export async function listMyMatches(req) {
  const myItems = await Item.find({ postedBy: req.user.id }).select("_id").lean();
  const ids = myItems.map((i) => i._id);
  const matches = await Match.find({
    $or: [{ itemA: { $in: ids } }, { itemB: { $in: ids } }],
  })
    .populate([
      { path: "itemA", populate: { path: "postedBy", select: "email" } },
      { path: "itemB", populate: { path: "postedBy", select: "email" } },
      { path: "initiatorItem", select: "title type" },
      { path: "claim.requestedBy", select: "email" },
      { path: "claim.reviewedBy", select: "email" },
    ])
    .sort({ score: -1, createdAt: -1 })
    .lean();
  return enrichMatches(req, matches);
}

export async function getMatch(req) {
  const myItems = await Item.find({ postedBy: req.user.id }).select("_id").lean();
  const ids = new Set(myItems.map((i) => i._id.toString()));
  const match = await Match.findById(req.params.id)
    .populate([
      { path: "itemA", populate: { path: "postedBy", select: "email" } },
      { path: "itemB", populate: { path: "postedBy", select: "email" } },
      { path: "claim.requestedBy", select: "email" },
      { path: "claim.reviewedBy", select: "email" },
    ])
    .lean();
  if (!match) throw AppError.notFound("Match not found");
  const a = match.itemA?._id?.toString();
  const b = match.itemB?._id?.toString();
  if (!ids.has(a) && !ids.has(b)) throw AppError.forbidden("Access denied");
  return enrichMatches(req, [match])[0];
}

export async function requestClaim(req) {
  const match = await Match.findById(req.params.id);
  if (!match) throw AppError.notFound("Match not found");
  const participants = await getMatchParticipants(match);
  if (!participants.includes(req.user.id)) throw AppError.forbidden("Access denied");
  if (match.claim?.status === "approved") throw AppError.badRequest("Claim already approved");

  match.claim = {
    status: "requested",
    requestedBy: req.user.id,
    note: req.body.note || "",
    reviewedBy: undefined,
    reviewedAt: undefined,
  };
  await match.save();

  const io = req.app.get("io");
  for (const uid of participants) {
    if (io) io.to(`user:${uid}`).emit("claim:updated", { matchId: match._id, status: "requested" });
  }

  return Match.findById(match._id)
    .populate("claim.requestedBy", "email")
    .populate("claim.reviewedBy", "email")
    .lean();
}

export async function reviewClaim(req) {
  const action = req.body.action;
  if (!["approved", "rejected"].includes(action)) {
    throw AppError.badRequest("Invalid action");
  }
  const match = await Match.findById(req.params.id);
  if (!match) throw AppError.notFound("Match not found");
  const participants = await getMatchParticipants(match);
  if (!participants.includes(req.user.id)) throw AppError.forbidden("Access denied");
  if (match.claim?.status !== "requested" || !match.claim?.requestedBy) {
    throw AppError.badRequest("No pending claim to review");
  }
  if (match.claim.requestedBy.toString() === req.user.id) {
    throw AppError.badRequest("Requester cannot review own claim");
  }

  match.claim.status = action;
  match.claim.reviewedBy = req.user.id;
  match.claim.reviewedAt = new Date();
  if (action === "approved") {
    match.status = "confirmed";
    await Item.updateMany(
      { _id: { $in: [match.itemA, match.itemB] } },
      { $set: { status: "matched" } }
    );
  }
  await match.save();

  const io = req.app.get("io");
  for (const uid of participants) {
    if (io) io.to(`user:${uid}`).emit("claim:updated", { matchId: match._id, status: action });
  }

  return Match.findById(match._id)
    .populate("claim.requestedBy", "email")
    .populate("claim.reviewedBy", "email")
    .lean();
}

export async function dismissMatch(req) {
  const match = await Match.findById(req.params.id);
  if (!match) throw AppError.notFound("Match not found");
  const participants = await getMatchParticipants(match);
  if (!participants.includes(req.user.id)) throw AppError.forbidden("Access denied");
  match.status = "dismissed";
  await match.save();
  return match;
}
