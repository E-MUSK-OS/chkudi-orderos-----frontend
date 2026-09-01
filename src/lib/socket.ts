// import { io } from "socket.io-client";

// export const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
//   withCredentials: true,
//   autoConnect: false,
// });

import { io, Socket } from "socket.io-client";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

export const socket: Socket = socketUrl
  ? io(socketUrl, {
      withCredentials: true,
      autoConnect: false,
    })
  : ({
      id: undefined,
      connected: false,
      connect: () => {},
      disconnect: () => {},
      on: () => {},
      off: () => {},
      emit: () => {},
    } as unknown as Socket);
