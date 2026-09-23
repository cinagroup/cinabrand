import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFile(resolve(root, path));
const json = async path => JSON.parse(await read(path));
const hash = data => createHash('sha256').update(data).digest('hex');
const pixels = buffer => sharp(buffer).ensureAlpha().raw().toBuffer();
const manifest = await json('assets/heritage/manifest.json');
const brand = await json('brand.json');
const pkg = await json('package.json');
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
    assert(!/<(?:script|text|foreignObject|path)\b/i.test(svg), 'Logo SVG must embed approved artwork without font substitution or redrawing');
    assert(svg.includes(`viewBox="0 0 ${asset.width} ${asset.height}"`));
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
    for (const bitmap of embedded) {
      if (hash(bitmap) === hash(symbol)) continue;
      const meta = await sharp(bitmap).metadata();
      const glyph = glyphs.find(candidate => candidate.meta.width === meta.width && candidate.meta.height === meta.height);
      assert(glyph, 'Unexpected artwork in SVG');
      const actual = await pixels(bitmap);
      for (let i = 3; i < actual.length; i += 4) assert.equal(actual[i], glyph.rgba[i], 'Embedded lettering changed its source silhouette');
      const ink = asset.path.includes('-white.') ? 255 : 0;
      for (let i = 0; i < actual.length; i += 4) {
        if (!actual[i + 3]) continue;
        assert.equal(actual[i], ink); assert.equal(actual[i + 1], ink); assert.equal(actual[i + 2], ink);
      }
    }
    // Check actual artwork geometry, including equal-width bilingual rows.
    const boxes = [...svg.matchAll(/<image x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)]
      .map(match => match.slice(1).map(Number));
    for (const [x, y, width, height] of boxes) {
      assert(x + width <= asset.width && y + height <= asset.height, `Clipped artwork in ${asset.path}`);
    }
    if (asset.symbolFrame) {
      const { x, y, size } = asset.symbolFrame;
      assert.deepEqual(boxes[0], [x, y, size, size], `Symbol frame differs: ${asset.path}`);
    }
    if (/cinagroup-(horizontal|stacked|wordmark)(-white)?\.svg$/.test(asset.path)) {
      const [chineseBox, englishBox] = boxes.slice(-2);
      assert.equal(chineseBox[0], englishBox[0], `Bilingual left edges differ: ${asset.path}`);
      assert.equal(chineseBox[2], englishBox[2], `Bilingual widths differ: ${asset.path}`);
      for (const [index, box] of [chineseBox, englishBox].entries()) {
        const meta = glyphs[index].meta;
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
console.log(`Verified ${seen.size} heritage exports: original symbol pixels, embedded lettering, equal bilingual widths, proportional rounded edges, SVG bounds and ICO payloads.`);
