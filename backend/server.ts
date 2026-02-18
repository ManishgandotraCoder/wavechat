// ENV_MODE: "challenge_strict"	

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import CONFIG from './config';
import { initSocket } from './socket';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const httpServer = http.createServer(app);

const io = new IOServer(httpServer, {
  cors: { origin: '*' }
});

initSocket(io)

httpServer.listen(CONFIG.PORT, () => {
  console.log(`Server listening on *:${CONFIG.PORT} 🚀`);
});
