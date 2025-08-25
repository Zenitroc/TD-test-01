import { generatePath, distanceToPath } from './path.js';
import { Soldier, Turret, Wall, pointAt, dist } from './entities.js';

export class Game {
  constructor(canvas, role, color) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.role = role;
    this.color = color;
    this.enemyColor = '#ff0000';
    this.money = 20;
    this.baseHp = 100;
    this.lastTime = 0;
    this.mode = null; // 'turret' | 'wall'
    this.path = [];
    this.soldiers = [];
    this.turrets = [];
    this.walls = [];
  }

  generate(seed) {
    this.path = generatePath(seed, this.canvas.width, this.canvas.height);
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
      const target = this.walls.find(w => w.owner !== s.owner && dist(w, s) < 10);
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
    // path
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 16;
    ctx.beginPath();
    this.path.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // walls
    this.walls.forEach(w => {
      ctx.fillStyle = w.color;
      ctx.fillRect(w.x - 8, w.y - 8, 16, 16);
    });

    // turrets
    this.turrets.forEach(t => {
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 10, 0, Math.PI * 2);
      ctx.fill();
    });

    // soldiers
    this.soldiers.forEach(s => {
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x - 5, s.y - 5, 10, 10);
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
    const point = { x, y };
    const d = distanceToPath(point, this.path);
    if (type === 'turret') {
      if (d > 20) {
        if (owner === this.role) {
          if (this.money < 15) return;
          this.money -= 15;
        }
        this.turrets.push(new Turret(owner, x, y, color));
      }
    } else if (type === 'wall') {
      if (d <= 8) {
        if (owner === this.role) {
          if (this.money < 10) return;
          this.money -= 10;
        }
        const proj = nearestPointOnPath(point, this.path);
        this.walls.push(new Wall(owner, proj.x, proj.y, color));
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

function nearestPointOnPath(p, path) {
  let best = null;
  let min = Infinity;
  for (let i = 0; i < path.length; i++) {
    const pt = path[i];
    const d = Math.hypot(p.x - pt.x, p.y - pt.y);
    if (d < min) { min = d; best = pt; }
  }
  return best || p;
}
