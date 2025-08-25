import { generatePath, distanceToPath } from './path.js';
import { Soldier, Turret, Wall, pointAt, dist } from './entities.js';

export class Game {
  constructor(canvas, role, color, hostColor, clientColor) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.role = role;
    this.color = color;
    this.hostColor = hostColor;
    this.clientColor = clientColor;
    this.enemyColor = role === 'host' ? clientColor : hostColor;
    this.money = 20;
    this.baseHp = 100;
    this.lastTime = 0;
    this.mode = null; // 'turret' | 'wall'
    this.path = [];
    this.soldiers = [];
    this.turrets = [];
    this.walls = [];
    this.cellSize = 40;
  }

  generate(seed) {
    this.path = generatePath(seed, this.canvas.width, this.canvas.height, this.cellSize);
  }

  update(time) {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    this.money += dt; // +1 per second
    this.soldiers.forEach(s => s.alive && s.update(dt));
    this.soldiers = this.soldiers.filter(s => s.alive);
    this.turrets.forEach(t => t.update(dt, this.soldiers));
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
      if ((s.direction === 'up' && s.t <= 0) || (s.direction === 'down' && s.t >= 1)) {
        this.baseHp -= 1;
        s.alive = false;
      }
    });
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // zones
    ctx.fillStyle = hexToRgba(this.hostColor, 0.1);
    ctx.fillRect(0, 0, this.canvas.width / 2, this.canvas.height);
    ctx.fillStyle = hexToRgba(this.clientColor, 0.1);
    ctx.fillRect(this.canvas.width / 2, 0, this.canvas.width / 2, this.canvas.height);

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

    // base towers
    ctx.fillStyle = this.hostColor;
    ctx.fillRect(0, this.canvas.height - this.cellSize, this.cellSize, this.cellSize);
    ctx.fillStyle = this.clientColor;
    ctx.fillRect(this.canvas.width - this.cellSize, 0, this.cellSize, this.cellSize);

    // walls
    this.walls.forEach(w => {
      ctx.fillStyle = w.color;
      ctx.fillRect(w.x - this.cellSize / 2, w.y - this.cellSize / 2, this.cellSize, this.cellSize);
    });

    // turrets
    this.turrets.forEach(t => {
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.cellSize / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // soldiers
    this.soldiers.forEach(s => {
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x - this.cellSize / 4, s.y - this.cellSize / 4, this.cellSize / 2, this.cellSize / 2);
    });
  }

  gameLoop = (time) => {
    this.update(time);
    this.render();
    requestAnimationFrame(this.gameLoop);
  }

  start(seed) {
    this.generate(seed);
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop);
  }

  tryPlace(x, y, owner = this.role, color = this.color, type = this.mode) {
    const gx = Math.floor(x / this.cellSize) * this.cellSize + this.cellSize / 2;
    const gy = Math.floor(y / this.cellSize) * this.cellSize + this.cellSize / 2;
    const half = this.canvas.width / 2;
    if (owner === 'host' && gx >= half) return;
    if (owner === 'client' && gx < half) return;
    const point = { x: gx, y: gy };
    const d = distanceToPath(point, this.path);
    if (type === 'turret') {
      if (d > this.cellSize / 2) {
        if (owner === this.role) {
          if (this.money < 15) return;
          this.money -= 15;
        }
        this.turrets.push(new Turret(owner, gx, gy, color));
      }
    } else if (type === 'wall') {
      const onPath = this.path.some(p => p.x === gx && p.y === gy);
      if (onPath) {
        if (owner === this.role) {
          if (this.money < 10) return;
          this.money -= 10;
        }
        this.walls.push(new Wall(owner, gx, gy, color));
      }
    }
  }

  spawnWave(owner = this.role, color = this.color) {
    if (owner === this.role) {
      if (this.money < 20) return;
      this.money -= 20;
    }
    const dir = owner === 'host' ? 'up' : 'down';
    for (let i = 0; i < 3; i++) {
      const s = new Soldier(owner, this.path, color, dir);
      s.t += (i * 0.02) * (dir === 'up' ? -1 : 1);
      this.soldiers.push(s);
    }
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
