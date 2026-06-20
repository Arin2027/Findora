import { useEffect, useRef, useState } from "react";
import { chatApi } from "../services/chatApi.js";
import { useAuth } from "../hooks/useAuth.js";
import { getSocket } from "../socket.js";
import { formatTime } from "../utils/constants.js";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";

export function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    chatApi
      .listConversations()
      .then((res) => {
        setConversations(res.data);
        if (res.data.length) setActiveId(res.data[0]._id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeId) return;
    chatApi.messages(activeId).then((res) => setMessages(res.data));
    chatApi.markRead(activeId).catch(() => {});
  }, [activeId]);

  useEffect(() => {
    const socket = getSocket();
    const onNew = (payload) => {
      if (payload.conversationId !== activeId) return;
      setMessages((prev) => (prev.some((m) => m._id === payload.message._id) ? prev : [...prev, payload.message]));
    };
    const onTypingStart = (p) => {
      if (p.conversationId === activeId && p.userId !== user?.id) setTypingUser(p.userId);
    };
    const onTypingStop = (p) => {
      if (p.conversationId === activeId) setTypingUser(null);
    };
    socket.on("message:new", onNew);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    return () => {
      socket.off("message:new", onNew);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
    };
  }, [activeId, user?.id]);

  useEffect(() => {
    if (!activeId) return;
    const socket = getSocket();
    socket.emit("conversation:join", activeId);
    return () => socket.emit("conversation:leave", activeId);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const emitTyping = (isTyping) => {
    const socket = getSocket();
    if (!activeId) return;
    socket.emit(isTyping ? "typing:start" : "typing:stop", { conversationId: activeId });
  };

  const onBodyChange = (v) => {
    setBody(v);
    emitTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), 1200);
  };

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim() || !activeId) return;
    setSending(true);
    emitTyping(false);
    try {
      const { data } = await chatApi.send(activeId, { body: body.trim() });
      setMessages((prev) => [...prev, data]);
      setBody("");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="grid lg:grid-cols-3 gap-6 min-h-[520px]">
      <Card className="lg:col-span-1 overflow-hidden" glass>
        <h2 className="font-display font-semibold p-4 border-b border-slate-200/50 dark:border-slate-700">Conversations</h2>
        <ul className="max-h-[460px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {conversations.map((c) => (
            <li key={c._id}>
              <button
                type="button"
                onClick={() => setActiveId(c._id)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-brand-50/50 dark:hover:bg-slate-800/50 ${
                  activeId === c._id ? "bg-brand-50 dark:bg-brand-900/20" : ""
                }`}
              >
                Match · {c.participants?.map((p) => p.email?.split("@")[0]).join(" & ")}
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="lg:col-span-2 flex flex-col min-h-[520px]" glass>
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">Select a conversation</div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => {
                const sid = m.sender?._id ?? m.sender;
                const mine = sid?.toString?.() === user?.id;
                const read = m.readBy?.length > 1;
                return (
                  <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                        mine ? "bg-brand-600 text-white rounded-br-sm" : "bg-slate-100 dark:bg-slate-800 dark:text-white rounded-bl-sm"
                      }`}
                    >
                      {!mine && <span className="block text-xs opacity-70 mb-1">{m.sender?.email}</span>}
                      {m.body}
                      <span className={`block text-[10px] mt-1 ${mine ? "text-brand-100" : "text-slate-400"}`}>
                        {formatTime(m.createdAt)}
                        {mine && (read ? " · Read" : " · Sent")}
                      </span>
                    </div>
                  </div>
                );
              })}
              {typingUser && <p className="text-xs text-slate-400 animate-pulse">Typing…</p>}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={send} className="border-t border-slate-200/50 dark:border-slate-700 p-4 flex gap-2">
              <input
                className="flex-1 rounded-xl border px-4 py-2.5 bg-white/80 dark:bg-slate-900/80 dark:text-white"
                placeholder="Type a message…"
                value={body}
                onChange={(e) => onBodyChange(e.target.value)}
              />
              <Button type="submit" disabled={sending}>
                Send
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
