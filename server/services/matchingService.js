import mongoose from "mongoose";
import { Item } from "../models/Item.js";
import { Match } from "../models/Match.js";
import { Notification } from "../models/Notification.js";

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
  for (const t of tokens) {
    tf[t] = (tf[t] || 0) + 1;
  }
  return tf;
}

function cosineSimilarity(a, b) {
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

export async function runMatchingForNewItem(newItemDoc) {
  const threshold = Number(process.env.MATCH_THRESHOLD) || 0.6;
  const opposite = newItemDoc.type === "lost" ? "found" : "lost";
  const candidates = await Item.find({
    type: opposite,
    status: "open",
    _id: { $ne: newItemDoc._id },
  })
    .limit(200)
    .lean();

  const newText = featureText(newItemDoc);
  const newTf = buildTf(newText);

  const matchesCreated = [];

  for (const candidate of candidates) {
    const candTf = buildTf(featureText(candidate));
    const score = cosineSimilarity(newTf, candTf);
    if (score < threshold) continue;

    const [itemA, itemB] = canonicalPair(newItemDoc._id, candidate._id);

    try {
      const match = await Match.create({
        itemA,
        itemB,
        score: Math.round(score * 1000) / 1000,
        initiatorItem: newItemDoc._id,
        status: "pending",
      });
      matchesCreated.push(match);

      const otherOwnerId = candidate.postedBy;
      const posterId = newItemDoc.postedBy;

      if (otherOwnerId && mongoose.Types.ObjectId.isValid(otherOwnerId)) {
        await Notification.create({
          user: otherOwnerId,
          type: "match_found",
          payload: {
            matchId: match._id,
            itemId: candidate._id,
            relatedItemId: newItemDoc._id,
          },
          read: false,
        });
      }
      if (posterId && mongoose.Types.ObjectId.isValid(posterId)) {
        await Notification.create({
          user: posterId,
          type: "match_found",
          payload: {
            matchId: match._id,
            itemId: newItemDoc._id,
            relatedItemId: candidate._id,
          },
          read: false,
        });
      }
    } catch (e) {
      if (e && e.code === 11000) continue;
      throw e;
    }
  }

  return matchesCreated;
}
