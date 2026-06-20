/**
 * Legacy bag-of-words TF + cosine similarity matching.
 * Used as fallback when OpenAI embeddings are unavailable (viva: explain hybrid AI).
 */
import mongoose from "mongoose";
import { Item } from "../../models/Item.js";
import { Match } from "../../models/Match.js";
import { Notification } from "../../models/Notification.js";
import { getEnv } from "../../config/env.js";

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
  "is", "was", "are", "were", "be", "been", "it", "this", "that", "my", "your", "i", "me",
]);

function tokenize(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

function buildTf(text) {
  const tokens = tokenize(text);
  const tf = {};
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  return tf;
}

export function cosineSimilarityTf(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const k of keys) {
    const va = a[k] || 0;
    const vb = b[k] || 0;
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function featureText(item) {
  return [item.title, item.description, item.category, item.location].filter(Boolean).join(" ");
}

function canonicalPair(id1, id2) {
  const s1 = id1.toString();
  const s2 = id2.toString();
  return s1 < s2 ? [id1, id2] : [id2, id1];
}

export function scoreLegacyPair(itemA, itemB) {
  const tfA = buildTf(featureText(itemA));
  const tfB = buildTf(featureText(itemB));
  const text = cosineSimilarityTf(tfA, tfB);
  return { text, image: 0, location: 0, final: text, mode: "legacy" };
}

export async function runLegacyMatchingForNewItem(newItemDoc, io) {
  const env = getEnv();
  const threshold = env.MATCH_THRESHOLD < 0.7 ? env.MATCH_THRESHOLD : 0.6;
  const opposite = newItemDoc.type === "lost" ? "found" : "lost";
  const candidates = await Item.find({
    type: opposite,
    status: "open",
    _id: { $ne: newItemDoc._id },
  })
    .limit(200)
    .lean();

  const newTf = buildTf(featureText(newItemDoc));
  const matchesCreated = [];

  for (const candidate of candidates) {
    const score = cosineSimilarityTf(newTf, buildTf(featureText(candidate)));
    if (score < threshold) continue;
    const created = await persistMatch({
      newItemDoc,
      candidate,
      score: Math.round(score * 1000) / 1000,
      scoreBreakdown: { text: score, image: 0, location: 0, mode: "legacy" },
      io,
    });
    if (created) matchesCreated.push(created);
  }
  return matchesCreated;
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
        io.to(`user:${userId}`).emit("match:new", { matchId: match._id, score });
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

export { persistMatch, canonicalPair };
