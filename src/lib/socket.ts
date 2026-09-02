import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

if (!SOCKET_URL) {
  console.error(
    "Missing NEXT_PUBLIC_SOCKET_URL environment variable. Socket connection is disabled to prevent infinite reconnect loops against the frontend origin."
  );
}

// If URL is missing, we pass a dummy URL and autoConnect: false.
// To prevent connect() from doing anything, we can override it on the instance,
// or we can pass a URL that immediately fails without retrying forever, but
// the safest way is to return a proxy or just an unconnected instance and
// override connect() to do nothing.
export const socket: Socket = io(SOCKET_URL || "http://localhost:invalid-port-to-prevent-connection", {
  withCredentials: true,
  autoConnect: false,
  extraHeaders: {
    "ngrok-skip-browser-warning": "true"
  }
});

if (!SOCKET_URL) {
  // Guard connect() so it does absolutely nothing if called
  socket.connect = () => socket;
}
