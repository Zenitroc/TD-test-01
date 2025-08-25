export class Soldier {
  constructor(owner, path, color, direction, stats = { speed: 40, hp: 5, atk: 1 }) {
    this.owner = owner;
    this.path = path;
    this.color = color;
    this.t = direction === 'up' ? 1 : 0;
    this.direction = direction; // 'up' or 'down'
    this.baseSpeed = stats.speed;
    this.speed = this.baseSpeed;
    this.maxHp = stats.hp;
    this.hp = this.maxHp;
    this.dmg = stats.atk;
    this.wallDmg = stats.atk + 1;
    this.alive = true;
  }
  update(dt) {
    const step = this.speed * dt / totalPathLength(this.path);
    this.t += this.direction === 'up' ? -step : step;
    this.t = Math.max(0, Math.min(1, this.t));
    const pos = pointAt(this.path, this.t);
    this.x = pos.x; this.y = pos.y;
  }
}

export class Turret {
  constructor(owner, x, y, color) {
    this.owner = owner;
    this.x = x; this.y = y;
    this.color = color;
    this.range = 60;
    this.cooldown = 0;
  }
  update(dt, soldiers) {
    if (this.cooldown > 0) {
      this.cooldown -= dt;
      return null;
    }
    const target = soldiers.find(s => s.owner !== this.owner && s.alive && dist(s, this) < this.range);
    if (target) {
      this.cooldown = 0.5; // fire every 0.5s
      return new Bullet(this.x, this.y, target, 5, this.color);
    }
    return null;
  }
}

export class Wall {
  constructor(owner, x, y, color) {
    this.owner = owner;
    this.x = x; this.y = y;
    this.color = color;
    this.maxHp = 6;
    this.hp = this.maxHp;
  }
}

export class Bullet {
  constructor(x, y, target, dmg, color) {
    this.x = x; this.y = y;
    this.target = target;
    this.dmg = dmg;
    this.color = color;
    this.speed = 200;
    this.alive = true;
  }
  update(dt) {
    if (!this.target.alive) { this.alive = false; return; }
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const d = Math.hypot(dx, dy);
    const step = this.speed * dt;
    if (d <= step) {
      this.target.hp -= this.dmg;
      if (this.target.hp <= 0) this.target.alive = false;
      this.alive = false;
    } else {
      this.x += (dx / d) * step;
      this.y += (dy / d) * step;
    }
  }
}

export function pointAt(path, t) {
  const total = path.length - 1;
  const idx = Math.min(Math.floor(t * total), total - 1);
  const localT = t * total - idx;
  const a = path[idx];
  const b = path[idx + 1];
  return { x: a.x + (b.x - a.x) * localT, y: a.y + (b.y - a.y) * localT };
}

export function totalPathLength(path) {
  let len = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    len += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return len;
}

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}