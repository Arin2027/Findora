export function publicImageUrl(req, storedPath) {
  if (!storedPath) return "";
  if (storedPath.startsWith("http")) return storedPath;
  const base = `${req.protocol}://${req.get("host")}`;
  return `${base}${storedPath.startsWith("/") ? "" : "/"}${storedPath}`;
}

export function applyImageUrlsToItems(req, items) {
  const base = `${req.protocol}://${req.get("host")}`;
  for (const it of items) {
    if (it.imageUrl && !it.imageUrl.startsWith("http")) {
      it.imageUrl = `${base}${it.imageUrl.startsWith("/") ? "" : "/"}${it.imageUrl}`;
    }
  }
  return items;
}
