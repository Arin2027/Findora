/**
 * Vector cosine similarity for semantic embeddings (Phase 3 viva topic).
 */
export function cosineSimilarityVectors(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Haversine distance in km; returns similarity 0–1 within maxKm */
export function locationSimilarity(itemA, itemB, maxKm = 25) {
  const coordsA = itemA?.locationGeo?.coordinates;
  const coordsB = itemB?.locationGeo?.coordinates;
  if (!coordsA?.length || !coordsB?.length) return 0;

  const [lng1, lat1] = coordsA;
  const [lng2, lat2] = coordsB;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  if (km >= maxKm) return 0;
  return 1 - km / maxKm;
}

export function combineScores({ text, image, location }, weights) {
  const w = weights || { text: 0.4, image: 0.4, location: 0.2 };
  let tw = w.text;
  let iw = w.image;
  let lw = w.location;

  if (image <= 0) {
    const sum = tw + lw || 1;
    tw /= sum;
    lw /= sum;
    iw = 0;
  }
  if (location <= 0 && image > 0) {
    const sum = tw + iw || 1;
    tw /= sum;
    iw /= sum;
    lw = 0;
  }

  const final = tw * text + iw * image + lw * location;
  return Math.round(final * 1000) / 1000;
}
