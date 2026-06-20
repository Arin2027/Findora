import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { itemsApi } from "../services/itemsApi.js";
import { assetUrl } from "../services/http.js";
import { Card } from "../components/ui/Card.jsx";
import { Badge } from "../components/ui/Badge.jsx";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export function MapView() {
  const [items, setItems] = useState([]);
  const [center, setCenter] = useState([51.505, -0.09]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = [pos.coords.latitude, pos.coords.longitude];
          setCenter(c);
          itemsApi.nearby({ lat: c[0], lng: c[1], radiusKm: 30 }).then((r) => setItems(r.data || []));
        },
        () => itemsApi.list({ limit: 50 }).then((r) => setItems(r.data.items || []))
      );
    } else {
      itemsApi.list({ limit: 50 }).then((r) => setItems(r.data.items || []));
    }
  }, []);

  const withGeo = items.filter((i) => i.locationGeo?.coordinates?.length === 2);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold dark:text-white mb-4">Items near you</h1>
      <Card className="h-[70vh] overflow-hidden" glass>
        <MapContainer center={center} zoom={12} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="OSM" />
          {withGeo.map((item) => {
            const [lng, lat] = item.locationGeo.coordinates;
            return (
              <Marker key={item._id} position={[lat, lng]}>
                <Popup>
                  <Badge type={item.type} />
                  <p className="font-medium">{item.title}</p>
                  <Link to={`/items/${item._id}`} className="text-brand-600 text-sm">
                    View
                  </Link>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </Card>
      <p className="text-sm text-slate-500 mt-2">{withGeo.length} items with map pins</p>
    </div>
  );
}
