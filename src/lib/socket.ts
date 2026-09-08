import { io, Socket } from "socket.io-client";

// Primary socket URL from env, or derived from NEXT_PUBLIC_API_URL by stripping /api/v1
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const DERIVED_SOCKET_URL = API_URL ? API_URL.replace(/\/api\/v1\/?$/, "") : undefined;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || DERIVED_SOCKET_URL;

if (!SOCKET_URL) {
  console.error(
    "Missing NEXT_PUBLIC_SOCKET_URL / NEXT_PUBLIC_API_URL environment variable. Socket connection is disabled to prevent infinite reconnect loops against the frontend origin."
  );
}

export const socket: Socket = io(SOCKET_URL || "http://localhost:invalid-port-to-prevent-connection", {
  withCredentials: true,
  autoConnect: false,
  transports: ["polling", "websocket"],
  extraHeaders: {
    "ngrok-skip-browser-warning": "true"
  }
});

if (!SOCKET_URL) {
  // Guard connect() so it does absolutely nothing if called
  socket.connect = () => socket;
}

