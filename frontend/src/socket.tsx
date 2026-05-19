import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initsocket = () => {
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.connect();
    return socket;
  }

  socket = io("http://localhost:8000", {
    withCredentials: true,
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("✅ Socket Connected:", socket?.id);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket Connection Error:", err.message);
  });

  return socket;
};