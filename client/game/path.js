// Generate different types of paths based on mapType.
// All variants are mirrored vertically so both players share the same layout.
export function generatePath(seed, width, height, cell = 40, mapType = 'intermedio', startCol = null) {
  const rand = mulberry32(hashCode(seed));
  const cols = Math.floor(width / cell);
  const rows = Math.floor(height / cell);
  const cx = startCol !== null ? startCol : Math.floor(cols / 2);
  const mid = Math.floor(rows / 2);

  let top = [];
  if (mapType === 'lineal') {
    for (let y = 0; y <= mid; y++) top.push({ x: cx, y });
  } else {
    const allowUp = mapType === 'enorme';
    const maxStraight = mapType === 'intermedio' ? 3 : mapType === 'grande' ? 4 : 5;
    const visited = new Set();
    let x = cx;
    let y = 0;
    top.push({ x, y });
    visited.add(`${x},${y}`);
    let last = null;
    let straight = 0;
    while (y < mid) {
      let dirs = [];
      if (x > 1 && !visited.has(`${x-1},${y}`)) dirs.push('left');
      if (x < cols - 2 && !visited.has(`${x+1},${y}`)) dirs.push('right');
      if (y < mid && !visited.has(`${x},${y+1}`)) {
        dirs.push('down');
        dirs.push('down'); // bias downward
      }
      if (allowUp && y > 0 && !visited.has(`${x},${y-1}`)) dirs.push('up');
      if (last && straight >= maxStraight) dirs = dirs.filter(d => d !== last);
      if (!dirs.length) dirs.push('down');
      if (mapType === 'grande' || mapType === 'enorme') {
        if (dirs.includes('left')) dirs.push('left');
        if (dirs.includes('right')) dirs.push('right');
      }
      const move = dirs[Math.floor(rand() * dirs.length)];
      if (move === last) straight++; else { last = move; straight = 1; }
      if (move === 'left') x--;
      else if (move === 'right') x++;
      else if (move === 'up') y--;
      else y++;
      top.push({ x, y });
      visited.add(`${x},${y}`);
    }
  }

  const topPoints = top.map(p => ({ x: p.x * cell + cell / 2, y: p.y * cell + cell / 2 }));
  const bottomPoints = [];
  for (let i = top.length - 2; i >= 0; i--) {
    const p = top[i];
    const my = rows - 1 - p.y;
    bottomPoints.push({ x: p.x * cell + cell / 2, y: my * cell + cell / 2 });
  }
  return topPoints.concat(bottomPoints);
}

export function generatePaths(seed, width, height, cell = 40, mapType = 'intermedio', count = 1) {
  const cols = Math.floor(width / cell);
  const positions = [];
  for (let i = 0; i < count; i++) {
    positions.push(Math.floor((i + 1) * cols / (count + 1)));
  }
  return positions.map((c, i) => generatePath(`${seed}_${i}`, width, height, cell, mapType, c));
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return h;
}

function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Distance from point to the polyline path
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

export function distanceToPaths(point, paths) {
  let min = Infinity;
  for (const p of paths) {
    const d = distanceToPath(point, p);
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
