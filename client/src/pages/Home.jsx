import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { itemsApi } from "../services/itemsApi.js";
import { assetUrl } from "../services/http.js";
import { CATEGORIES } from "../utils/constants.js";
import { Card } from "../components/ui/Card.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { ItemCardSkeleton } from "../components/ui/Skeleton.jsx";
import { staggerContainer, staggerItem } from "../animations/variants.js";
import { Sparkles } from "lucide-react";

export function Home() {
  const [data, setData] = useState({ items: [], total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: "", category: "", location: "", type: "", page: 1 });
  const [nearMe, setNearMe] = useState(false);

  useEffect(() => {
    setLoading(true);
    const run = async () => {
      try {
        if (nearMe && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            const res = await itemsApi.nearby({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              radiusKm: 15,
              type: filters.type || undefined,
            });
            setData({ items: res.data, total: res.data.length, pages: 1 });
            setLoading(false);
          });
          return;
        }
        const params = { page: filters.page, limit: 12 };
        if (filters.q) params.q = filters.q;
        if (filters.category) params.category = filters.category;
        if (filters.location) params.location = filters.location;
        if (filters.type) params.type = filters.type;
        const res = await itemsApi.list(params);
        setData(res.data);
      } catch {
        setData({ items: [], total: 0, pages: 0 });
      } finally {
        if (!nearMe) setLoading(false);
      }
    };
    run();
  }, [filters, nearMe]);

  return (
    <div>
      <motion.div {...staggerContainer} className="mb-10">
        <motion.h1 className="font-display text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-3">
          Lost &amp; found, <span className="text-brand-600">reunited by AI</span>
        </motion.h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-lg">
          Semantic matching, image similarity, and live alerts — startup-grade recovery for campus and city.
        </p>
      </motion.div>

      <Card className="p-4 md:p-6 mb-8" glass>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setFilters((f) => ({ ...f, page: 1 }));
          }}
          className="space-y-4"
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="search"
              placeholder="Search…"
              className="md:col-span-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 bg-white/80 dark:bg-slate-900/80"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value, page: 1 }))}
            />
            <select
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 bg-white/80 dark:bg-slate-900/80"
              value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value, page: 1 }))}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Location"
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 bg-white/80 dark:bg-slate-900/80"
              value={filters.location}
              onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value, page: 1 }))}
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {["", "lost", "found"].map((t) => (
              <button
                key={t || "all"}
                type="button"
                onClick={() => setFilters((f) => ({ ...f, type: t, page: 1 }))}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                  filters.type === t ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                {t ? t.charAt(0).toUpperCase() + t.slice(1) : "All"}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setNearMe((v) => !v)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium flex items-center gap-1 ${
                nearMe ? "bg-cyan-600 text-white" : "bg-slate-100 dark:bg-slate-800"
              }`}
            >
              <Sparkles className="w-4 h-4" /> Near me
            </button>
          </div>
        </form>
      </Card>

      {loading ? (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <li key={i}>
              <ItemCardSkeleton />
            </li>
          ))}
        </ul>
      ) : data.items.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">No items match your filters.</p>
      ) : (
        <motion.ul variants={staggerContainer} initial="initial" animate="animate" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.items.map((item) => (
            <motion.li key={item._id} variants={staggerItem}>
              <Link to={`/items/${item._id}`}>
                <Card className="overflow-hidden group" glass>
                  <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={assetUrl(item.imageUrl)} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No image</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex gap-2 mb-2">
                      <Badge type={item.type} />
                      <span className="text-xs text-slate-500">{item.category}</span>
                    </div>
                    <h2 className="font-display font-semibold text-lg line-clamp-2">{item.title}</h2>
                    <p className="text-sm text-slate-500 mt-1">{item.location}</p>
                  </div>
                </Card>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}

      {!nearMe && data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          <button type="button" disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40">
            Previous
          </button>
          <span className="py-2 text-sm text-slate-600 dark:text-slate-400">
            Page {filters.page} of {data.pages}
          </span>
          <button type="button" disabled={filters.page >= data.pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
