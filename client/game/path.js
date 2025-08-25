// Generate deterministic path using seeded random
export function generatePath(seed, width, height, segments = 40) {
  const rand = mulberry32(hashCode(seed));
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = height * t;
    const xOffset = (rand() - 0.5) * width * 0.4; // horizontal variance
    const x = width / 2 + xOffset;
    points.push({ x, y });
  }
  return points;
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return h;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// helper to compute closest point on path for placement validation
export function distanceToPath(point, path) {
  let min = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const d = distToSegment(point, a, b);
    if (d < min) min = d;
  }
  return min;
}

function distToSegment(p, a, b) {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const proj = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
  return Math.hypot(p.x - proj.x, p.y - proj.y);

}
