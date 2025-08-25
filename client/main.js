import { Game } from './game/game.js';

const socket = io();

const nameInput = document.getElementById('name');
const colorInput = document.getElementById('color');
const mapTypeSelect = document.getElementById('mapType');
const towerSelect = document.getElementById('towerCount');
const econRateInput = document.getElementById('econRate');
const econLabel = document.getElementById('econLabel');
const gfxModeSelect = document.getElementById('gfxMode');
const musicInput = document.getElementById('musicUrl');
const hostBtn = document.getElementById('hostBtn');
const joinBtn = document.getElementById('joinBtn');
const menu = document.getElementById('menu');
const hud = document.getElementById('hud');
const ipDisplay = document.getElementById('ipDisplay');
const statusDiv = document.getElementById('status');
const instructions = document.getElementById('instructions');
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
const closeShopBtn = document.getElementById('closeShop');
const canvas = document.getElementById('game');
const statsPanel = document.getElementById('statsPanel');
const playerNameDiv = document.getElementById('playerName');
const enemyNameDiv = document.getElementById('enemyName');
const startBtn = document.createElement('button');
startBtn.textContent = 'Iniciar partida';
startBtn.id = 'startGame';
const endScreen = document.getElementById('endScreen');
const resultMsg = document.getElementById('resultMsg');
const finalStats = document.getElementById('finalStats');
const fwCanvas = document.getElementById('fireworks');

let role = null;
let game = null;
let waveCooldown = false;

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
  musicInput.disabled = false;
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
  musicInput.disabled = true;
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
        socket.emit('startGame', { mapType: mapTypeSelect.value, towerCount: +towerSelect.value, econRate: +econRateInput.value, gfxMode: gfxModeSelect.value, musicUrl: musicInput.value });
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
socket.on('startGame', ({ seed, hostColor, clientColor, hostName, clientName, mapType, towerCount, econRate, gfxMode, musicUrl }) => {
  menu.classList.add('hidden');
  instructions.classList.add('hidden');
  hud.classList.remove('hidden');
  canvas.classList.remove('hidden');
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  game = new Game(canvas, role, colorInput.value, hostColor, clientColor, hostName, clientName, towerCount, econRate, gfxMode);
  playerNameDiv.textContent = game.playerName;
  playerNameDiv.style.color = game.color;
  enemyNameDiv.textContent = game.enemyName;
  enemyNameDiv.style.color = game.enemyColor;
  game.onGameOver = onGameOver;
  game.start(seed, mapType);
  requestAnimationFrame(updateHud);
  if (musicUrl) {
    const audio = new Audio(musicUrl);
    audio.loop = true;
    audio.play().catch(() => {});
    window._bgm = audio;
  }
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
  if (e.button === 1) {
    e.preventDefault();
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    } else if (e.button === 2 && game) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - game.camera.x) / game.camera.scale;
    const y = (e.clientY - rect.top - game.camera.y) / game.camera.scale;
    const upgraded = game.upgradeTurret(x, y);
    if (upgraded) socket.emit('upgradeTurret', { x, y });
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
  if (e.button === 1) dragging = false;
});
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (!game) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left - game.camera.x) / game.camera.scale;
  const y = (e.clientY - rect.top - game.camera.y) / game.camera.scale;
  const gx = Math.floor(x / game.cellSize) * game.cellSize + game.cellSize / 2;
  const gy = Math.floor(y / game.cellSize) * game.cellSize + game.cellSize / 2;
  if (game.upgradeTurret(gx, gy)) {
    socket.emit('upgradeTurret', { x: gx, y: gy });
  }
});

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
  if (owner !== role) {
    game.applyUpgrade(owner, type);
    game.metrics[owner].spent += game.shopCosts[type];
  }
});

socket.on('upgradeTurret', ({ owner, x, y }) => {
  if (!game) return;
  if (owner !== role) game.upgradeTurret(x, y, owner);
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

function onGameOver(winner) {
  hud.classList.add('hidden');
  endScreen.classList.remove('hidden');
  resultMsg.textContent = winner === role ? 'Has ganado' : 'Has perdido';
  resultMsg.style.color = winner === role ? '#2ecc71' : '#e74c3c';
  const my = game.metrics[role];
  const enemyRole = role === 'host' ? 'client' : 'host';
  const enemy = game.metrics[enemyRole];
  const duration = ((performance.now() - game.startTime) / 1000).toFixed(1);
  finalStats.innerHTML = `
    <h3 style="color:${game.color}">${game.playerName}</h3>
    <p>💰 Recaudado: ${Math.floor(my.earned)}</p>
    <p>💸 Gastado: ${Math.floor(my.spent)}</p>
    <p>☠️ Enemigos: ${my.kills}</p>
    <p>📦 Oleadas: ${my.waves}</p>
    <p>🧱 Muros: ${my.walls}</p>
    <h3 style="color:${game.enemyColor}">${game.enemyName}</h3>
    <p>💰 Recaudado: ${Math.floor(enemy.earned)}</p>
    <p>💸 Gastado: ${Math.floor(enemy.spent)}</p>
    <p>☠️ Enemigos: ${enemy.kills}</p>
    <p>📦 Oleadas: ${enemy.waves}</p>
    <p>🧱 Muros: ${enemy.walls}</p>
    <p>⏱️ Duración: ${duration}s</p>
  `;
  if (winner === role) startFireworks();
}

function startFireworks() {
  const ctx = fwCanvas.getContext('2d');
  fwCanvas.width = window.innerWidth;
  fwCanvas.height = window.innerHeight;
  const particles = [];
  function burst() {
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * fwCanvas.width,
        y: Math.random() * fwCanvas.height * 0.5,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        life: 2,
        color: `hsl(${Math.random() * 360},100%,60%)`
      });
    }
  }
  let last = performance.now();
  function loop(time) {
    const dt = (time - last) / 1000;
    last = time;
    ctx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);
    particles.forEach(p => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 60 * dt;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
    });
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
    if (particles.length > 0) requestAnimationFrame(loop);
  }
  burst();
  const interval = setInterval(() => {
    burst();
    if (particles.length > 200) clearInterval(interval);
  }, 500);
  requestAnimationFrame(loop);
}