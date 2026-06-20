/**
 * Batch backfill text embeddings for existing items (run: node jobs/backfillEmbeddings.js)
 */
import "dotenv/config";
import { connectDB } from "../config/db.js";
import { getEnv } from "../config/env.js";
import { Item } from "../models/Item.js";
import { embedItemText } from "../services/ai/embedding.service.js";

async function main() {
  getEnv();
  await connectDB();
  const items = await Item.find({ textEmbedding: { $exists: false } }).limit(500);
  console.log(`Backfilling ${items.length} items...`);
  for (const item of items) {
    try {
      const emb = await embedItemText(item);
      if (emb?.vector) {
        item.textEmbedding = emb.vector;
        item.embeddingModel = emb.model;
        item.embeddingUpdatedAt = new Date();
        await item.save();
        console.log("OK", item._id);
      }
    } catch (e) {
      console.warn("Skip", item._id, e.message);
    }
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
