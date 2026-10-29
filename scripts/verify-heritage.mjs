import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { createGeistWordmark, roundOutline } from './geist-wordmark.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFile(resolve(root, path));
const json = async path => JSON.parse(await read(path));
const hash = data => createHash('sha256').update(data).digest('hex');
const pixels = buffer => sharp(buffer).ensureAlpha().raw().toBuffer();
const visiblePixels = async buffer => {
  const rgba = await pixels(buffer);
  for (let i = 0; i < rgba.length; i += 4) if (!rgba[i + 3]) rgba[i] = rgba[i + 1] = rgba[i + 2] = 0;
  return rgba;
};
const manifest = await json('assets/heritage/manifest.json');
const brand = await json('brand.json');
const pkg = await json('package.json');
const geist = await createGeistWordmark(root);
assert.deepEqual(manifest.typography.english, geist.metadata);
assert.deepEqual(brand.typography.english, {
  family: 'Geist', style: 'Regular', weight: 400, cornerRadiusRatio: 0.5,
  referenceStroke: 'uppercase I vertical stem',
  sharpCornerExceptions: ['N upper and lower inner acute joins'],
});
assert.equal(geist.metadata.strokeWidthUnits, 86);
assert.equal(geist.metadata.cornerRadiusUnits, 43);
assert.deepEqual(geist.preservedCorners, [[1133, -612], [1520, -86]], 'N must preserve its original upper and lower inner vertices');
for (const [x, y] of geist.preservedCorners) {
  assert(geist.path.includes(`L${x} ${y}L`), 'N acute vertex must connect two straight segments without an arc');
}
assert(geist.metrics.length > 0, 'English corners must actually be rounded');
for (const corner of geist.metrics) {
  assert(corner.radius > 0 && corner.radius <= 43);
  for (const [p, tangent] of [[corner.from, corner.incomingTangent], [corner.to, corner.outgoingTangent]]) {
    const radial = p.map((n, i) => n - corner.center[i]);
    assert(Math.abs(Math.hypot(...radial) - corner.radius) < 1e-5, 'Fillet must have the declared radius');
    assert(Math.abs(radial[0] * tangent[0] + radial[1] * tangent[1]) < 1e-5, 'Fillet must meet the original curve tangentially');
  }
}
// At exactly half a rectangular stem's width, the two top arcs must meet
// without a flat edge, overlap, or a reduced radius (a semicircular cap).
const capsule = roundOutline([
  { type: 'M', x: 0, y: 0 }, { type: 'L', x: 86, y: 0 },
  { type: 'L', x: 86, y: 710 }, { type: 'L', x: 0, y: 710 }, { type: 'Z' },
], 43);
assert.equal(capsule.metrics.length, 4);
assert(capsule.metrics.every(m => m.radius === 43));
for (const m of capsule.metrics) {
  assert(Math.abs(m.center[0] - 43) < 1e-8);
  assert(Math.min(Math.abs(m.center[1] - 43), Math.abs(m.center[1] - 667)) < 1e-8);
}
assert.equal(manifest.version, brand.assetVersion);
assert.equal(pkg.version, brand.assetVersion);
assert.equal(brand.brand.wordmark, 'CINAGROUP');
assert.equal(manifest.rules.cornerRadiusRatio, 12 / 256);
assert.deepEqual(manifest.rules.cornerRadiusReference, { sizePx: 256, radiusPx: 12 });
assert.equal(brand.visual.cornerRadiusRatio, manifest.rules.cornerRadiusRatio);
assert.deepEqual(brand.visual.cornerRadiusReference, manifest.rules.cornerRadiusReference);
const product = await json('products/cinaseek/brand.json');
assert.equal(product.visual.logoCornerRadiusRatio, manifest.rules.cornerRadiusRatio);
const productCss = (await read('products/cinaseek/tokens.css')).toString();
assert.equal(Number(productCss.match(/--cinaseek-brand-logo-radius:\s*([\d.]+)%/)[1]) / 100, manifest.rules.cornerRadiusRatio);
const checksums = new Set((await read('checksums.sha256')).toString().trim().split('\n').map(line => line.slice(66)));
const source = await read(manifest.source.path);
assert.equal(hash(source), '78a54b7a5a654d20acf292a6188c4303597633b42d6899b1c7197b51fa9c2a5d');
assert.equal(hash(source), manifest.source.sha256);
const sourcePixels = await pixels(await sharp(source).extract(manifest.source.symbolRect).png().toBuffer());
const symbol = await read('assets/heritage/cinagroup-symbol-source.png');
assert.deepEqual(await pixels(symbol), sourcePixels, 'The left graphic must retain every source pixel');
assert.deepEqual(await pixels(await read('assets/icons/app/cinagroup-app-icon-1024.png')), sourcePixels);

const glyphs = await Promise.all(['zh', 'en'].map(async language => {
  const bytes = await read(`assets/heritage/cinagroup-wordmark-${language}.png`);
  const meta = await sharp(bytes).metadata();
  const rgba = await pixels(bytes);
  assert(rgba.some((value, i) => i % 4 === 3 && value === 0), 'Lettering must have a transparent background');
  assert(rgba.some((value, i) => i % 4 === 3 && value === 255), 'Lettering must retain opaque strokes');
  return { bytes, meta, rgba };
}));
const chinese = glyphs[0];
assert.deepEqual([chinese.meta.width, chinese.meta.height], [2027, 493]);
assert.deepEqual(manifest.source.chineseRect, { left: 1120, top: 110, width: 2040, height: 510 });
// Compare the Chinese silhouette directly with the approved source, so replacing
// every generated Chinese export with the same incorrect lettering cannot pass.
const crop = await sharp(source).extract(manifest.source.chineseRect).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const originalChinese = Buffer.alloc(crop.info.width * crop.info.height * 4);
for (let i = 0; i < crop.info.width * crop.info.height; i++) {
  const p = i * crop.info.channels;
  originalChinese[i * 4 + 3] = 255 - Math.round((crop.data[p] + crop.data[p + 1] + crop.data[p + 2]) / 3);
}
const originalChinesePixels = await sharp(originalChinese, { raw: { width: crop.info.width, height: crop.info.height, channels: 4 } })
  .trim({ threshold: 0 }).ensureAlpha().raw().toBuffer();
assert.deepEqual(chinese.rgba, originalChinesePixels, 'Chinese lettering must retain the approved source silhouette and black ink');

async function verifyLettering(bitmap, reversed, name, glyph = chinese) {
  const meta = await sharp(bitmap).metadata();
  assert.deepEqual([meta.width, meta.height], [glyph.meta.width, glyph.meta.height], `Lettering dimensions differ: ${name}`);
  const actual = await pixels(bitmap);
  const ink = reversed ? 255 : 0;
  for (let i = 0; i < actual.length; i += 4) {
    assert.equal(actual[i + 3], glyph.rgba[i + 3], `Lettering changed its source silhouette: ${name}`);
    if (!actual[i + 3]) continue;
    assert.equal(actual[i], ink, name); assert.equal(actual[i + 1], ink, name); assert.equal(actual[i + 2], ink, name);
  }
}

const chineseLayouts = {
  chinese: { width: 3328, height: 1152, tile: [64, 64, 1024], lettering: [1248, (1152 - 2016 * 493 / 2027) / 2, 2016] },
  'chinese-stacked': { width: 1408, height: 1472, tile: [224, 64, 960], lettering: [112, 1112, 1184] },
};
const chineseLayoutName = path => path.match(/cinagroup-(chinese(?:-stacked)?)(?:-white)?\.svg$/)?.[1];

// Measure the rasterized edge as well as the declared radius. Fractional radii
// on tiny icons cover part of a corner pixel rather than making it fully clear.
async function verifyRoundedEdge(bytes, size, radius, name, frame) {
  const tile = frame ? await sharp(bytes).extract({ left: frame.x, top: frame.y, width: size, height: size }).png().toBuffer() : bytes;
  const rgba = await pixels(tile);
  const a = (x, y) => rgba[(y * size + x) * 4 + 3];
  const end = size - 1;
  for (const [x, y] of [[0, 0], [end, 0], [0, end], [end, end]]) {
    assert(a(x, y) < 255, `Square corner in ${name}`);
    if (radius >= 3) assert(a(x, y) < 16, `Opaque outer corner in ${name}`);
  }
  const solid = Math.ceil(radius);
  for (const [x, y] of [[solid, 0], [0, solid], [end - solid, end], [end, end - solid]]) assert.equal(a(x, y), 255, `Radius too large in ${name}`);
  const measuredEdge = Array.from({ length: solid + 1 }, (_, x) => x).find(x => a(x, 0) >= 128);
  const expectedEdge = Math.max(0, radius - Math.sqrt(radius - 0.25) - 0.5);
  assert(Math.abs(measuredEdge - expectedEdge) <= 1.5, `Raster radius does not match ${radius}px in ${name}`);
  assert.equal(a(Math.floor(size / 2), Math.floor(size / 2)), 255, `Transparent interior in ${name}`);
}

const seen = new Set();
for (const asset of manifest.assets) {
  assert(!seen.has(asset.path), `Duplicate asset: ${asset.path}`);
  seen.add(asset.path);
  assert(checksums.has(asset.path), `Missing checksum: ${asset.path}`);
  const bytes = await read(asset.path);
  assert.equal(hash(bytes), asset.sha256, asset.path);
  if (asset.format === 'png') {
    const meta = await sharp(bytes).metadata();
    assert.deepEqual([meta.width, meta.height], [asset.width, asset.height], asset.path);
    if (asset.cornerRadiusPx > 0) {
      const size = asset.symbolFrame?.size ?? asset.width;
      const legacy = asset.role === 'legacy-fixed-3px';
      assert.equal(asset.cornerRadiusPx, legacy ? 3 : size * 12 / 256, asset.path);
      if (!legacy) assert.equal(asset.cornerRadiusRatio, 12 / 256, asset.path);
      await verifyRoundedEdge(bytes, size, asset.cornerRadiusPx, asset.path, asset.symbolFrame);
    }
  }
  if (asset.format === 'svg') {
    const svg = bytes.toString();
    assert(!/<(?:script|text|foreignObject)\b/i.test(svg), 'Logo SVG must use fixed artwork without runtime fonts or scripts');
    if (asset.role === 'rounded-geist-lettering') {
      assert.equal(svg, geist.svg(), 'Standalone English vector must match the pinned Geist outlines');
      continue;
    }
    assert(svg.includes(`viewBox="0 0 ${asset.width} ${asset.height}"`));
    const paths = [...svg.matchAll(/<path fill="([^"]+)" d="([^"]+)"\/>/g)];
    const chineseOnly = asset.role === 'original-chinese-lettering' || !!chineseLayoutName(asset.path);
    if (chineseOnly) {
      assert(!/<path\b|data-wordmark="english"/i.test(svg), `Chinese-only SVG must not contain English or other outline paths: ${asset.path}`);
      assert.equal(asset.embeddedRaster, true, 'Chinese SVGs must declare their embedded original raster artwork');
    } else {
      assert.equal(paths.length, 1, 'Only the Geist English outline may be drawn');
      assert.equal(paths[0][2], geist.path);
      assert.equal(paths[0][1], asset.path.includes('-white.') ? '#ffffff' : '#000000');
      assert(svg.includes(`viewBox="${geist.viewBox}"`));
    }
    if (asset.symbolFrame) {
      const radius = asset.symbolFrame.size * 12 / 256;
      assert.equal(asset.cornerRadiusPx, radius);
      assert.equal(asset.cornerRadiusRatio, 12 / 256);
      assert(svg.includes(`rx="${radius}" ry="${radius}"`), `SVG radius differs: ${asset.path}`);
    }
    const embedded = [...svg.matchAll(/xlink:href="([^"]+)"/g)].map(match => {
      assert(match[1].startsWith('data:image/png;base64,'), 'SVG must not rely on external image resources');
      return Buffer.from(match[1].split(',')[1], 'base64');
    });
    assert(embedded.length >= 1 && embedded.length <= 3);
    if (chineseOnly) assert.equal(embedded.length, asset.symbolFrame ? 2 : 1, `Unexpected Chinese SVG artwork: ${asset.path}`);
    if (asset.symbolFrame) assert.equal(hash(embedded[0]), hash(symbol), `SVG must preserve the approved full-color symbol: ${asset.path}`);
    for (const bitmap of embedded) {
      if (hash(bitmap) === hash(symbol)) {
        assert(asset.symbolFrame, `Standalone Chinese wordmark must not include a symbol: ${asset.path}`);
        continue;
      }
      const meta = await sharp(bitmap).metadata();
      const glyph = glyphs.find(candidate => candidate.meta.width === meta.width && candidate.meta.height === meta.height);
      assert(glyph, 'Unexpected artwork in SVG');
      if (chineseOnly) assert.equal(glyph, chinese, `Chinese SVG must embed only the original Chinese lettering: ${asset.path}`);
      await verifyLettering(bitmap, asset.path.includes('-white.'), asset.path, glyph);
    }
    // Check actual artwork geometry, including equal-width bilingual rows.
    const boxes = [...svg.matchAll(/<(?:image|svg data-wordmark="english") x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)]
      .map(match => match.slice(1).map(Number));
    for (const [x, y, width, height] of boxes) {
      assert(x >= 0 && y >= 0 && width > 0 && height > 0 && x + width <= asset.width && y + height <= asset.height, `Clipped artwork in ${asset.path}`);
    }
    if (asset.symbolFrame) {
      const { x, y, size } = asset.symbolFrame;
      assert.deepEqual(boxes[0], [x, y, size, size], `Symbol frame differs: ${asset.path}`);
    }
    if (chineseOnly) {
      const name = chineseLayoutName(asset.path);
      const expected = name ? chineseLayouts[name] : { width: 2027, height: 493, lettering: [0, 0, 2027] };
      assert.deepEqual([asset.width, asset.height], [expected.width, expected.height], asset.path);
      const [x, y, width] = expected.lettering;
      const actual = boxes.at(-1);
      assert.equal(boxes.length, name ? 2 : 1, `Unexpected artwork geometry: ${asset.path}`);
      const wanted = [x, y, width, width * chinese.meta.height / chinese.meta.width];
      actual.forEach((value, i) => assert(Math.abs(value - wanted[i]) < 1e-8, `Chinese layout differs: ${asset.path}`));
      if (name) assert.deepEqual(boxes[0], [...expected.tile.slice(0, 2), expected.tile[2], expected.tile[2]], asset.path);
      else assert.equal(asset.symbolFrame, undefined, 'Standalone Chinese lettering must not have a symbol');
      assert.deepEqual(await visiblePixels(await read(asset.path.replace(/\.svg$/, '.png'))), await visiblePixels(bytes), `Chinese PNG must match its SVG: ${asset.path}`);
    }
    if (/cinagroup-(horizontal|stacked|wordmark)(-white)?\.svg$/.test(asset.path)) {
      const [chineseBox, englishBox] = boxes.slice(-2);
      assert.equal(chineseBox[0], englishBox[0], `Bilingual left edges differ: ${asset.path}`);
      assert.equal(chineseBox[2], englishBox[2], `Bilingual widths differ: ${asset.path}`);
      for (const [index, box] of [chineseBox, englishBox].entries()) {
        const meta = index === 0 ? glyphs[0].meta : geist;
        assert(Math.abs(box[2] / box[3] - meta.width / meta.height) < 1e-8, `Distorted wordmark: ${asset.path}`);
      }
      assert(englishBox[1] > chineseBox[1] + chineseBox[3], `Overlapping wordmarks: ${asset.path}`);
    }
  }
  if (asset.format === 'ico') {
    assert.equal(asset.cornerRadiusRatio, 12 / 256);
    assert.equal(bytes.readUInt16LE(4), asset.sizes.length);
    let end = 6 + asset.sizes.length * 16;
    for (let i = 0; i < asset.sizes.length; i++) {
      const entry = 6 + 16 * i;
      const length = bytes.readUInt32LE(entry + 8);
      const offset = bytes.readUInt32LE(entry + 12);
      assert.equal(offset, end);
      assert(offset + length <= bytes.length);
      const meta = await sharp(bytes.subarray(offset, offset + length)).metadata();
      assert.deepEqual([meta.width, meta.height], [asset.sizes[i], asset.sizes[i]]);
      await verifyRoundedEdge(bytes.subarray(offset, offset + length), meta.width, meta.width * 12 / 256, `${asset.path}:${meta.width}`);
      end = offset + length;
    }
    assert.equal(end, bytes.length);
  }
}
for (const size of [16, 24, 32, 48, 64, 96, 128, 180, 192, 256, 512, 1024]) assert(seen.has(`assets/icons/rounded/cinagroup-${size}.png`));
for (const [name, layout] of Object.entries(chineseLayouts)) {
  for (const suffix of ['', '-white']) {
    for (const ending of ['.svg', '.png', `-${layout.width / 4}.png`]) assert(seen.has(`assets/heritage/cinagroup-${name}${suffix}${ending}`), `Missing Chinese lockup: ${name}${suffix}${ending}`);
  }
}
for (const suffix of ['', '-white']) {
  for (const ending of ['.svg', '.png', '-512.png']) {
    const path = `assets/heritage/cinagroup-wordmark-zh${suffix}${ending}`;
    assert(seen.has(path), `Missing independent Chinese wordmark: ${path}`);
    assert.equal(manifest.assets.find(asset => asset.path === path).role, 'original-chinese-lettering', path);
  }
  await verifyLettering(await read(`assets/heritage/cinagroup-wordmark-zh${suffix}.png`), !!suffix, 'standalone Chinese PNG');
}
assert(seen.has('assets/heritage/preview-chinese.png'), 'Missing Chinese kit preview');
// Reverse lettering must change only ink; all alpha and full-color symbol pixels
// must remain identical at native and small export sizes.
for (const [name, layout] of [...Object.entries(chineseLayouts), ['wordmark-zh', { width: 2027, height: 493 }]]) {
  for (const ending of ['.png', `-${name === 'wordmark-zh' ? 512 : layout.width / 4}.png`]) {
    const stem = `assets/heritage/cinagroup-${name}`;
    const normal = await read(stem + ending);
    const reversed = await read(stem + '-white' + ending);
    const meta = await sharp(normal).metadata();
    const reversedMeta = await sharp(reversed).metadata();
    const expectedWidth = ending === '.png' ? layout.width : name === 'wordmark-zh' ? 512 : layout.width / 4;
    const expectedSize = [expectedWidth, Math.round(layout.height * expectedWidth / layout.width)];
    assert.deepEqual([meta.width, meta.height], expectedSize, stem + ending);
    assert.deepEqual([reversedMeta.width, reversedMeta.height], expectedSize, stem + '-white' + ending);
    const a = await pixels(normal), b = await pixels(reversed);
    assert.equal(a.length, b.length, `Reverse lettering dimensions differ: ${stem}${ending}`);
    const scale = meta.width / layout.width;
    const frame = layout.tile?.map(value => value * scale);
    if (name === 'wordmark-zh' && ending === '-512.png') {
      assert.deepEqual([meta.width, meta.height], [512, 125]);
      assert.deepEqual(a, await pixels(await sharp(chinese.bytes).resize({ width: 512 }).png().toBuffer()), 'Small Chinese wordmark must be a proportional source resize');
    }
    for (let i = 0; i < a.length; i += 4) {
      assert.equal(a[i + 3], b[i + 3], `Reverse lettering changed alpha: ${stem}${ending}`);
      const x = (i / 4) % meta.width, y = Math.floor(i / 4 / meta.width);
      const inSymbol = frame && x >= frame[0] && y >= frame[1] && x < frame[0] + frame[2] && y < frame[1] + frame[2];
      if (inSymbol) {
        assert.equal(a[i], b[i], stem); assert.equal(a[i + 1], b[i + 1], stem); assert.equal(a[i + 2], b[i + 2], stem);
      } else if (a[i + 3]) {
        assert.equal(a[i], 0, stem); assert.equal(a[i + 1], 0, stem); assert.equal(a[i + 2], 0, stem);
        assert.equal(b[i], 255, stem); assert.equal(b[i + 1], 255, stem); assert.equal(b[i + 2], 255, stem);
      }
    }
  }
}
console.log(`Verified ${seen.size} heritage exports: original symbol and Chinese silhouette, Chinese-only layouts and reversed ink, PNG/SVG agreement, Geist outlines and tangent half-stroke fillets, equal bilingual widths, proportional tile corners, SVG bounds and ICO payloads.`);
