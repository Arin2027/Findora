import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { itemsApi } from "../services/itemsApi.js";
import { assetUrl } from "../services/http.js";
import { Card } from "../components/ui/Card.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { formatDate } from "../utils/constants.js";
import { Skeleton } from "../components/ui/Skeleton.jsx";

export function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    itemsApi
      .get(id)
      .then((res) => setItem(res.data))
      .catch((e) => setError(e.displayMessage || "Not found"));
  }, [id]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!item) return <Skeleton className="h-96 w-full max-w-3xl mx-auto" />;

  return (
    <article className="max-w-3xl mx-auto">
      <Link to="/" className="text-sm text-brand-600 hover:underline mb-4 inline-block">
        ← Back
      </Link>
      <Card className="overflow-hidden" glass>
        <div className="aspect-video bg-slate-100 dark:bg-slate-800">
          {item.imageUrl ? (
            <img src={assetUrl(item.imageUrl)} alt="" loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">No image</div>
          )}
        </div>
        <div className="p-6 md:p-8">
          <div className="flex gap-2 mb-4">
            <Badge type={item.type} />
            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{item.category}</span>
            <span className="text-xs text-slate-500">{item.status}</span>
          </div>
          <h1 className="font-display text-3xl font-bold dark:text-white mb-2">{item.title}</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6 whitespace-pre-wrap">{item.description || "—"}</p>
          <dl className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Location</dt>
              <dd className="font-medium dark:text-white">{item.location}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Date</dt>
              <dd className="font-medium dark:text-white">{formatDate(item.date)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Posted by</dt>
              <dd className="font-medium dark:text-white">{item.postedBy?.email || "—"}</dd>
            </div>
          </dl>
        </div>
      </Card>
    </article>
  );
}
