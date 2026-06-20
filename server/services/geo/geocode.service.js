/**
 * Nominatim (OpenStreetMap) geocoding — free, rate-limited; used for location autocomplete.
 */
export async function searchPlaces(query, limit = 5) {
  if (!query?.trim()) return [];
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query.trim());
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url, {
    headers: { "User-Agent": "Findora/1.0 (lost-and-found-app)" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((r) => ({
    label: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    address: r.display_name,
  }));
}
