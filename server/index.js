import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import os from 'os';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// serve static files from client directory
app.use(express.static('client'));

let hostId = null;
let clientId = null;
const players = {}; // socket.id -> {role,name,color}

io.on('connection', (socket) => {
  socket.on('register', ({ role, name, color }) => {
    if (role === 'host') {
      if (hostId) {
        socket.emit('errorMsg', 'Host already exists');
        return;
      }
      hostId = socket.id;
      socket.emit('ip', getLocalIp());
    } else if (role === 'client') {
      if (clientId) {
        socket.emit('errorMsg', 'Client already connected');
        return;
      }
      clientId = socket.id;
    }
    players[socket.id] = { role, name, color };
    io.emit('lobbyState', { hostConnected: !!hostId, clientConnected: !!clientId });
  });

  socket.on('startGame', () => {
    if (socket.id !== hostId) return; // only host can start
    const seed = Date.now().toString();
    io.emit('startGame', { seed });
  });

  socket.on('spawnWave', () => {
    const player = players[socket.id];
    if (!player) return;
    io.emit('spawnWave', { owner: player.role, color: player.color });
  });

  socket.on('placeTurret', ({ x, y }) => {
    const player = players[socket.id];
    if (!player) return;
    io.emit('placeTurret', { owner: player.role, x, y, color: player.color });
  });

  socket.on('placeWall', ({ x, y }) => {
    const player = players[socket.id];
    if (!player) return;
    io.emit('placeWall', { owner: player.role, x, y, color: player.color });
  });

  socket.on('disconnect', () => {
    if (socket.id === hostId) hostId = null;
    if (socket.id === clientId) clientId = null;
    delete players[socket.id];
    io.emit('lobbyState', { hostConnected: !!hostId, clientConnected: !!clientId });
  });
});

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '0.0.0.0';
}

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);

});

