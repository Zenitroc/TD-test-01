// Generate a mirrored path from the top base to the bottom base.
// The path is produced on a grid using a seeded random walk that never
// travels more than `maxStraight` cells in the same direction.
// The top half is generated first and then mirrored so both players get
// identical layouts.
export function generatePath(seed, width, height, cell = 40, maxStraight = 5) {
  const rand = mulberry32(hashCode(seed));
  const cols = Math.floor(width / cell);
  const rows = Math.floor(height / cell);
  const cx = Math.floor(cols / 2);
  const mid = Math.floor(rows / 2);

  // random walk for the top half
  let x = cx;
  let y = 0;
  const top = [{ x, y }];
  let last = null;
  let straight = 0;
  while (y < mid) {
    let dirs = [];
    if (x > 0) dirs.push('left');
    if (x < cols - 1) dirs.push('right');
    if (y > 0) dirs.push('up');
    if (y < mid) dirs.push('down');

    if (last && straight >= maxStraight) {
      dirs = dirs.filter(d => d !== last);
    }
    if (!dirs.length) dirs.push('down');
    // bias downward to ensure progress towards the middle
    if (dirs.includes('down')) dirs.push('down');

    const move = dirs[Math.floor(rand() * dirs.length)];
    if (move === last) straight++;
    else { last = move; straight = 1; }

    if (move === 'left') x--;
    else if (move === 'right') x++;
    else if (move === 'up') y--;
    else if (move === 'down') y++;

    top.push({ x, y });
  }

  // convert to pixel coordinates
  const topPoints = top.map(p => ({
    x: p.x * cell + cell / 2,
    y: p.y * cell + cell / 2
  }));

  // mirror top half to create bottom half
  const bottomPoints = [];
  const midY = top[top.length - 1].y;
  for (let i = top.length - 2; i >= 0; i--) {
    const p = top[i];
    const my = rows - 1 - p.y;
    if (my === midY && p.x === cx) continue; // avoid duplicate center point
    bottomPoints.push({
      x: p.x * cell + cell / 2,
      y: my * cell + cell / 2
    });
  }

  return topPoints.concat(bottomPoints);
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
