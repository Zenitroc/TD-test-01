import { generatePath, distanceToPath } from './path.js';
import { Soldier, Turret, Wall, Bullet, dist } from './entities.js';

export class Game {
  constructor(canvas, role, color, hostColor, clientColor, hostName, clientName) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.role = role;
    this.color = color;
    this.hostColor = hostColor;
    this.clientColor = clientColor;
    this.enemyColor = role === 'host' ? clientColor : hostColor;
    this.hostName = hostName;
    this.clientName = clientName;
    this.playerName = role === 'host' ? hostName : clientName;
    this.enemyName = role === 'host' ? clientName : hostName;
    this.money = 20;
    this.baseHp = { host: 100, client: 100 };
    this.lastTime = 0;
    this.mode = null; // 'turret' | 'wall'
    this.path = [];
    this.soldiers = [];
    this.turrets = [];
    this.walls = [];
    this.cellSize = 40;
    this.bullets = [];
    this.preview = null;
    this.camera = { x: 0, y: 0, scale: 1 };
    this.cooldowns = { wave: 0, turret: 0, wall: 0 };
  }

  generate(seed, mapType) {
    this.path = generatePath(seed, this.canvas.width, this.canvas.height, this.cellSize, mapType);
  }

  update(time) {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    this.money += dt; // +1 per segundo
    this.soldiers.forEach(s => s.alive && s.update(dt));
    this.soldiers = this.soldiers.filter(s => s.alive);
    this.turrets.forEach(t => {
      const b = t.update(dt, this.soldiers);
      if (b) this.bullets.push(b);
    });
    this.bullets.forEach(b => b.alive && b.update(dt));
    this.bullets = this.bullets.filter(b => b.alive);
    // soldiers vs walls
    this.soldiers.forEach(s => {
      const target = this.walls.find(w => w.owner !== s.owner && dist(w, s) < this.cellSize / 2);
      if (target) {
        target.hp -= 2 * dt;
        if (target.hp <= 0) this.walls.splice(this.walls.indexOf(target), 1);
        s.speed = 0;
      } else {
        s.speed = 40;
      }
    });
    // soldiers reaching base
    this.soldiers.forEach(s => {
      if (s.direction === 'up' && s.t <= 0) {
        this.baseHp.client -= 1;
        s.alive = false;
      } else if (s.direction === 'down' && s.t >= 1) {
        this.baseHp.host -= 1;
        s.alive = false;
      }
    });
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    ctx.setTransform(this.camera.scale, 0, 0, this.camera.scale, this.camera.x, this.camera.y);

    // zones
    ctx.fillStyle = hexToRgba(this.clientColor, 0.1);
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);
    ctx.fillStyle = hexToRgba(this.hostColor, 0.1);
    ctx.fillRect(0, this.canvas.height / 2, this.canvas.width, this.canvas.height / 2);

    // grid
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let x = 0; x <= this.canvas.width; x += this.cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= this.canvas.height; y += this.cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }

    // path
    ctx.strokeStyle = '#444';
    ctx.lineWidth = this.cellSize / 2;
    ctx.lineCap = 'square';
    ctx.beginPath();
    this.path.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // base towers (centered top and bottom)
    ctx.fillStyle = this.clientColor;
    ctx.fillRect(this.canvas.width / 2 - this.cellSize / 2, 0, this.cellSize, this.cellSize);
    ctx.fillStyle = this.hostColor;
    ctx.fillRect(this.canvas.width / 2 - this.cellSize / 2, this.canvas.height - this.cellSize, this.cellSize, this.cellSize);

    // walls
    this.walls.forEach(w => {
      ctx.fillStyle = w.color;
      ctx.fillRect(w.x - this.cellSize / 2, w.y - this.cellSize / 2, this.cellSize, this.cellSize);
      drawHpBar(ctx, w.x, w.y - this.cellSize / 2 - 6, this.cellSize, w.hp / w.maxHp);
    });

    // turrets
    this.turrets.forEach(t => {
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.cellSize / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // bullets
    this.bullets.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // soldiers
    this.soldiers.forEach(s => {
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x - this.cellSize / 4, s.y - this.cellSize / 4, this.cellSize / 2, this.cellSize / 2);
      drawHpBar(ctx, s.x, s.y - this.cellSize / 2 - 4, this.cellSize / 2, s.hp / s.maxHp);
    });

    // preview ghost
    if (this.preview) {
      ctx.fillStyle = this.preview.valid ? 'rgba(46,204,113,0.5)' : 'rgba(231,76,60,0.5)';
      if (this.preview.type === 'turret') {
        ctx.beginPath();
        ctx.arc(this.preview.x, this.preview.y, this.cellSize / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.preview.type === 'wall') {
        ctx.fillRect(this.preview.x - this.cellSize / 2, this.preview.y - this.cellSize / 2, this.cellSize, this.cellSize);
      }
    }

    ctx.restore();
  }

  gameLoop = (time) => {
    this.update(time);
    this.render();
    requestAnimationFrame(this.gameLoop);
  }

  start(seed, mapType) {
    this.generate(seed, mapType);
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop);
  }

  tryPlace(x, y, owner = this.role, color = this.color, type = this.mode) {
    const gx = Math.floor(x / this.cellSize) * this.cellSize + this.cellSize / 2;
    const gy = Math.floor(y / this.cellSize) * this.cellSize + this.cellSize / 2;
    if (!this.canPlace(gx, gy, owner, type)) return false;
    const now = performance.now() / 1000;
    if (owner === this.role) {
      if (type === 'turret') {
        if (this.money < 15 || now - this.cooldowns.turret < 0.5) return false;
        this.money -= 15;
        this.cooldowns.turret = now;
      } else if (type === 'wall') {
        if (this.money < 10 || now - this.cooldowns.wall < 0.5) return false;
        this.money -= 10;
        this.cooldowns.wall = now;
      }
    }
    if (type === 'turret') this.turrets.push(new Turret(owner, gx, gy, color));
    if (type === 'wall') this.walls.push(new Wall(owner, gx, gy, color));
    return true;
  }

  canPlace(gx, gy, owner, type) {
    const half = this.canvas.height / 2;
    if (owner === 'host' && gy < half) return false;
    if (owner === 'client' && gy >= half) return false;
    const point = { x: gx, y: gy };
    if (type === 'turret') {
      const d = distanceToPath(point, this.path);
      return d > this.cellSize / 2;
    }
    if (type === 'wall') {
      return this.path.some(p => p.x === gx && p.y === gy);
    }
    return false;
  }

  setPreview(x, y) {
    if (!this.mode) { this.preview = null; return; }
    const gx = Math.floor(x / this.cellSize) * this.cellSize + this.cellSize / 2;
    const gy = Math.floor(y / this.cellSize) * this.cellSize + this.cellSize / 2;
    const valid = this.canPlace(gx, gy, this.role, this.mode);
    this.preview = { x: gx, y: gy, valid, type: this.mode };
  }

  zoom(factor, cx, cy) {
    const oldScale = this.camera.scale;
    this.camera.scale = Math.min(2, Math.max(0.5, this.camera.scale * factor));
    const scaleChange = this.camera.scale / oldScale;
    this.camera.x = cx - (cx - this.camera.x) * scaleChange;
    this.camera.y = cy - (cy - this.camera.y) * scaleChange;
  }

  moveCamera(dx, dy) {
    this.camera.x += dx;
    this.camera.y += dy;
  }

  spawnWave(owner = this.role, color = this.color) {
    const now = performance.now() / 1000;
    if (owner === this.role) {
      if (this.money < 20 || now - this.cooldowns.wave < 1) return false;
      this.money -= 20;
      this.cooldowns.wave = now;
    }
    const dir = owner === 'host' ? 'up' : 'down';
    for (let i = 0; i < 3; i++) {
      const s = new Soldier(owner, this.path, color, dir);
      s.t += (i * 0.02) * (dir === 'up' ? -1 : 1);
      this.soldiers.push(s);
    }
    return true;
  }
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawHpBar(ctx, x, y, width, ratio) {
  ctx.fillStyle = '#000';
  ctx.fillRect(x - width / 2, y, width, 4);
  ctx.fillStyle = `hsl(${ratio * 120}, 100%, 40%)`;
  ctx.fillRect(x - width / 2, y, width * ratio, 4);
}