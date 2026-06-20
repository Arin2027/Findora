import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { adminApi } from "../services/adminApi.js";
import { assetUrl } from "../services/http.js";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";

const COLORS = ["#0284c7", "#10b981", "#f59e0b", "#8b5cf6"];

export function Admin() {
  const [tab, setTab] = useState("analytics");
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState({ items: [] });
  const [overview, setOverview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [matchAnalytics, setMatchAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApi.users(),
      adminApi.items({ page: 1, limit: 20 }),
      adminApi.analyticsOverview(),
      adminApi.analyticsCategories(),
      adminApi.analyticsMatches(),
    ])
      .then(([u, i, o, c, m]) => {
        setUsers(u.data);
        setItems(i.data);
        setOverview(o.data);
        setMatchAnalytics(m.data);
        setCategories(
          c.data.map((x) => ({
            name: `${x._id.category} (${x._id.type})`,
            count: x.count,
          }))
        );
      })
      .catch((e) => setError(e.displayMessage))
      .finally(() => setLoading(false));
  }, []);

  const toggleRole = async (id, current) => {
    const next = current === "admin" ? "user" : "admin";
    if (!window.confirm(`Set role to ${next}?`)) return;
    await adminApi.updateUser(id, { role: next });
    const { data } = await adminApi.users();
    setUsers(data);
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete user?")) return;
    await adminApi.deleteUser(id);
    const { data } = await adminApi.users();
    setUsers(data);
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete item?")) return;
    await adminApi.deleteItem(id);
    const { data } = await adminApi.items({ page: 1 });
    setItems(data);
  };

  const flagItem = async (id) => {
    await adminApi.flagItem(id, "spam");
    alert("Item flagged");
  };

  const exportData = async () => {
    const { data } = await adminApi.exportReport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `findora-export-${Date.now()}.json`;
    a.click();
  };

  if (loading) return <Skeleton className="h-96 w-full" />;

  const pieData = overview
    ? [
        { name: "Users", value: overview.totalUsers },
        { name: "Items", value: overview.totalItems },
        { name: "Matches", value: overview.totalMatches },
        { name: "Recoveries", value: overview.successfulRecoveries },
      ]
    : [];

  return (
    <div>
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl font-bold dark:text-white">Admin</h1>
        <Button variant="secondary" onClick={exportData}>
          Export report
        </Button>
      </div>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="flex gap-2 mb-6 flex-wrap">
        {["analytics", "users", "items"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "analytics" && overview && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ["Users", overview.totalUsers],
              ["Active (7d)", overview.activeUsers],
              ["Match rate", `${overview.matchRate}%`],
              ["Avg score", overview.avgMatchScore],
            ].map(([label, val]) => (
              <Card key={label} className="p-4" glass>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-2xl font-bold dark:text-white">{val}</p>
              </Card>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-4 h-72" glass>
              <h3 className="font-semibold mb-4 dark:text-white">Platform overview</h3>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-4 h-72" glass>
              <h3 className="font-semibold mb-4 dark:text-white">By category</h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={categories.slice(0, 8)}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
          <Card className="p-4 h-48" glass>
            <h3 className="font-semibold mb-2 dark:text-white">Recovery trend (sample)</h3>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart
                data={[
                  { w: "W1", r: overview.successfulRecoveries * 0.2 },
                  { w: "W2", r: overview.successfulRecoveries * 0.5 },
                  { w: "W3", r: overview.successfulRecoveries * 0.8 },
                  { w: "W4", r: overview.successfulRecoveries },
                ]}
              >
                <XAxis dataKey="w" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="r" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {matchAnalytics && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold dark:text-white">AI Match Score Analytics</h2>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  ["Avg overall", `${matchAnalytics.componentAverages?.avgFinal ?? 0}%`],
                  ["Avg text", `${matchAnalytics.componentAverages?.avgText ?? 0}%`],
                  ["Avg image", `${matchAnalytics.componentAverages?.avgImage ?? 0}%`],
                  ["Avg location", `${matchAnalytics.componentAverages?.avgLocation ?? 0}%`],
                ].map(([label, val]) => (
                  <Card key={label} className="p-4" glass>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="text-2xl font-bold tabular-nums dark:text-white">{val}</p>
                  </Card>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="p-4 h-80" glass>
                  <h3 className="font-semibold mb-4 dark:text-white">Match score history</h3>
                  <ResponsiveContainer width="100%" height="88%">
                    <LineChart data={matchAnalytics.scoreHistory || []}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Line type="monotone" dataKey="avgScore" name="Overall" stroke="#0284c7" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="avgText" name="Text" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="avgImage" name="Image" stroke="#10b981" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-4 h-80" glass>
                  <h3 className="font-semibold mb-4 dark:text-white">AI confidence distribution</h3>
                  <ResponsiveContainer width="100%" height="88%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "High (≥85%)", value: matchAnalytics.confidenceDistribution?.high ?? 0 },
                          { name: "Medium (75–84%)", value: matchAnalytics.confidenceDistribution?.medium ?? 0 },
                          { name: "Low (<75%)", value: matchAnalytics.confidenceDistribution?.low ?? 0 },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label
                      >
                        {[0, 1, 2].map((i) => (
                          <Cell key={i} fill={["#10b981", "#f59e0b", "#94a3b8"][i]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              <Card className="p-4 overflow-x-auto" glass>
                <h3 className="font-semibold mb-4 dark:text-white">Recent match score history</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-slate-700 text-left text-slate-500">
                      <th className="p-2">Date</th>
                      <th className="p-2">Items</th>
                      <th className="p-2">Overall</th>
                      <th className="p-2">Text</th>
                      <th className="p-2">Image</th>
                      <th className="p-2">Location</th>
                      <th className="p-2">Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(matchAnalytics.recent || []).map((row) => (
                      <tr key={row._id} className="border-b dark:border-slate-800">
                        <td className="p-2 dark:text-white whitespace-nowrap">
                          {new Date(row.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-2 dark:text-white">
                          {row.itemA?.title} ↔ {row.itemB?.title}
                        </td>
                        <td className="p-2 tabular-nums">{((row.score || 0) * 100).toFixed(1)}%</td>
                        <td className="p-2 tabular-nums">{((row.scoreBreakdown?.text || 0) * 100).toFixed(0)}%</td>
                        <td className="p-2 tabular-nums">{((row.scoreBreakdown?.image || 0) * 100).toFixed(0)}%</td>
                        <td className="p-2 tabular-nums">{((row.scoreBreakdown?.location || 0) * 100).toFixed(0)}%</td>
                        <td className="p-2 capitalize">{row.scoreBreakdown?.mode || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}
        </div>
      )}

      {tab === "users" && (
        <Card className="overflow-x-auto" glass>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-slate-700 text-left">
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Verified</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b dark:border-slate-800">
                  <td className="p-3 dark:text-white">{u.email}</td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3">{u.emailVerified ? "Yes" : "No"}</td>
                  <td className="p-3 flex gap-2">
                    <Button variant="ghost" onClick={() => toggleRole(u._id, u.role)}>
                      Toggle role
                    </Button>
                    <Button variant="danger" onClick={() => deleteUser(u._id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "items" && (
        <ul className="space-y-3">
          {items.items?.map((item) => (
            <Card key={item._id} className="p-4 flex flex-wrap gap-4 items-center justify-between" glass>
              <div className="flex gap-3 items-center">
                {item.imageUrl && <img src={assetUrl(item.imageUrl)} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                <div>
                  <p className="font-medium dark:text-white">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.postedBy?.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => flagItem(item._id)}>
                  Flag spam
                </Button>
                <Button variant="danger" onClick={() => deleteItem(item._id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
