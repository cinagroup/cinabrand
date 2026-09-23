import opentype from 'opentype.js';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const fontSource = {
  family: 'Geist', style: 'Regular', weight: 400, release: '1.7.2',
  path: 'sources/fonts/geist/Geist-Regular.otf',
  sha256: '16cb657f0dde448dccfe57cbe39a5b59c03cb709922a3451914495c273359f51',
  url: 'https://github.com/vercel/geist-font/releases/tag/v1.7.2',
  license: 'SIL Open Font License 1.1', licensePath: 'sources/fonts/geist/OFL.txt',
};
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const length = a => Math.hypot(...a);
const unit = a => mul(a, 1 / length(a));
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const lerp = (a, b, t) => add(mul(a, 1 - t), mul(b, t));
const f = n => Number(n.toFixed(6));
const xy = p => p.map(f).join(' ');

function point(curve, t) {
  if (curve.length === 1) return curve[0];
  return point(curve.slice(1).map((p, i) => lerp(curve[i], p, t)), t);
}
function tangent(curve, t) {
  return unit(point(curve.slice(1).map((p, i) => mul(sub(p, curve[i]), curve.length - 1)), t));
}
function split(curve, t) {
  const left = [curve[0]], right = [curve.at(-1)];
  while (curve.length > 1) {
    curve = curve.slice(1).map((p, i) => lerp(curve[i], p, t));
    left.push(curve[0]); right.unshift(curve.at(-1));
  }
  return [left, right];
}
function portion(curve, start, end) {
  if (start > end + 1e-7) throw new Error('Overlapping corner fillets');
  return split(split(curve, end)[0], end ? start / end : 0)[1];
}
function curveLength(curve) {
  let total = 0, previous = curve[0];
  for (let i = 1; i <= 32; i++) {
    const current = point(curve, i / 32);
    total += length(sub(current, previous)); previous = current;
  }
  return total;
}
function contours(commands) {
  const result = [];
  let start, previous, edges;
  const close = () => {
    if (edges && length(sub(previous, start)) > 1e-8) edges.push([previous, start]);
    previous = start;
  };
  for (const c of commands) {
    const end = [c.x, c.y];
    if (c.type === 'M') { close(); start = previous = end; edges = []; result.push(edges); }
    else if (c.type === 'Z') close();
    else {
      if (c.type === 'L') edges.push([previous, end]);
      else if (c.type === 'C') edges.push([previous, [c.x1, c.y1], [c.x2, c.y2], end]);
      else throw new Error(`Unexpected Geist outline command ${c.type}`);
      previous = end;
    }
  }
  close();
  return result;
}

// Solve the intersection of two offset curves. The resulting circle is tangent
// to both original outlines; curves outside the trimmed corner stay unchanged.
function fillet(incoming, outgoing, radius, turn) {
  const side = Math.sign(turn);
  const offset = (curve, t) => {
    const u = tangent(curve, t);
    return add(point(curve, t), mul([-u[1], u[0]], radius * side));
  };
  const distance = radius * Math.tan(Math.abs(turn) / 2);
  let t = 1 - distance / curveLength(incoming), u = distance / curveLength(outgoing);
  for (let i = 0; i < 40; i++) {
    const a = offset(incoming, t), b = offset(outgoing, u), delta = sub(a, b);
    if (length(delta) < 1e-7) {
      if (t < -1e-8 || t > 1 || u < 0 || u > 1 + 1e-8) return null;
      return { radius, turn, t: Math.max(0, t), u: Math.min(1, u), center: mul(add(a, b), 0.5) };
    }
    const h = 1e-5;
    const da = mul(sub(offset(incoming, t + h), offset(incoming, t - h)), 1 / (2 * h));
    const db = mul(sub(offset(outgoing, u - h), offset(outgoing, u + h)), 1 / (2 * h));
    const determinant = cross(da, db);
    if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-8) return null;
    t -= cross(delta, db) / determinant;
    u -= cross(da, delta) / determinant;
    if (!Number.isFinite(t + u) || t < -0.5 || t > 1.5 || u < -0.5 || u > 1.5) return null;
  }
  return null;
}

export function roundOutline(commands, radius, preservedCorners = []) {
  const metrics = [];
  let path = '';
  for (const edges of contours(commands)) {
    const count = edges.length;
    const turns = edges.map((edge, i) => {
      const a = tangent(edges[(i + count - 1) % count], 1), b = tangent(edge, 0);
      return Math.atan2(cross(a, b), dot(a, b));
    });
    const corners = turns.map((turn, i) => {
      if (Math.abs(turn) < 0.01 || preservedCorners.some(p => length(sub(p, edges[i][0])) < 1e-8)) {
        return { t: 1, u: 0, radius: 0 };
      }
      let r = radius;
      for (let tries = 0; tries < 80; tries++, r *= 0.95) {
        const corner = fillet(edges[(i + count - 1) % count], edges[i], r, turn);
        if (corner) return corner;
      }
      throw new Error(`Cannot construct a tangent corner at ${edges[i][0]} (turn ${turn})`);
    });
    // Adjacent arcs may consume the same short edge (G bar, A apex, N joint).
    // Reduce only the participating radii until their tangent points fit.
    for (let pass = 0; pass < 120; pass++) {
      let changed = false;
      for (let i = 0; i < count; i++) {
        const next = (i + 1) % count;
        if (corners[i].u <= corners[next].t + 1e-8) continue;
        for (const j of [i, next]) {
          if (!corners[j].radius) continue;
          const updated = fillet(edges[(j + count - 1) % count], edges[j], corners[j].radius * 0.97, turns[j]);
          if (!updated) throw new Error('Cannot resolve adjacent fillets');
          corners[j] = updated;
        }
        changed = true;
      }
      if (!changed) break;
      if (pass === 119) throw new Error('Corner fitting did not converge');
    }
    path += `M${xy(point(edges[0], corners[0].u))}`;
    for (let i = 0; i < count; i++) {
      const next = (i + 1) % count, corner = corners[next];
      const segment = portion(edges[i], corners[i].u, corner.t);
      path += segment.length === 2 ? `L${xy(segment[1])}` : `C${segment.slice(1).map(xy).join(' ')}`;
      if (corner.radius) {
        const from = segment.at(-1), to = point(edges[next], corner.u);
        path += `A${f(corner.radius)} ${f(corner.radius)} 0 0 ${corner.turn > 0 ? 1 : 0} ${xy(to)}`;
        metrics.push({ ...corner, from, to, incomingTangent: tangent(edges[i], corner.t), outgoingTangent: tangent(edges[next], corner.u) });
      }
    }
    path += 'Z';
  }
  return { path, metrics };
}

export async function createGeistWordmark(root) {
  const bytes = await readFile(resolve(root, fontSource.path));
  if (createHash('sha256').update(bytes).digest('hex') !== fontSource.sha256) throw new Error('Pinned Geist font has changed');
  const font = opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  const original = font.getPath('CINAGROUP', 0, 0, font.unitsPerEm, { kerning: true });
  const stem = font.charToGlyph('I').getBoundingBox();
  const strokeWidth = stem.x2 - stem.x1;
  const radius = strokeWidth / 2;
  // Keep N's two acute inner joins exactly at their original vertices. Other
  // corners, including N's outer terminals, retain the existing rounding.
  const preservedCorners = [];
  const nIndex = font.charToGlyph('N').index;
  font.forEachGlyph('CINAGROUP', 0, 0, font.unitsPerEm, { kerning: true }, (glyph, x, y, size, options) => {
    if (glyph.index !== nIndex) return;
    for (const edges of contours(glyph.getPath(x, y, size, options, font).commands)) {
      edges.forEach((edge, i) => {
        const a = tangent(edges[(i + edges.length - 1) % edges.length], 1), b = tangent(edge, 0);
        if (Math.atan2(cross(a, b), dot(a, b)) > Math.PI / 2) preservedCorners.push(edge[0]);
      });
    }
  });
  if (preservedCorners.length !== 2) throw new Error('Expected exactly two acute inner corners in Geist N');
  const rounded = roundOutline(original.commands, radius, preservedCorners);
  const box = original.getBoundingBox();
  const width = box.x2 - box.x1, height = box.y2 - box.y1;
  const viewBox = [box.x1, box.y1, width, height].map(f).join(' ');
  const svg = (color = '#000000') => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}"><title>CINAGROUP — rounded Geist Regular</title><path fill="${color}" d="${rounded.path}"/></svg>`;
  return { ...rounded, original, width, height, viewBox, svg, preservedCorners,
    metadata: { ...fontSource, text: 'CINAGROUP', unitsPerEm: font.unitsPerEm, referenceStroke: 'uppercase I vertical stem', strokeWidthUnits: strokeWidth, cornerRadiusRatio: 0.5, cornerRadiusUnits: radius, cornerCount: rounded.metrics.length, locallyReducedCorners: rounded.metrics.filter(m => m.radius < radius - 1e-6).length, rounding: 'tangent circular fillets; locally reduced where adjacent corners would overlap', sharpCornerExceptions: [{ glyph: 'N', corners: 'upper and lower inner acute joins', count: 2 }], kerning: true },
  };
}
