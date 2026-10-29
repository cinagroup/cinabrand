import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import opentype from 'opentype.js';
import { fontSource } from './geist-wordmark.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFile(resolve(root, path));
const json = async path => JSON.parse(await read(path));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const pixels = bytes => sharp(bytes).ensureAlpha().raw().toBuffer();
const attributes = markup => Object.fromEntries([...markup.matchAll(/([\w:-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
const boxOf = attrs => ['x', 'y', 'width', 'height'].map(name => Number(attrs[name]));
const sameBox = (actual, expected, name) => {
  assert.equal(actual.length, expected.length, name);
  actual.forEach((value, i) => assert(Number.isFinite(value) && Math.abs(value - expected[i]) < 1e-8, `Artwork geometry differs: ${name}`));
};
const inBounds = (box, width, height, name) => {
  const [x, y, w, h] = box;
  assert(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= width && y + h <= height, `Clipped artwork: ${name}`);
};
const separate = (a, b) => a[0] + a[2] <= b[0] || b[0] + b[2] <= a[0] || a[1] + a[3] <= b[1] || b[1] + b[3] <= a[1];
const crop = { left: 0, top: 0, width: 981, height: 493 };
const radiusRatio = 12 / 256;
const layouts = {
  horizontal: { width: 2432, height: 1152, tile: [64, 64, 1024], lettering: [1312, 329.5, 981], marks: [{ owner: 'symbol', x: 1104, y: 64, size: 80 }, { owner: 'lettering', x: 2309, y: 297.5, size: 64 }] },
  stacked: { width: 1408, height: 1792, tile: [224, 64, 960], lettering: [112, 1112, 1184], marks: [{ owner: 'symbol', x: 1200, y: 64, size: 80 }, { owner: 'lettering', x: 1312, y: 1084, size: 56 }] },
  wordmark: { width: 1216, height: 640, lettering: [64, 80, 981], marks: [{ owner: 'lettering', x: 1061, y: 48, size: 64 }] },
  symbol: { width: 1280, height: 1280, tile: [128, 128, 1024], marks: [{ owner: 'symbol', x: 1168, y: 96, size: 80 }] },
};
const manifestBytes = await read('assets/hainei/manifest.json');
const manifest = JSON.parse(manifestBytes);
const brand = await json('brand.json');
const pkg = await json('package.json');
assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.wordmark, '海内');
assert.equal(manifest.version, brand.assetVersion);
assert.equal(manifest.version, pkg.version);
assert.equal(brand.haineiManifest, 'assets/hainei/manifest.json');
assert.equal(pkg.exports['./hainei'], './assets/hainei/manifest.json');
assert.equal(manifest.source.path, 'assets/heritage/cinagroup-wordmark-zh.png');
assert.deepEqual(manifest.source.crop, crop);
const source = await read(manifest.source.path);
assert.equal(hash(source), manifest.source.sha256);
const sourceMeta = await sharp(source).metadata();
assert.deepEqual([sourceMeta.width, sourceMeta.height], [2027, 493]);
const original = await sharp(source).extract(crop).png().toBuffer();
const originalPixels = await pixels(original);
const cropped = await read('assets/hainei/hainei-wordmark-source.png');
assert.deepEqual(await pixels(cropped), originalPixels, '海内 must be the unaltered first two characters of the approved Chinese lettering');
const symbol = await read('assets/heritage/cinagroup-symbol-source.png');
const approved = await read('sources/heritage/cinagroup_20251026.png');
assert.equal(hash(approved), '78a54b7a5a654d20acf292a6188c4303597633b42d6899b1c7197b51fa9c2a5d');
assert.deepEqual(await pixels(symbol), await sharp(approved).extract({ left: 0, top: 0, width: 1024, height: 1024 }).ensureAlpha().raw().toBuffer(), 'The 海内 kit must retain the approved full-color symbol');

const fontBytes = await read(fontSource.path);
assert.equal(hash(fontBytes), fontSource.sha256);
const font = opentype.parse(fontBytes.buffer.slice(fontBytes.byteOffset, fontBytes.byteOffset + fontBytes.byteLength));
assert(font.charToGlyph('®').index, 'Pinned Geist must contain the registered-mark glyph');
const registeredPath = font.getPath('®', 0, 0, font.unitsPerEm, { kerning: true });
const bounds = registeredPath.getBoundingBox();
const registeredViewBox = [bounds.x1, bounds.y1, bounds.x2 - bounds.x1, bounds.y2 - bounds.y1].map(value => Number(value.toFixed(6))).join(' ');
const outline = registeredPath.toPathData(6);
assert.equal(manifest.registration.symbol, '®');
assert.deepEqual(manifest.registration.font, fontSource);
assert.equal(manifest.registration.viewBox, registeredViewBox);
assert.equal(manifest.registration.placement, 'upper-right-outside-artwork');

const checksums = new Map((await read('checksums.sha256')).toString().trim().split('\n').map(line => [line.slice(66), line.slice(0, 64)]));
assert.equal(checksums.get('assets/hainei/manifest.json'), hash(manifestBytes), 'Missing or stale 海内 manifest checksum');
const expected = new Map();
const variants = [];
for (const [name, layout] of Object.entries(layouts)) {
  for (const registered of [false, true]) {
    for (const reversed of [false, true]) {
      if (name === 'symbol' && !registered && reversed) continue;
      const stem = `assets/hainei/hainei-${name}${registered ? '-registered' : ''}${reversed ? '-white' : ''}`;
      const variant = { name, layout, registered, reversed, stem };
      variants.push(variant);
      for (const [ending, scale] of [['.svg', 1], ['.png', 1], [`-${layout.width / 4}.png`, 0.25]]) expected.set(stem + ending, { ...variant, scale });
    }
  }
}
assert.equal(expected.size, 45);
const seen = new Set();
for (const asset of manifest.assets) {
  assert(!seen.has(asset.path), `Duplicate 海内 export: ${asset.path}`);
  seen.add(asset.path);
  const bytes = await read(asset.path);
  assert.equal(hash(bytes), asset.sha256, asset.path);
  assert.equal(checksums.get(asset.path), asset.sha256, `Missing or stale checksum: ${asset.path}`);
  if (asset.format === 'png') {
    const meta = await sharp(bytes).metadata();
    assert.deepEqual([meta.width, meta.height], [asset.width, asset.height], asset.path);
  }
  if (asset.path === 'assets/hainei/hainei-wordmark-source.png') {
    assert.equal(asset.role, 'original-hainei-lettering');
    assert.deepEqual([asset.width, asset.height], [981, 493]);
    continue;
  }
  if (asset.path === 'assets/hainei/preview.png') {
    assert.equal(asset.role, 'preview');
    assert.deepEqual([asset.width, asset.height], [1600, 1920]);
    continue;
  }
  const variant = expected.get(asset.path);
  assert(variant, `Unexpected 海内 export: ${asset.path}`);
  const { name, layout, registered, reversed, scale } = variant;
  assert.equal(asset.format, asset.path.endsWith('.svg') ? 'svg' : 'png', asset.path);
  assert.equal(asset.layout, name, asset.path);
  assert.equal(asset.registered, registered, asset.path);
  assert.equal(asset.tone, reversed ? 'white' : 'black', asset.path);
  assert.deepEqual([asset.width, asset.height], [layout.width * scale, layout.height * scale], asset.path);
  const artwork = new Map();
  if (layout.tile) {
    const [x, y, size] = layout.tile.map(value => value * scale);
    assert.deepEqual(asset.symbolFrame, { x, y, size }, asset.path);
    assert.equal(asset.cornerRadiusRatio, radiusRatio, asset.path);
    assert.equal(asset.cornerRadiusPx, size * radiusRatio, asset.path);
    artwork.set('symbol', [x, y, size, size]);
  } else {
    assert.equal(asset.symbolFrame, undefined, asset.path);
    assert.equal(asset.cornerRadiusPx, undefined, asset.path);
  }
  if (layout.lettering) {
    const [x, y, width] = layout.lettering.map(value => value * scale);
    const height = width * crop.height / crop.width;
    assert.deepEqual(asset.letteringFrame, { x, y, width, height }, asset.path);
    artwork.set('lettering', [x, y, width, height]);
  } else assert.equal(asset.letteringFrame, undefined, asset.path);
  const marks = registered ? layout.marks.map(mark => ({ owner: mark.owner, x: mark.x * scale, y: mark.y * scale, size: mark.size * scale })) : [];
  assert.deepEqual(asset.registrationMarks, marks, asset.path);
  for (const box of artwork.values()) inBounds(box, asset.width, asset.height, asset.path);
  for (const mark of marks) {
    const box = [mark.x, mark.y, mark.size, mark.size];
    inBounds(box, asset.width, asset.height, asset.path);
    for (const component of artwork.values()) assert(separate(box, component), `Registered mark overlaps artwork: ${asset.path}`);
    const owner = artwork.get(mark.owner);
    assert(owner && mark.x >= owner[0] + owner[2] + 16 * scale && mark.y <= owner[1], `Registered mark must sit outside its owner's upper-right edge: ${asset.path}`);
  }
  if (asset.format !== 'svg') continue;
  const svg = bytes.toString();
  assert.equal(asset.embeddedRaster, true, asset.path);
  assert(!/<(?:script|text|style|foreignObject)\b/i.test(svg), `Logo must not depend on runtime fonts or scripts: ${asset.path}`);
  const outer = attributes(svg.match(/^<svg\b([^>]*)>/)[1]);
  assert.equal(outer.viewBox, `0 0 ${asset.width} ${asset.height}`, asset.path);
  assert.deepEqual([Number(outer.width), Number(outer.height)], [asset.width, asset.height], asset.path);
  const images = [...svg.matchAll(/<image\b([^>]*)\/>/g)].map(match => attributes(match[1]));
  assert.equal(images.length, artwork.size, asset.path);
  const owners = new Set();
  for (const image of images) {
    const owner = image['data-artwork'];
    assert(artwork.has(owner) && !owners.has(owner), `Unexpected or duplicate artwork: ${asset.path}`);
    owners.add(owner);
    sameBox(boxOf(image), artwork.get(owner), asset.path);
    assert(image['xlink:href'].startsWith('data:image/png;base64,'), `SVG image must be self-contained: ${asset.path}`);
    const bitmap = Buffer.from(image['xlink:href'].split(',')[1], 'base64');
    if (owner === 'symbol') {
      assert.equal(hash(bitmap), hash(symbol), `SVG changed the approved full-color symbol: ${asset.path}`);
      assert.equal(image['clip-path'], 'url(#tile-corners)', asset.path);
    } else {
      const meta = await sharp(bitmap).metadata();
      assert.deepEqual([meta.width, meta.height], [981, 493], asset.path);
      const actual = await pixels(bitmap);
      for (let i = 0; i < actual.length; i += 4) {
        assert.equal(actual[i + 3], originalPixels[i + 3], `海内 silhouette changed: ${asset.path}`);
        if (!actual[i + 3]) continue;
        const ink = reversed ? 255 : 0;
        assert.equal(actual[i], ink, asset.path); assert.equal(actual[i + 1], ink, asset.path); assert.equal(actual[i + 2], ink, asset.path);
      }
    }
  }
  const rectangles = [...svg.matchAll(/<rect\b([^>]*)\/>/g)].map(match => attributes(match[1]));
  assert.equal(rectangles.length, layout.tile ? 1 : 0, asset.path);
  if (layout.tile) {
    sameBox(boxOf(rectangles[0]), artwork.get('symbol'), asset.path);
    assert.equal(Number(rectangles[0].rx), asset.cornerRadiusPx, asset.path);
    assert.equal(Number(rectangles[0].ry), asset.cornerRadiusPx, asset.path);
  }
  const registrations = [...svg.matchAll(/<svg\b([^>]*data-registration="[^"]+"[^>]*)>([\s\S]*?)<\/svg>/g)];
  assert.equal(registrations.length, marks.length, `Incorrect registered-mark count: ${asset.path}`);
  const paths = [...svg.matchAll(/<path\b([^>]*)\/>/g)];
  assert.equal(paths.length, marks.length, `Only the registered glyph may use vector paths: ${asset.path}`);
  assert.equal([...svg.matchAll(/<path\b/g)].length, paths.length, asset.path);
  for (const [i, registration] of registrations.entries()) {
    const attrs = attributes(registration[1]);
    const mark = marks[i];
    assert.equal(attrs['data-registration'], mark.owner, asset.path);
    assert.equal(attrs.viewBox, registeredViewBox, asset.path);
    sameBox(boxOf(attrs), [mark.x, mark.y, mark.size, mark.size], asset.path);
    const glyphs = [...registration[2].matchAll(/<path\b([^>]*)\/>/g)];
    assert.equal(glyphs.length, 1, asset.path);
    const glyph = attributes(glyphs[0][1]);
    assert.equal(glyph.d, outline, `Registered mark must use the pinned font outline: ${asset.path}`);
    assert.equal(glyph.fill, reversed ? '#ffffff' : '#000000', asset.path);
  }
}
assert.equal(seen.size, 47, 'The 海内 kit must contain 45 exports, its source crop, and preview');
for (const path of [...expected.keys(), 'assets/hainei/hainei-wordmark-source.png', 'assets/hainei/preview.png']) assert(seen.has(path), `Missing 海内 export: ${path}`);

// Compare premultiplied color plus alpha so invisible RGB is irrelevant.
// A one-level tolerance on small SVG renders allows subpixel matrix rounding.
async function verifyRaster(actual, reference, name, tolerance = 0) {
  const normalized = async bytes => {
    const rgba = await pixels(bytes);
    for (let i = 0; i < rgba.length; i += 4) for (let c = 0; c < 3; c++) rgba[i + c] = Math.round(rgba[i + c] * rgba[i + 3] / 255);
    return rgba;
  };
  const a = await normalized(actual), b = await normalized(reference);
  assert.equal(a.length, b.length, name);
  if (!tolerance) assert.deepEqual(a, b, `PNG must match SVG artwork: ${name}`);
  else for (let i = 0; i < a.length; i++) assert(Math.abs(a[i] - b[i]) <= tolerance, `Small PNG differs from proportional SVG artwork: ${name}`);
}
for (const variant of variants) {
  const { stem, layout } = variant;
  const svg = await read(stem + '.svg');
  await verifyRaster(await read(stem + '.png'), svg, stem);
  const smallWidth = layout.width / 4, smallHeight = layout.height / 4;
  const smallSvg = svg.toString()
    .replace(/^(<svg\b[^>]*\bwidth=")[^"]+(")/, (_, before, after) => before + smallWidth + after)
    .replace(/^(<svg\b[^>]*\bheight=")[^"]+(")/, (_, before, after) => before + smallHeight + after);
  await verifyRaster(await read(`${stem}-${smallWidth}.png`), Buffer.from(smallSvg), `${stem}-${smallWidth}`, 1);
  if (variant.reversed || (variant.name === 'symbol' && !variant.registered)) continue;
  for (const ending of ['.png', `-${smallWidth}.png`]) {
    const black = await read(stem + ending), white = await read(stem + '-white' + ending);
    const alpha = buffer => sharp(buffer).ensureAlpha().extractChannel('alpha').raw().toBuffer();
    assert.deepEqual(await alpha(black), await alpha(white), `White ink changed alpha: ${stem}${ending}`);
    if (layout.tile) {
      const scale = ending === '.png' ? 1 : 0.25;
      const [left, top, size] = layout.tile.map(value => value * scale);
      const symbolPixels = buffer => sharp(buffer).extract({ left, top, width: size, height: size }).ensureAlpha().raw().toBuffer();
      assert.deepEqual(await symbolPixels(black), await symbolPixels(white), `White ink changed the full-color symbol: ${stem}${ending}`);
    }
  }
}
console.log(`Verified ${seen.size} 海内 assets: original two-character crop and full-color symbol, all plain/registered variants, pinned ® outlines and counts, separate upper-right marks, proportional layouts, SVG/PNG agreement, small sizes and checksums.`);
