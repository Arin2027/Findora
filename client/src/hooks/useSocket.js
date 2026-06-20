import { useEffect } from "react";
import { getSocket, disconnectSocket } from "../socket.js";
import { useAuth } from "./useAuth.js";
import { useNotificationStore } from "../stores/notificationStore.js";
import toast from "react-hot-toast";

export function useSocket() {
  const { user } = useAuth();
  const fetchUnread = useNotificationStore((s) => s.fetchUnread);
  const increment = useNotificationStore((s) => s.increment);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      return;
    }
    const socket = getSocket();
    socket.emit("presence:check", []);

    const onNotification = (n) => {
      increment();
      fetchUnread();
      toast.success(n?.type === "match_found" ? "New match found!" : "New notification");
    };
    const onMatch = () => {
      toast.success("AI found a potential match!");
      increment();
    };

    socket.on("notification:new", onNotification);
    socket.on("match:new", onMatch);
    fetchUnread();

    return () => {
      socket.off("notification:new", onNotification);
      socket.off("match:new", onMatch);
    };
  }, [user, fetchUnread, increment]);

  return { socket: user ? getSocket() : null };
}
