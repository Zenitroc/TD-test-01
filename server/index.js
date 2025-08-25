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
    io.emit('lobbyState', { hostConnected: !!hostId, clientConnected: !!clientId });
  });

  socket.on('disconnect', () => {
    if (socket.id === hostId) hostId = null;
    if (socket.id === clientId) clientId = null;
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