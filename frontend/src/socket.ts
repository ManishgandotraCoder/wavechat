import { io } from 'socket.io-client';
import config from './config';

export const socket = io(config.SOCKET_ENDPOINT, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
});
