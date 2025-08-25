export class Soldier {
  constructor(owner, path, color, direction) {
    this.owner = owner;
    this.path = path;
    this.color = color;
    this.t = direction === 'up' ? 1 : 0; // 0 start at top? Wait host bottom: host direction up, client direction down
    this.direction = direction; // 'up' or 'down'
    this.speed = 40; // pixels per second
    this.hp = 5;
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
    if (this.cooldown > 0) this.cooldown -= dt;
    else {
      const target = soldiers.find(s => s.owner !== this.owner && s.alive && dist(s, this) < this.range);
      if (target) {
        target.hp -= 5;
        if (target.hp <= 0) target.alive = false;
        this.cooldown = 0.5; // fire every 0.5s
      }
    }
  }
}

export class Wall {
  constructor(owner, x, y, color) {
    this.owner = owner;
    this.x = x; this.y = y;
    this.color = color;
    this.hp = 6;
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