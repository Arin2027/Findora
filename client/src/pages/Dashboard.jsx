import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { itemsApi } from "../services/itemsApi.js";
import { notificationsApi } from "../services/notificationsApi.js";
import { assetUrl } from "../services/http.js";
import { Card } from "../components/ui/Card.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";
import { useNotificationStore } from "../stores/notificationStore.js";

export function Dashboard() {
  const [items, setItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchUnread = useNotificationStore((s) => s.fetchUnread);

  useEffect(() => {
    Promise.all([itemsApi.mine(), notificationsApi.list()])
      .then(([itemsRes, notifRes]) => {
        setItems(itemsRes.data.items || []);
        setNotifications(notifRes.data || []);
        fetchUnread();
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchUnread]);

  const markRead = async (id) => {
    await notificationsApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    fetchUnread();
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    fetchUnread();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold dark:text-white mb-2">Dashboard</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">Your listings, live notifications, and recovery progress.</p>

      <section className="mb-10">
        <div className="flex justify-between mb-4">
          <h2 className="font-display font-semibold text-lg dark:text-white">Notifications</h2>
          {notifications.some((n) => !n.read) && (
            <button type="button" onClick={markAllRead} className="text-sm text-brand-600 hover:underline">
              Mark all read
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <Card className="p-4 text-sm text-slate-500">No notifications yet.</Card>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <Card
                key={n._id}
                className={`p-4 flex flex-wrap justify-between gap-2 ${!n.read ? "ring-2 ring-brand-500/30" : ""}`}
                glass
              >
                <div>
                  <p className="font-medium dark:text-white">Possible match found</p>
                  <p className="text-sm text-slate-500">AI surfaced a similar listing.</p>
                </div>
                <div className="flex gap-2">
                  {!n.read && (
                    <button type="button" onClick={() => markRead(n._id)} className="text-sm text-slate-500 hover:text-brand-600">
                      Dismiss
                    </button>
                  )}
                  <Link to="/matches" className="text-sm font-medium text-brand-600">
                    View matches
                  </Link>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display font-semibold text-lg mb-4 dark:text-white">Your items ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-slate-500">
            <Link to="/post" className="text-brand-600 font-medium">
              Post an item
            </Link>
          </p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <Card key={item._id} className="overflow-hidden flex" glass>
                <div className="w-28 shrink-0 bg-slate-100 dark:bg-slate-800">
                  {item.imageUrl ? (
                    <img src={assetUrl(item.imageUrl)} alt="" loading="lazy" className="w-full h-full object-cover min-h-[96px]" />
                  ) : (
                    <div className="min-h-[96px] flex items-center justify-center text-xs text-slate-400">No image</div>
                  )}
                </div>
                <div className="p-3 flex-1">
                  <Link to={`/items/${item._id}`} className="font-medium hover:text-brand-600 line-clamp-2 dark:text-white">
                    {item.title}
                  </Link>
                  <div className="mt-1 flex gap-2">
                    <Badge type={item.type} />
                    <span className="text-xs text-slate-500">{item.status}</span>
                  </div>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
