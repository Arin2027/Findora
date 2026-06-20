import { io } from "socket.io-client";

let socket;

function getBaseUrl() {
  return import.meta.env.VITE_API_URL || window.location.origin;
}

export function getSocket() {
  if (socket) return socket;

  const token = localStorage.getItem("token");
  const baseURL = getBaseUrl();

  socket = io(baseURL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: Boolean(token),
  });

  socket.on("connect_error", (err) => {
    console.warn("[socket] connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    if (reason === "io server disconnect") {
      socket.connect();
    }
  });

  return socket;
}

export function reconnectSocket() {
  disconnectSocket();
  return getSocket();
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = undefined;
  }
}
