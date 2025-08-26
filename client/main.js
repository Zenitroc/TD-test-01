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
const instructionsBtn = document.getElementById('instructionsBtn');
const instructionsPanel = document.getElementById('instructionsPanel');
const closeInstructionsBtn = document.getElementById('closeInstructions');
const menu = document.getElementById('menu');
const hostConfig = document.getElementById('hostConfig');
const hud = document.getElementById('hud');
const ipDisplay = document.getElementById('ipDisplay');
const statusDiv = document.getElementById('status');
const hostStatusDiv = document.getElementById('hostStatus');
const moneySpan = document.getElementById('money');
const baseHpSpan = document.getElementById('baseHp');
const enemyHpSpan = document.getElementById('enemyHp');
const buildTurretBtn = document.getElementById('buildTurret');
const buildWallBtn = document.getElementById('buildWall');
const sendWaveBtn = document.getElementById('sendWave');
const shopBtn = document.getElementById('shopBtn');
const shopModal = document.getElementById('shop');
const upgSoldiersBtn = document.getElementById('upgSoldiers');
const upgSpeedBtn = document.getElementById('upgSpeed');
const upgExtraBtn = document.getElementById('upgExtra');
const upgTurretSpeedBtn = document.getElementById('upgTurretSpeed');
const upgTurretExtraBtn = document.getElementById('upgTurretExtra');
const closeShopBtn = document.getElementById('closeShop');
const canvas = document.getElementById('game');
const statsPanel = document.getElementById('statsPanel');
const playerNameDiv = document.getElementById('playerName');
const enemyNameDiv = document.getElementById('enemyName');
const startBtn = document.createElement('button');
startBtn.textContent = 'Iniciar partida';
startBtn.id = 'startGame';


let role = null;
let game = null;
let waveCooldown = false;

function hostGame() {
  role = 'host';
  menu.classList.add('hidden');
  hostConfig.classList.remove('hidden');
  socket.emit('register', {
    role: 'host',
    name: nameInput.value || 'Host',
    color: colorInput.value,
  });
  hostStatusDiv.textContent = 'Esperando jugador...';
  mapTypeSelect.disabled = false;
  towerSelect.disabled = false;
  econRateInput.disabled = false;
  gfxModeSelect.disabled = false;
}

function joinGame() {
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
}

function openInstructions() {
  menu.classList.add('hidden');
  instructionsPanel.classList.remove('hidden');
}

function closeInstructions() {
  instructionsPanel.classList.add('hidden');
  menu.classList.remove('hidden');
}

hostBtn.addEventListener('click', hostGame);
joinBtn.addEventListener('click', joinGame);
instructionsBtn.addEventListener('click', openInstructions);
closeInstructionsBtn.addEventListener('click', closeInstructions);

socket.on('ip', (ip) => {
  ipDisplay.textContent = `IP Host: ${ip}`;
});

socket.on('errorMsg', (msg) => {
  alert(msg);
});

socket.on('lobbyState', ({ hostConnected, clientConnected, host, client }) => {
  if (hostConnected && clientConnected) {
    if (role === 'host' && !document.getElementById('startGame')) {
      hostConfig.appendChild(startBtn);
      startBtn.disabled = false;
      startBtn.addEventListener('click', () => {
        socket.emit('startGame', { mapType: mapTypeSelect.value, towerCount: +towerSelect.value, econRate: +econRateInput.value, gfxMode: gfxModeSelect.value });
        startBtn.disabled = true;
      });
    }
  }
  if (role === 'host') {
    if (clientConnected && client) {
      hostStatusDiv.innerHTML = `Jugador conectado: <span style="color:${client.color}">${client.name}</span>`;
    } else {
      hostStatusDiv.textContent = 'Esperando jugador...';
    }
  }
  if (role === 'client' && clientConnected) {
    statusDiv.innerHTML = 'Conectado<br/>Esperando que el Host inicia... <span class="loader"></span>';
  }
});

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
socket.on('startGame', ({ seed, hostColor, clientColor, hostName, clientName, mapType, towerCount, econRate, gfxMode }) => {
  menu.classList.add('hidden');
  hostConfig.classList.add('hidden');
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
  toggleAffordable(sendWaveBtn, game.money >= 20 && !waveCooldown);
  toggleAffordable(upgSoldiersBtn, game.money >= +upgSoldiersBtn.dataset.cost);
  toggleAffordable(upgSpeedBtn, game.money >= +upgSpeedBtn.dataset.cost);
  toggleAffordable(upgExtraBtn, game.money >= +upgExtraBtn.dataset.cost);
  toggleAffordable(upgTurretSpeedBtn, game.money >= +upgTurretSpeedBtn.dataset.cost);
  toggleAffordable(upgTurretExtraBtn, game.money >= +upgTurretExtraBtn.dataset.cost);
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
shopBtn.addEventListener('click', () => {
  shopModal.classList.toggle('hidden');
});
closeShopBtn.addEventListener('click', () => {
  shopModal.classList.add('hidden');
});
upgSoldiersBtn.addEventListener('click', () => {
  if (game && game.purchaseUpgrade('soldier')) {
    socket.emit('upgrade', { type: 'soldier' });
  }
});
upgSpeedBtn.addEventListener('click', () => {
  if (game && game.purchaseUpgrade('speed')) {
    socket.emit('upgrade', { type: 'speed' });
  }
});
upgExtraBtn.addEventListener('click', () => {
  if (game && game.purchaseUpgrade('extra')) {
    socket.emit('upgrade', { type: 'extra' });
  }
});
upgTurretSpeedBtn.addEventListener('click', () => {
  if (game && game.purchaseUpgrade('turretSpeed')) {
    socket.emit('upgrade', { type: 'turretSpeed' });
  }
});
upgTurretExtraBtn.addEventListener('click', () => {
  if (game && game.purchaseUpgrade('turretExtra')) {
    socket.emit('upgrade', { type: 'turretExtra' });
  }
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
  if (waveCooldown || !game) return;
  const spawned = game.spawnWave();
  if (spawned) {
    socket.emit('spawnWave');
    startWaveCooldown();
  }
});

function startWaveCooldown() {
  waveCooldown = true;
  sendWaveBtn.disabled = true;
  sendWaveBtn.classList.add('cooldown');
  setTimeout(() => {
    waveCooldown = false;
    sendWaveBtn.disabled = false;
    sendWaveBtn.classList.remove('cooldown');
  }, 6000);
}

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

socket.on('upgrade', ({ owner, type }) => {
  if (!game) return;
  if (owner !== role) game.applyUpgrade(owner, type);
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
