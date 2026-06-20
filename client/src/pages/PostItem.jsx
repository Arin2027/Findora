import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { itemsApi } from "../services/itemsApi.js";
import { CATEGORIES } from "../utils/constants.js";
import { Card } from "../components/ui/Card.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Button } from "../components/ui/Button.jsx";
import { MapPicker } from "../components/maps/MapPicker.jsx";

export function PostItem() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: CATEGORIES[0],
    location: "",
    locationAddress: "",
    date: new Date().toISOString().slice(0, 10),
    type: "lost",
    lat: null,
    lng: null,
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v != null && v !== "") fd.append(k, v);
      });
      fd.set("date", new Date(form.date).toISOString());
      if (file) fd.append("image", file);
      const { data } = await itemsApi.create(fd);
      navigate(`/items/${data._id}`);
    } catch (err) {
      setError(err.displayMessage || "Could not create item");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-6 dark:text-white">Post an item</h1>
      <Card className="p-6" glass>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-xl bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}
          <Input label="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Description
            <textarea
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 bg-white/80 dark:bg-slate-900/80"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-sm font-medium">
              Category
              <select className="mt-1 w-full rounded-xl border px-4 py-2.5" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Type
              <select className="mt-1 w-full rounded-xl border px-4 py-2.5" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
            </label>
          </div>
          <MapPicker
            lat={form.lat}
            lng={form.lng}
            onChange={({ lat, lng }) => setForm((f) => ({ ...f, lat, lng }))}
            onAddress={(addr) => setForm((f) => ({ ...f, location: f.location || addr, locationAddress: addr }))}
          />
          <Input label="Location label" required value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          <Input label="Date" type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          <Input label="Image" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Posting…" : "Post item"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
