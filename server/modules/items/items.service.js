import { validationResult } from "express-validator";
import { AppError } from "../../utils/AppError.js";
import { publicImageUrl, applyImageUrlsToItems } from "../../utils/imageUrl.js";
import * as itemsRepo from "./items.repository.js";
import { runMatchingForNewItem } from "../../services/ai/matching.orchestrator.js";
import { embedItemText } from "../../services/ai/embedding.service.js";

export function validateRequest(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw AppError.badRequest("Validation failed", errors.array());
  }
}

export async function createItem(req) {
  validateRequest(req);
  const { title, description, category, location, date, type, lat, lng, locationAddress } = req.body;
  let imageUrl = "";
  if (req.file) {
    imageUrl = req.cloudinaryUrl || `/uploads/${req.file.filename}`;
  }

  const itemData = {
    title,
    description: description || "",
    category,
    location,
    locationAddress: locationAddress || location,
    date: new Date(date),
    imageUrl,
    type,
    status: "open",
    postedBy: req.user.id,
  };

  if (lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
    itemData.locationGeo = {
      type: "Point",
      coordinates: [Number(lng), Number(lat)],
    };
  }

  const item = await itemsRepo.createItem(itemData);

  try {
    const embedding = await embedItemText(item);
    if (embedding?.vector?.length) {
      item.textEmbedding = embedding.vector;
      item.embeddingModel = embedding.model;
      item.embeddingUpdatedAt = new Date();
      await item.save();
    }
  } catch (e) {
    console.warn("[items] Embedding on create failed, matching may use legacy fallback:", e.message);
  }

  await runMatchingForNewItem(item, req.app?.get("io"));

  const populated = await itemsRepo.findItemById(item._id);
  populated.imageUrl = publicImageUrl(req, populated.imageUrl);
  return populated;
}

export async function listItems(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const skip = (page - 1) * limit;
  const filter = itemsRepo.buildListFilter(req.query);
  const { items, total } = await itemsRepo.findItems(filter, { skip, limit });
  applyImageUrlsToItems(req, items);
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

export async function listMyItems(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const filter = { postedBy: req.user.id };
  const { items, total } = await itemsRepo.findItems(filter, { skip, limit });
  applyImageUrlsToItems(req, items);
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

export async function getItem(req) {
  const item = await itemsRepo.findItemById(req.params.id);
  if (!item) throw AppError.notFound("Item not found");
  item.imageUrl = publicImageUrl(req, item.imageUrl);
  return item;
}

export async function updateItem(req) {
  validateRequest(req);
  const item = await itemsRepo.findItemDocumentById(req.params.id);
  if (!item) throw AppError.notFound("Item not found");
  if (item.postedBy.toString() !== req.user.id && req.user.role !== "admin") {
    throw AppError.forbidden("Not allowed to edit this item");
  }

  const { title, description, category, location, date, type, status, lat, lng, locationAddress } =
    req.body;
  if (title !== undefined) item.title = title;
  if (description !== undefined) item.description = description;
  if (category !== undefined) item.category = category;
  if (location !== undefined) item.location = location;
  if (locationAddress !== undefined) item.locationAddress = locationAddress;
  if (date !== undefined) item.date = new Date(date);
  if (type !== undefined) item.type = type;
  if (status !== undefined && ["open", "matched", "closed"].includes(status)) item.status = status;
  if (req.file) item.imageUrl = req.cloudinaryUrl || `/uploads/${req.file.filename}`;
  if (lat != null && lng != null) {
    item.locationGeo = { type: "Point", coordinates: [Number(lng), Number(lat)] };
  }

  await itemsRepo.updateItemDocument(item);

  try {
    const embedding = await embedItemText(item);
    if (embedding?.vector?.length) {
      item.textEmbedding = embedding.vector;
      item.embeddingModel = embedding.model;
      item.embeddingUpdatedAt = new Date();
      await item.save();
    }
  } catch (_) {
    /* fallback matching still works */
  }

  const populated = await itemsRepo.findItemById(item._id);
  populated.imageUrl = publicImageUrl(req, populated.imageUrl);
  return populated;
}

export async function deleteItem(req) {
  const item = await itemsRepo.findItemDocumentById(req.params.id);
  if (!item) throw AppError.notFound("Item not found");
  if (item.postedBy.toString() !== req.user.id && req.user.role !== "admin") {
    throw AppError.forbidden("Not allowed to delete this item");
  }
  await itemsRepo.deleteItemById(item._id);
}

export async function listNearby(req) {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radiusKm = Math.min(100, Math.max(0.5, Number(req.query.radiusKm) || 10));
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw AppError.badRequest("lat and lng query params are required");
  }
  const items = await itemsRepo.findNearbyItems({
    lat,
    lng,
    radiusMeters: radiusKm * 1000,
    type: req.query.type,
    excludeId: req.query.excludeId,
  });
  applyImageUrlsToItems(req, items);
  return items;
}
