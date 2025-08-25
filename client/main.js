const socket = io();

const nameInput = document.getElementById('name');
const colorInput = document.getElementById('color');
const hostBtn = document.getElementById('hostBtn');
const joinBtn = document.getElementById('joinBtn');
const menu = document.getElementById('menu');
const hud = document.getElementById('hud');
const ipDisplay = document.getElementById('ipDisplay');

hostBtn.addEventListener('click', () => {
  socket.emit('register', {
    role: 'host',
    name: nameInput.value || 'Host',
    color: colorInput.value,
  });
});

joinBtn.addEventListener('click', () => {
  socket.emit('register', {
    role: 'client',
    name: nameInput.value || 'Cliente',
    color: colorInput.value,
  });
});

socket.on('ip', (ip) => {
  ipDisplay.textContent = `IP Host: ${ip}`;
});

socket.on('errorMsg', (msg) => {
  alert(msg);
});

socket.on('lobbyState', ({ hostConnected, clientConnected }) => {
  if (hostConnected && clientConnected) {
    menu.classList.add('hidden');
    hud.classList.remove('hidden');
  }
});