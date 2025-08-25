import { Game } from './game/game.js';

const socket = io();

const nameInput = document.getElementById('name');
const colorInput = document.getElementById('color');
const mapTypeSelect = document.getElementById('mapType');
const towerSelect = document.getElementById('towerCount');
const econRateInput = document.getElementById('econRate');
const econLabel = document.getElementById('econLabel');
const gfxModeSelect = document.getElementById('gfxMode');
const hostBtn = document.getElementById('hostBtn');
const joinBtn = document.getElementById('joinBtn');
const menu = document.getElementById('menu');
const hud = document.getElementById('hud');
const ipDisplay = document.getElementById('ipDisplay');
const statusDiv = document.getElementById('status');
const moneySpan = document.getElementById('money');
const baseHpSpan = document.getElementById('baseHp');
const enemyHpSpan = document.getElementById('enemyHp');
const buildTurretBtn = document.getElementById('buildTurret');
const buildWallBtn = document.getElementById('buildWall');
const sendWaveBtn = document.getElementById('sendWave');
const canvas = document.getElementById('game');
const statsPanel = document.getElementById('statsPanel');
const playerNameDiv = document.getElementById('playerName');
const enemyNameDiv = document.getElementById('enemyName');
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
  statusDiv.textContent = 'Esperando jugador...';
  mapTypeSelect.disabled = false;
  towerSelect.disabled = false;
  econRateInput.disabled = false;
  gfxModeSelect.disabled = false;
});

joinBtn.addEventListener('click', () => {
  role = 'client';
  socket.emit('register', {
    role: 'client',
    name: nameInput.value || 'Cliente',
    color: colorInput.value,
  });
  statusDiv.textContent = 'Conectando...';
  mapTypeSelect.disabled = true;
  towerSelect.disabled = true;
  econRateInput.disabled = true;
  gfxModeSelect.disabled = true;
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
        socket.emit('startGame', { mapType: mapTypeSelect.value, towerCount: +towerSelect.value, econRate: +econRateInput.value, gfxMode: gfxModeSelect.value });
        startBtn.disabled = true;
      });
    }
  }
  if (role === 'host') {
    statusDiv.textContent = clientConnected ? 'Jugador Conectado!' : 'Esperando jugador...';
  }
  if (role === 'client' && clientConnected) {
    statusDiv.innerHTML = 'Conectado<br/>Esperando que el Host inicia... <span class="loader"></span>';
  }
});

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
socket.on('startGame', ({ seed, hostColor, clientColor, hostName, clientName, mapType, towerCount, econRate, gfxMode }) => {
  menu.classList.add('hidden');
  hud.classList.remove('hidden');
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  game = new Game(canvas, role, colorInput.value, hostColor, clientColor, hostName, clientName, towerCount, econRate, gfxMode);
  playerNameDiv.textContent = game.playerName;
  playerNameDiv.style.color = game.color;
  enemyNameDiv.textContent = game.enemyName;
  enemyNameDiv.style.color = game.enemyColor;
  game.start(seed, mapType);
  requestAnimationFrame(updateHud);
});

function updateHud() {
  if (!game) return;
  moneySpan.textContent = `💰${Math.floor(game.money)}`;
  baseHpSpan.textContent = `❤️${Math.floor(game.baseHp[role])}`;
  const enemyRole = role === 'host' ? 'client' : 'host';
  enemyHpSpan.textContent = `❤️${Math.floor(game.baseHp[enemyRole])}`;
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
  const x = (e.clientX - rect.left - game.camera.x) / game.camera.scale;
  const y = (e.clientY - rect.top - game.camera.y) / game.camera.scale;
  const placed = game.tryPlace(x, y);
  if (placed) {
    if (game.mode === 'turret') {
      socket.emit('placeTurret', { x, y });
    } else if (game.mode === 'wall') {
      socket.emit('placeWall', { x, y });
    }
  }
  game.mode = null;
  game.preview = null;
});

canvas.addEventListener('mousemove', (e) => {
  if (!game) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left - game.camera.x) / game.camera.scale;
  const y = (e.clientY - rect.top - game.camera.y) / game.camera.scale;
  game.setPreview(x, y);
});

canvas.addEventListener('wheel', (e) => {
  if (!game) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  game.zoom(factor, x, y);
  const wx = (x - game.camera.x) / game.camera.scale;
  const wy = (y - game.camera.y) / game.camera.scale;
  game.setPreview(wx, wy);
}, { passive: false });

let dragging = false;
let lastX = 0, lastY = 0;
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 2) {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  }
});
window.addEventListener('mousemove', (e) => {
  if (dragging && game) {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    game.moveCamera(dx, dy);
    lastX = e.clientX;
    lastY = e.clientY;
  }
});
window.addEventListener('mouseup', (e) => {
  if (e.button === 2) dragging = false;
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('keydown', (e) => {
  if (!game) return;
  const step = 20;
  if (['ArrowUp', 'w', 'W'].includes(e.key)) game.moveCamera(0, step);
  if (['ArrowDown', 's', 'S'].includes(e.key)) game.moveCamera(0, -step);
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) game.moveCamera(step, 0);
  if (['ArrowRight', 'd', 'D'].includes(e.key)) game.moveCamera(-step, 0);
});

sendWaveBtn.addEventListener('click', () => {
  if (game) {
    const spawned = game.spawnWave();
    if (spawned) socket.emit('spawnWave');
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

econRateInput.addEventListener('input', () => {
  econLabel.textContent = `x${econRateInput.value}`;
});

makeDraggable(statsPanel);

function makeDraggable(el) {
  let startX = 0, startY = 0, offsetX = 0, offsetY = 0;
  el.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startX = e.clientX;
    startY = e.clientY;
    offsetX = el.offsetLeft;
    offsetY = el.offsetTop;
    function onMove(ev) {
      el.style.left = offsetX + ev.clientX - startX + 'px';
      el.style.top = offsetY + ev.clientY - startY + 'px';
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });
}