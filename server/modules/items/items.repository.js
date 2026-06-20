import { Item } from "../../models/Item.js";

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildListFilter(query) {
  const filter = {};
  if (query.category) filter.category = new RegExp(escapeRegex(query.category), "i");
  if (query.location) filter.location = new RegExp(escapeRegex(query.location), "i");
  if (query.type && ["lost", "found"].includes(query.type)) filter.type = query.type;
  const q = query.q?.trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ title: rx }, { description: rx }, { location: rx }];
  }
  return filter;
}

export async function createItem(data) {
  return Item.create(data);
}

export async function findItemById(id, populate = true) {
  let q = Item.findById(id);
  if (populate) q = q.populate("postedBy", "email");
  return q.lean();
}

export async function findItems(filter, { skip, limit, sort = { createdAt: -1 } }) {
  const [items, total] = await Promise.all([
    Item.find(filter).sort(sort).skip(skip).limit(limit).populate("postedBy", "email").lean(),
    Item.countDocuments(filter),
  ]);
  return { items, total };
}

export async function findItemDocumentById(id) {
  return Item.findById(id);
}

export async function deleteItemById(id) {
  return Item.deleteOne({ _id: id });
}

export async function findNearbyItems({ lng, lat, radiusMeters, type, excludeId, limit = 50 }) {
  const filter = {
    status: "open",
    locationGeo: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: radiusMeters,
      },
    },
  };
  if (type) filter.type = type;
  if (excludeId) filter._id = { $ne: excludeId };
  return Item.find(filter).limit(limit).populate("postedBy", "email").lean();
}

export async function updateItemDocument(item) {
  return item.save();
}
