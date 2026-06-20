import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { geoApi } from "../../services/geoApi.js";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function MapPicker({ lat, lng, onChange, onAddress }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const center = [lat || 51.505, lng || -0.09];

  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      geoApi.search(query).then((r) => setSuggestions(r.data || [])).catch(() => setSuggestions([]));
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const pick = (place) => {
    onChange({ lat: place.lat, lng: place.lng });
    onAddress?.(place.address || place.label);
    setQuery(place.label);
    setSuggestions([]);
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search location..."
        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80"
      />
      {suggestions.length > 0 && (
        <ul className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden text-sm">
          {suggestions.map((p, i) => (
            <li key={i}>
              <button type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => pick(p)}>
                {p.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="h-56 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 z-0">
        <MapContainer center={center} zoom={13} className="h-full w-full" scrollWheelZoom>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {lat != null && lng != null && <Marker position={[lat, lng]} />}
          <ClickHandler onPick={(p) => { onChange(p); }} />
        </MapContainer>
      </div>
    </div>
  );
}
