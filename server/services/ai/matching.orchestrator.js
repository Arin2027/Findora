/**
 * AI Match Orchestrator — combines semantic text, image CLIP, and geo similarity.
 * Viva: embeddings capture meaning beyond keywords; fallback keeps system reliable.
 */
import mongoose from "mongoose";
import { Item } from "../../models/Item.js";
import { Match } from "../../models/Match.js";
import { Notification } from "../../models/Notification.js";
import { getEnv } from "../../config/env.js";
import { cosineSimilarityVectors, locationSimilarity, combineScores } from "./similarity.service.js";
import { embedItemText, buildItemFeatureText } from "./embedding.service.js";
import { cosineSimilarityTf, scoreLegacyPair, runLegacyMatchingForNewItem } from "./matching.legacy.js";
import { embedImageFromPath } from "./imageEmbedding.service.js";

function canonicalPair(id1, id2) {
  const s1 = id1.toString();
  const s2 = id2.toString();
  return s1 < s2 ? [id1, id2] : [id2, id1];
}

function debugLog(msg, data) {
  if (getEnv().MATCH_DEBUG) console.log(`[match] ${msg}`, data ?? "");
}

export async function scorePair(newItem, candidate) {
  const env = getEnv();
  const weights = {
    text: env.TEXT_MATCH_WEIGHT,
    image: env.IMAGE_MATCH_WEIGHT,
    location: env.LOCATION_MATCH_WEIGHT,
  };

  let text = 0;
  let mode = "legacy";

  if (
    env.AI_MATCHING_MODE !== "legacy" &&
    newItem.textEmbedding?.length &&
    candidate.textEmbedding?.length
  ) {
    text = cosineSimilarityVectors(newItem.textEmbedding, candidate.textEmbedding);
    mode = "semantic";
  } else if (env.AI_MATCHING_MODE === "hybrid" || env.AI_MATCHING_MODE === "legacy") {
    text = scoreLegacyPair(newItem, candidate).text;
    mode = "legacy";
  }

  let image = 0;
  if (
    env.ENABLE_IMAGE_MATCHING &&
    newItem.imageEmbedding?.length &&
    candidate.imageEmbedding?.length
  ) {
    image = cosineSimilarityVectors(newItem.imageEmbedding, candidate.imageEmbedding);
  }

  const location = locationSimilarity(newItem, candidate, env.LOCATION_MAX_KM);
  const final = combineScores({ text, image, location }, weights);

  const breakdown = { text, image, location, final, mode };
  debugLog("pair score", breakdown);
  return breakdown;
}

async function persistMatch({ newItemDoc, candidate, score, scoreBreakdown, io }) {
  const [itemA, itemB] = canonicalPair(newItemDoc._id, candidate._id);
  try {
    const match = await Match.create({
      itemA,
      itemB,
      score,
      scoreBreakdown,
      initiatorItem: newItemDoc._id,
      status: "pending",
    });

    const notify = async (userId, itemId, relatedItemId) => {
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return;
      const n = await Notification.create({
        user: userId,
        type: "match_found",
        payload: { matchId: match._id, itemId, relatedItemId },
        read: false,
      });
      if (io) {
        io.to(`user:${userId}`).emit("notification:new", n);
        io.to(`user:${userId}`).emit("match:new", { matchId: match._id, score, scoreBreakdown });
      }
    };

    await notify(candidate.postedBy, candidate._id, newItemDoc._id);
    await notify(newItemDoc.postedBy, newItemDoc._id, candidate._id);
    return match;
  } catch (e) {
    if (e?.code === 11000) return null;
    throw e;
  }
}

export async function runMatchingForNewItem(newItemDoc, io) {
  const env = getEnv();

  if (env.AI_MATCHING_MODE === "legacy") {
    return runLegacyMatchingForNewItem(newItemDoc, io);
  }

  let item = newItemDoc;
  if (!item.textEmbedding?.length) {
    try {
      const emb = await embedItemText(item);
      if (emb?.vector) {
        item.textEmbedding = emb.vector;
        item.embeddingModel = emb.model;
        item.embeddingUpdatedAt = new Date();
        await item.save();
      }
    } catch (e) {
      console.warn("[match] Embedding failed, using legacy:", e.message);
      return runLegacyMatchingForNewItem(newItemDoc, io);
    }
  }

  if (env.ENABLE_IMAGE_MATCHING && item.imageUrl && !item.imageEmbedding?.length) {
    try {
      const imgEmb = await embedImageFromPath(item.imageUrl);
      if (imgEmb?.vector) {
        item.imageEmbedding = imgEmb.vector;
        item.imageEmbeddingModel = imgEmb.model;
        await item.save();
      }
    } catch (e) {
      debugLog("image embed skip", e.message);
    }
  }

  const opposite = item.type === "lost" ? "found" : "lost";
  const candidates = await Item.find({
    type: opposite,
    status: "open",
    _id: { $ne: item._id },
  })
    .select("+textEmbedding +imageEmbedding")
    .limit(200)
    .lean();

  const threshold = env.MATCH_THRESHOLD;
  const matchesCreated = [];

  for (const candidate of candidates) {
    const breakdown = await scorePair(item, candidate);
    if (breakdown.final < threshold) continue;

    const created = await persistMatch({
      newItemDoc: item,
      candidate,
      score: breakdown.final,
      scoreBreakdown: breakdown,
      io,
    });
    if (created) matchesCreated.push(created);
  }

  if (matchesCreated.length === 0 && env.AI_MATCHING_MODE === "hybrid") {
    debugLog("no semantic matches, trying legacy fallback");
    return runLegacyMatchingForNewItem(newItemDoc, io);
  }

  return matchesCreated;
}

/** Re-export for backward compatibility */
export { buildItemFeatureText };
