import { io, Socket } from 'socket.io-client';
import { getPrimaryApiOrigin } from './apiBase';

let socket: Socket | null = null;

function createSocket(): Socket {
  // Production (Vercel/APK): connect directly to Railway via VITE_API_BASE_URL.
  // Local dev: omit URL so Socket.IO uses window.location.origin + Vite /socket.io proxy.
  const serverUrl = getPrimaryApiOrigin();

  const s = io(serverUrl, {
    autoConnect: false,
    withCredentials: true,
    path: '/socket.io',
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  s.on('connect_error', (err) => {
    const msg = err.message ?? '';
    if (msg.includes('400') || msg.includes('Invalid namespace') || (err as { description?: number }).description === 400) {
      console.warn('[socket] Stale session — resetting socket');
      s.disconnect();
      socket = null;
    }
  });

  return s;
}

export function getSocket(): Socket {
  if (!socket) {
    socket = createSocket();
  }
  return socket;
}

export function connectSocket(token: string) {
  const s = getSocket();
  s.auth = { token };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
