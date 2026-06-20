import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { matchesApi } from "../services/matchesApi.js";
import { chatApi } from "../services/chatApi.js";
import { assetUrl } from "../services/http.js";
import { useAuth } from "../hooks/useAuth.js";
import { Card } from "../components/ui/Card.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";
import { MatchExplanationPanel } from "../components/matches/MatchExplanationPanel.jsx";
import { getConfidenceLabel } from "../utils/matchExplanation.js";

export function Matches() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    matchesApi
      .list()
      .then((res) => {
        setMatches(res.data);
        if (res.data.length > 0) setExpandedId(res.data[0]._id);
      })
      .catch((e) => setError(e.displayMessage || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const startChat = async (matchId) => {
    setStarting(matchId);
    try {
      await chatApi.create(matchId);
      navigate("/chat");
    } catch (e) {
      setError(e.displayMessage);
    } finally {
      setStarting(null);
    }
  };

  const requestClaim = async (matchId) => {
    const note = window.prompt("Verification note (optional):", "") || "";
    try {
      const { data } = await matchesApi.claim(matchId, note);
      setMatches((prev) => prev.map((m) => (m._id === matchId ? { ...m, claim: data.claim } : m)));
    } catch (e) {
      setError(e.displayMessage);
    }
  };

  const reviewClaim = async (matchId, action) => {
    try {
      const { data } = await matchesApi.reviewClaim(matchId, action);
      setMatches((prev) => prev.map((m) => (m._id === matchId ? { ...m, claim: data.claim, status: data.status } : m)));
    } catch (e) {
      setError(e.displayMessage);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Sparkles className="w-8 h-8 text-brand-600" aria-hidden="true" />
        <h1 className="font-display text-3xl font-bold dark:text-white">AI Matches</h1>
      </div>
      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-2xl">
        Each match combines semantic text embeddings, CLIP image similarity, and geographic proximity. Expand a match to
        see the full AI explanation dashboard.
      </p>
      {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
      {matches.length === 0 ? (
        <p className="text-slate-500">No matches yet.</p>
      ) : (
        <ul className="space-y-6">
          {matches.map((m) => {
            const a = m.itemA;
            const b = m.itemB;
            const ownerA = a?.postedBy?._id || a?.postedBy;
            const ownerB = b?.postedBy?._id || b?.postedBy;
            const isParticipant = [ownerA, ownerB].some((id) => id?.toString?.() === user?.id);
            const requesterId = m.claim?.requestedBy?._id || m.claim?.requestedBy;
            const isRequester = requesterId?.toString?.() === user?.id;
            const canReview = m.claim?.status === "requested" && isParticipant && !isRequester;
            const isExpanded = expandedId === m._id;

            return (
              <Card key={m._id} className="p-6" glass>
                <div className="flex flex-wrap justify-between gap-4 mb-4">
                  <div>
                    <span className="text-lg font-bold text-brand-600 tabular-nums">
                      {((m.score ?? 0) * 100).toFixed(1)}% match
                    </span>
                    <span className="ml-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      · {getConfidenceLabel(m.score)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => setExpandedId(isExpanded ? null : m._id)}>
                      {isExpanded ? "Hide analysis" : "Explain match"}
                    </Button>
                    <Button onClick={() => startChat(m._id)} disabled={starting === m._id}>
                      {starting === m._id ? "…" : "Chat"}
                    </Button>
                    {isParticipant && !["requested", "approved"].includes(m.claim?.status) && (
                      <Button variant="secondary" onClick={() => requestClaim(m._id)}>
                        Request claim
                      </Button>
                    )}
                    {canReview && (
                      <>
                        <Button onClick={() => reviewClaim(m._id, "approved")}>Approve</Button>
                        <Button variant="danger" onClick={() => reviewClaim(m._id, "rejected")}>
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {isExpanded && <MatchExplanationPanel match={m} />}

                <div className={`grid md:grid-cols-2 gap-4 ${isExpanded ? "mt-5" : "mt-0"}`}>
                  {[a, b].map((it) => (
                    <Link
                      key={it._id}
                      to={`/items/${it._id}`}
                      className="flex gap-3 rounded-xl border border-slate-200/60 dark:border-slate-700 p-3 hover:bg-white/50 dark:hover:bg-slate-800/50 transition"
                    >
                      {it.imageUrl && (
                        <img src={assetUrl(it.imageUrl)} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                      )}
                      <div>
                        <Badge type={it.type} />
                        <p className="font-medium mt-1 dark:text-white">{it.title}</p>
                        <p className="text-xs text-slate-500">{it.location}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
