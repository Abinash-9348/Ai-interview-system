import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initsocket = () => {
  if (socket) {
    console.log("⚠️ USING EXISTING SOCKET");
    return socket;
  }

  socket = io("http://localhost:8000", {
    transports: ["websocket"], 
    reconnection: false, // ❗ stop retry spam
    forceNew: false,
  });

  console.log("✅ NEW SOCKET CREATED");

  return socket;
};