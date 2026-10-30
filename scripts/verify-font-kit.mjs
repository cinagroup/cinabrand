import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import sharp from 'sharp';
import { fangsongFontSource } from './fangsong-wordmark.mjs';
import { songtiFontSource } from './songti-wordmark.mjs';
import { fontSource } from './geist-wordmark.mjs';

const profiles = {
  fangsong: { source: fangsongFontSource, digest: '558c62730844fe54ba220146ed62f859d4e2880188d92d985f8921c6e3743bc4', glyphs: [6270, 2400], viewBox: '53 -807 1817 919', manifestKey: 'haineiFangsongManifest', ratio: 919 / 1817 },
  songti: { source: songtiFontSource, digest: '78aa7a328fd974df2d688c8a9fd74a33d8334dfa84ab24d9d11efb2ffc464117', glyphs: [23386, 10949], viewBox: '37 -837 1902 916', manifestKey: 'haineiSongtiManifest', ratio: 916 / 1902 },
};
const kind = process.argv[2];
const profile = profiles[kind];
assert(profile, 'Select a font kit: fangsong or songti');
const prefix = `hainei-${kind}`;
const folder = `assets/${prefix}`;
const chineseFontSource = profile.source;

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFile(resolve(root, path));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = async path => JSON.parse(await read(path));
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
const bounds = frame => [frame.x, frame.y, frame.size ?? frame.width, frame.size ?? frame.height];
const disjoint = (a, b) => a[0] + a[2] <= b[0] || b[0] + b[2] <= a[0] || a[1] + a[3] <= b[1] || b[1] + b[3] <= a[1];
const parseFont = async source => {
  const bytes = await read(source.path);
  assert.equal(hash(bytes), source.sha256, 'Pinned font changed');
  return opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
};
assert.equal(chineseFontSource.sha256, profile.digest);
const font = await parseFont(chineseFontSource);
assert.deepEqual(font.stringToGlyphs('海内').map(g => g.index), profile.glyphs, 'Use the actual simplified 海内 glyphs');
const lettering = font.getPath('海内', 0, 0, font.unitsPerEm, { kerning: true });
const letteringBox = lettering.getBoundingBox();
const letteringViewBox = [letteringBox.x1, letteringBox.y1, letteringBox.x2 - letteringBox.x1, letteringBox.y2 - letteringBox.y1].join(' ');
assert.equal(letteringViewBox, profile.viewBox);
const registrationFont = await parseFont(fontSource);
const registered = registrationFont.getPath('®', 0, 0, registrationFont.unitsPerEm, { kerning: true });
const registeredBox = registered.getBoundingBox();
const registeredViewBox = [registeredBox.x1, registeredBox.y1, registeredBox.x2 - registeredBox.x1, registeredBox.y2 - registeredBox.y1].join(' ');
const manifest = await json(`${folder}/manifest.json`);
const brand = await json('brand.json');
const pkg = await json('package.json');
assert.equal(manifest.wordmark, '海内');
assert.equal(manifest.version, pkg.version);
assert.equal(manifest.version, brand.assetVersion);
assert.equal(brand[profile.manifestKey], `${folder}/manifest.json`);
assert.equal(pkg.exports[`./${prefix}`], `./${folder}/manifest.json`);
assert.equal(manifest.source.sha256, chineseFontSource.sha256);
assert.equal(manifest.source.viewBox, letteringViewBox);
assert.deepEqual(manifest.typography.chinese, { ...chineseFontSource, text: '海内', unitsPerEm: 1000, kerning: true, glyphIndices: profile.glyphs, outlines: 'unmodified-font-paths' });
assert.deepEqual(manifest.registration.font, fontSource);
assert.equal(manifest.registration.symbol, '®');
assert((await read(chineseFontSource.licensePath)).toString().includes('SIL OPEN FONT LICENSE Version 1.1'));

const sizes = { horizontal: [2432, 1152], stacked: [1408, 1792], wordmark: [1216, 640], symbol: [1280, 1280] };
const expected = new Set();
for (const [layout, [width]] of Object.entries(sizes)) for (const r of ['', '-registered']) for (const tone of ['', '-white']) {
  if (layout === 'symbol' && !r && tone) continue;
  for (const ending of ['.png', '.svg', `-${width / 4}.png`]) expected.add(`${folder}/${prefix}-${layout}${r}${tone}${ending}`);
}
const checksums = new Map((await read('checksums.sha256')).toString().trim().split('\n').map(line => [line.slice(66), line.slice(0, 64)]));
const symbol = await read('assets/heritage/cinagroup-symbol-source.png');
const seen = new Set();
const rasters = async (actual, reference, name, tolerance = 0) => {
  const normalized = async bytes => {
    const data = await sharp(bytes).ensureAlpha().raw().toBuffer();
    for (let i = 0; i < data.length; i += 4) for (let c = 0; c < 3; c++) data[i + c] = Math.round(data[i + c] * data[i + 3] / 255);
    return data;
  };
  const a = await normalized(actual), b = await normalized(reference);
  assert.equal(a.length, b.length, name);
  if (!tolerance) assert.deepEqual(a, b, `PNG/SVG artwork differs: ${name}`);
  else for (let i = 0; i < a.length; i++) assert(Math.abs(a[i] - b[i]) <= tolerance, `Small PNG/SVG artwork differs: ${name}`);
};
for (const asset of manifest.assets) {
  assert(!seen.has(asset.path), 'Duplicate export');
  seen.add(asset.path);
  const bytes = await read(asset.path);
  assert.equal(hash(bytes), asset.sha256, asset.path);
  assert.equal(checksums.get(asset.path), asset.sha256, asset.path);
  if (asset.format === 'png') {
    const meta = await sharp(bytes).metadata();
    assert.deepEqual([meta.width, meta.height], [asset.width, asset.height], asset.path);
  }
  if (asset.role === 'preview') {
    assert.deepEqual([asset.width, asset.height], [1600, 1920]);
    continue;
  }
  if (!asset.role) {
    assert(expected.has(asset.path), asset.path);
    const scale = asset.width / sizes[asset.layout][0];
    assert([1, 0.25].includes(scale));
    assert.equal(asset.height, sizes[asset.layout][1] * scale);
    assert.equal(asset.registered, asset.path.includes('-registered'));
    assert.equal(asset.tone, asset.path.includes('-white') ? 'white' : 'black');
    const frames = [asset.symbolFrame, asset.letteringFrame].filter(Boolean);
    if (asset.letteringFrame) assert(Math.abs(asset.letteringFrame.height / asset.letteringFrame.width - profile.ratio) < 1e-12, 'Do not distort the original glyphs');
    assert.equal(asset.registrationMarks.length, asset.registered ? frames.length : 0, 'Each registered component gets its own ®');
    assert.equal(new Set(asset.registrationMarks.map(m => m.owner)).size, asset.registrationMarks.length);
    for (const frame of [...frames, ...asset.registrationMarks]) {
      const [x, y, w, h] = bounds(frame);
      assert([x, y, w, h].every(Number.isFinite) && x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= asset.width && y + h <= asset.height, 'Artwork must stay inside canvas');
    }
    for (const mark of asset.registrationMarks) {
      const owner = mark.owner === 'symbol' ? asset.symbolFrame : asset.letteringFrame;
      assert(owner && mark.x >= owner.x + (owner.size ?? owner.width) + 16 * scale && mark.y <= owner.y, '® must sit outside its own upper-right edge');
      assert(frames.every(frame => disjoint(bounds(mark), bounds(frame))), '® must not overlap artwork');
    }
  }
  if (asset.format !== 'svg') continue;
  const svg = bytes.toString();
  assert(!/<(?:text|style|script|foreignObject)\b/i.test(svg), 'Deliverable must have fixed outlines');
  const paths = [...svg.matchAll(/<path\b([^>]*)\/>/g)].map(m => attrs(m[1]));
  if (asset.role === `${kind}-lettering`) {
    assert.equal(asset.embeddedRaster, false);
    assert.equal(paths.length, 1);
    assert.equal(paths[0].d, lettering.toPathData(6));
    assert(svg.includes(`viewBox="${letteringViewBox}"`));
  } else {
    const ink = asset.tone === 'white' ? '#ffffff' : '#000000';
    const letteringNode = svg.match(/<svg data-artwork="lettering"([^>]*)>([\s\S]*?)<\/svg>/);
    assert.equal(!!letteringNode, !!asset.letteringFrame);
    if (letteringNode) {
      const frame = attrs(letteringNode[1]);
      assert.equal(frame.viewBox, letteringViewBox);
      for (const key of ['x', 'y', 'width', 'height']) assert.equal(Number(frame[key]), asset.letteringFrame[key]);
      const outline = attrs(letteringNode[2]);
      assert.equal(outline.d, lettering.toPathData(6), 'Use original font outlines');
      assert.equal(outline.fill, ink);
    }
    const registrations = [...svg.matchAll(/<svg data-registration="([^"]+)"([^>]*)>([\s\S]*?)<\/svg>/g)];
    assert.equal(registrations.length, asset.registrationMarks.length);
    registrations.forEach((m, i) => {
      const frame = attrs(m[2]), outline = attrs(m[3]), declared = asset.registrationMarks[i];
      assert.equal(m[1], declared.owner);
      assert.equal(frame.viewBox, registeredViewBox);
      assert.deepEqual(['x', 'y', 'width', 'height'].map(key => Number(frame[key])), [declared.x, declared.y, declared.size, declared.size]);
      assert.equal(outline.d, registered.toPathData(6));
      assert.equal(outline.fill, ink);
    });
    assert.equal(paths.length, registrations.length + Number(!!letteringNode));
    const images = [...svg.matchAll(/<image\b([^>]*)\/>/g)].map(m => attrs(m[1]));
    assert.equal(images.length, Number(!!asset.symbolFrame));
    assert.equal(asset.embeddedRaster, !!asset.symbolFrame, 'Independent wordmarks must remain pure vector');
    if (images.length) {
      assert(images[0]['xlink:href'].startsWith('data:image/png;base64,'));
      assert.equal(hash(Buffer.from(images[0]['xlink:href'].split(',')[1], 'base64')), hash(symbol), 'Preserve approved full-color symbol');
    }
    const small = svg.replace(/^(<svg\b[^>]*\bwidth=")[^"]+(")/, (_, before, after) => before + asset.width / 4 + after).replace(/^(<svg\b[^>]*\bheight=")[^"]+(")/, (_, before, after) => before + asset.height / 4 + after);
    await rasters(await read(asset.path.replace(/\.svg$/, `-${asset.width / 4}.png`)), Buffer.from(small), asset.path, 1);
  }
  await rasters(await read(asset.path.replace(/\.svg$/, '.png')), bytes, asset.path);
}
assert.equal(seen.size, 48);
for (const path of expected) assert(seen.has(path), `Missing export: ${path}`);
assert.equal(expected.size, 45);
assert.equal(checksums.get(`${folder}/manifest.json`), hash(await read(`${folder}/manifest.json`)));
console.log(`Verified 48 ${kind} exports: pinned font, original vector glyphs, separate ® marks, unchanged symbol, pure-vector wordmarks, PNG/SVG agreement and checksums.`);
