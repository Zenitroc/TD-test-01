import { Game } from './game/game.js';

const socket = io();

const nameInput = document.getElementById('name');
const colorInput = document.getElementById('color');
const hostBtn = document.getElementById('hostBtn');
const joinBtn = document.getElementById('joinBtn');
const menu = document.getElementById('menu');
const hud = document.getElementById('hud');
const ipDisplay = document.getElementById('ipDisplay');
const moneySpan = document.getElementById('money');
const baseHpSpan = document.getElementById('baseHp');
const buildTurretBtn = document.getElementById('buildTurret');
const buildWallBtn = document.getElementById('buildWall');
const sendWaveBtn = document.getElementById('sendWave');
const canvas = document.getElementById('game');
const startBtn = document.createElement('button');
startBtn.textContent = 'Iniciar partida';
startBtn.id = 'startGame';

let role = null;
let game = null;

hostBtn.addEventListener('click', () => {
  role = 'host';
  socket.emit('register', {
    role: 'host',
    name: nameInput.value || 'Host',
    color: colorInput.value,
  });
});

joinBtn.addEventListener('click', () => {
  role = 'client';
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
    if (role === 'host' && !document.getElementById('startGame')) {
      menu.appendChild(startBtn);
      startBtn.disabled = false;
      startBtn.addEventListener('click', () => {
        socket.emit('startGame');
        startBtn.disabled = true;
      });
    }
  }
});

socket.on('startGame', ({ seed, hostColor, clientColor }) => {
  menu.classList.add('hidden');
  hud.classList.remove('hidden');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  game = new Game(canvas, role, colorInput.value, hostColor, clientColor);
  game.start(seed);
  requestAnimationFrame(updateHud);
});

function updateHud() {
  if (!game) return;
  moneySpan.textContent = `💰${Math.floor(game.money)}`;
  baseHpSpan.textContent = `❤️${Math.floor(game.baseHp)}`;
  toggleAffordable(buildTurretBtn, game.money >= 15);
  toggleAffordable(buildWallBtn, game.money >= 10);
  toggleAffordable(sendWaveBtn, game.money >= 20);
  requestAnimationFrame(updateHud);
}

function toggleAffordable(btn, ok) {
  btn.classList.toggle('affordable', ok);
  btn.classList.toggle('unaffordable', !ok);
}

buildTurretBtn.addEventListener('click', () => {
  if (game) game.mode = 'turret';
});
buildWallBtn.addEventListener('click', () => {
  if (game) game.mode = 'wall';
});

canvas.addEventListener('click', (e) => {
  if (!game || !game.mode) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  game.tryPlace(x, y);
  if (game.mode === 'turret') {
    socket.emit('placeTurret', { x, y });
  } else if (game.mode === 'wall') {
    socket.emit('placeWall', { x, y });
  }
  game.mode = null;
});

sendWaveBtn.addEventListener('click', () => {
  if (game) {
    socket.emit('spawnWave');
  }
});

socket.on('spawnWave', ({ owner, color }) => {
  if (!game) return;
  game.spawnWave(owner, color);
});

socket.on('placeTurret', ({ owner, x, y, color }) => {
  if (!game) return;
  if (owner !== role) {
    game.tryPlace(x, y, owner, color, 'turret');
  }
});

socket.on('placeWall', ({ owner, x, y, color }) => {
  if (!game) return;
  if (owner !== role) {
    game.tryPlace(x, y, owner, color, 'wall');
  }
});
