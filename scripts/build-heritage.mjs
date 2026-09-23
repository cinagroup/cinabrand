import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = 'sources/heritage/cinagroup_20251026.png';
const source = await readFile(resolve(root, sourcePath));
const hash = data => createHash('sha256').update(data).digest('hex');
const sourceHash = '78a54b7a5a654d20acf292a6188c4303597633b42d6899b1c7197b51fa9c2a5d';
if (hash(source) !== sourceHash) throw new Error('The approved source artwork has changed.');

const records = [];
async function save(path, data, extra = {}) {
  await mkdir(dirname(resolve(root, path)), { recursive: true });
  await writeFile(resolve(root, path), data);
  records.push({ path, sha256: hash(data), ...extra });
}
async function savePng(path, data, extra = {}) {
  const { width, height } = await sharp(data).metadata();
  await save(path, data, { format: 'png', width, height, ...extra });
}
const png = { compressionLevel: 9, adaptiveFiltering: true };
const mark = await sharp(source).extract({ left: 0, top: 0, width: 1024, height: 1024 }).png(png).toBuffer();
await savePng('assets/heritage/cinagroup-symbol-source.png', mark, { role: 'approved-color-source' });

// Remove only white background from the original black lettering. No retyping,
// font substitution, tracing or generative redraw is involved.
async function extractLettering(rect) {
  const { data, info } = await sharp(source).extract(rect).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const output = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const offset = i * info.channels;
    output[i * 4 + 3] = 255 - Math.round((data[offset] + data[offset + 1] + data[offset + 2]) / 3);
  }
  return sharp(output, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 0 }).png(png).toBuffer();
}
const chineseRect = { left: 1120, top: 110, width: 2040, height: 510 };
const englishRect = { left: 1120, top: 620, width: 2040, height: 300 };
const chinese = await extractLettering(chineseRect);
const english = await extractLettering(englishRect);
const cn = await sharp(chinese).metadata();
const en = await sharp(english).metadata();
await savePng('assets/heritage/cinagroup-wordmark-zh.png', chinese, { role: 'original-chinese-lettering' });
await savePng('assets/heritage/cinagroup-wordmark-en.png', english, { role: 'original-english-lettering' });
async function whiteLettering(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) data[i] = data[i + 1] = data[i + 2] = 255;
  return sharp(data, { raw: info }).png(png).toBuffer();
}
const whiteCn = await whiteLettering(chinese);
const whiteEn = await whiteLettering(english);
const uri = data => `data:image/png;base64,${data.toString('base64')}`;
const header = (width, height) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>海内集团 CINAGROUP</title>`;
const image = (buffer, x, y, width, height, attrs = '') => `<image x="${x}" y="${y}" width="${width}" height="${height}" xlink:href="${uri(buffer)}" ${attrs}/>`;

const layouts = {
  horizontal: { width: 3328, height: 1152, tile: [64, 64, 1024], chinese: [1248, 192, 2016], english: [1248, 760, 1536] },
  stacked: { width: 1408, height: 1664, tile: [224, 64, 960], chinese: [112, 1112, 1184], english: [224, 1470, 960] },
  english: { width: 3072, height: 1152, tile: [64, 64, 1024], english: [1248, 448, 1760] },
  wordmark: { width: 2176, height: 960, chinese: [64, 96, 2048], english: [64, 688, 1568] },
};
function lockup(name, width, reversed = false) {
  const layout = layouts[name];
  const scale = width / layout.width;
  const height = Math.round(layout.height * scale);
  let svg = header(width, height);
  if (layout.tile) {
    const [x, y, size] = layout.tile.map(n => n * scale);
    svg += `<defs><clipPath id="corners"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="3" ry="3"/></clipPath></defs>`;
    svg += image(mark, x, y, size, size, 'clip-path="url(#corners)"');
  }
  for (const [key, buffer, meta] of [['chinese', reversed ? whiteCn : chinese, cn], ['english', reversed ? whiteEn : english, en]]) {
    if (!layout[key]) continue;
    const [x, y, w] = layout[key].map(n => n * scale);
    svg += image(buffer, x, y, w, w * meta.height / meta.width);
  }
  return Buffer.from(svg + '</svg>');
}
for (const [name, layout] of Object.entries(layouts)) {
  for (const reversed of [false, true]) {
    const suffix = reversed ? '-white' : '';
    const stem = `assets/heritage/cinagroup-${name}${suffix}`;
    const svg = lockup(name, layout.width, reversed);
    await save(`${stem}.svg`, svg, { format: 'svg', width: layout.width, height: layout.height, embeddedRaster: true, cornerRadiusPx: layout.tile ? 3 : null });
    await savePng(`${stem}.png`, await sharp(svg).png(png).toBuffer(), { cornerRadiusPx: layout.tile ? 3 : null });
    const smallWidth = layout.width / 4;
    await savePng(`${stem}-${smallWidth}.png`, await sharp(lockup(name, smallWidth, reversed)).png(png).toBuffer(), { cornerRadiusPx: layout.tile ? 3 : null });
  }
}

async function icon(size, rounded) {
  const scaled = await sharp(mark).resize(size, size).png(png).toBuffer();
  if (!rounded) return scaled;
  const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="3" ry="3" fill="white"/></svg>`);
  return sharp(scaled).composite([{ input: mask, blend: 'dest-in' }]).png(png).toBuffer();
}
for (const size of [16, 24, 32, 48, 64, 96, 128, 180, 192, 256, 512, 1024]) {
  await savePng(`assets/icons/rounded/cinagroup-${size}.png`, await icon(size, true), { cornerRadiusPx: 3 });
}
const platformPngs = [
  ['assets/logo/cinagroup-logo.png', 256, false],
  ['assets/logo/cinagroup-logo-rounded-3px.png', 256, true],
  ['assets/icons/web/favicon-16.png', 16, true],
  ['assets/icons/web/favicon-32.png', 32, true],
  ['assets/icons/web/apple-touch-icon.png', 180, false],
  ['assets/icons/web/pwa-192.png', 192, false],
  ['assets/icons/web/pwa-512.png', 512, false],
  ['assets/icons/app/cinagroup-app-icon-1024.png', 1024, false],
];
for (const [path, size, rounded] of platformPngs) await savePng(path, await icon(size, rounded), { cornerRadiusPx: rounded ? 3 : 0 });
const icoSizes = [16, 20, 24, 32, 40, 48, 64, 128, 256];
const icoImages = await Promise.all(icoSizes.map(size => icon(size, true)));
const directory = Buffer.alloc(6 + icoSizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(icoSizes.length, 4);
let imageOffset = directory.length;
icoSizes.forEach((size, i) => {
  const pos = 6 + i * 16;
  directory[pos] = directory[pos + 1] = size === 256 ? 0 : size;
  directory.writeUInt16LE(1, pos + 4);
  directory.writeUInt16LE(32, pos + 6);
  directory.writeUInt32LE(icoImages[i].length, pos + 8);
  directory.writeUInt32LE(imageOffset, pos + 12);
  imageOffset += icoImages[i].length;
});
const ico = Buffer.concat([directory, ...icoImages]);
for (const path of ['assets/icons/web/favicon.ico', 'assets/icons/windows/cinagroup.ico']) await save(path, ico, { format: 'ico', sizes: icoSizes });

// Contact sheet is only a preview; deliverable artwork never depends on fonts.
let sheet = header(1600, 1600) + '<rect width="1600" height="1600" fill="white"/>';
const label = (text, x, y, size = 23, color = '#64747d') => `<text x="${x}" y="${y}" font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif" font-size="${size}" fill="${color}">${text}</text>`;
sheet += label('海内集团 · 传承字标套件', 48, 76, 38, '#101b22');
sheet += label('CINAGROUP', 1292, 74, 24);
for (const y of [150, 610, 1070, 1530]) sheet += `<path d="M32 ${y}H1568" stroke="#e2e8ec"/>`;
sheet += '<path d="M800 150V1530" stroke="#e2e8ec"/>';
const titles = ['01  横版中英组合', '02  纯字标组合', '03  竖版中英组合', '04  英文组合', '05  深色应用', '06  独立图标 · 3px 圆角'];
for (let i = 0; i < titles.length; i++) sheet += label(titles[i], 48 + (i % 2) * 800, 205 + Math.floor(i / 2) * 460);
const sample = async (name, x, y, width, reversed = false) => {
  const data = await sharp(lockup(name, width, reversed)).png(png).toBuffer();
  const meta = await sharp(data).metadata();
  sheet += image(data, x, y, meta.width, meta.height);
};
await sample('horizontal', 40, 290, 720);
await sample('wordmark', 900, 258, 600);
await sample('stacked', 248, 690, 304);
await sample('english', 840, 777, 720);
sheet += '<rect x="32" y="1170" width="736" height="280" rx="3" fill="#123b56"/>';
await sample('horizontal', 44, 1190, 712, true);
for (const [size, x] of [[192, 866], [128, 1134], [64, 1342], [32, 1462]]) {
  sheet += image(await icon(size, true), x, 1400 - size, size, size);
  sheet += label(`${size}px`, x, 1440, 20);
}
sheet += label('原图图形与字形保留 · 标准字标 CINAGROUP', 48, 1575, 20);
sheet += '</svg>';
await savePng('assets/heritage/preview.png', await sharp(Buffer.from(sheet)).png(png).toBuffer(), { role: 'preview' });

const manifest = {
  schemaVersion: 1, version: '2.0.0', name: '海内集团 · 传承字标', englishWordmark: 'CINAGROUP',
  source: { path: sourcePath, sha256: sourceHash, width: 3238, height: 1024, symbolRect: { left: 0, top: 0, width: 1024, height: 1024 }, chineseRect, englishRect },
  rules: { shape: 'unchanged-source-raster', lettering: 'extracted-original-glyphs', cornerRadiusPx: 3, svg: 'self-contained SVG with embedded PNG artwork; not traced vector paths', platformIcons: 'square artwork; OS applies its own mask' },
  assets: records,
};
await writeFile(resolve(root, 'assets/heritage/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
async function walk(folder) {
  const entries = await readdir(resolve(root, folder), { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => entry.isDirectory() ? walk(`${folder}/${entry.name}`) : [`${folder}/${entry.name}`]));
  return files.flat();
}
const trackedAssets = (await Promise.all(['assets', 'sources'].map(walk))).flat().sort();
const checksums = await Promise.all(trackedAssets.map(async path => `${hash(await readFile(resolve(root, path)))}  ${path}`));
await writeFile(resolve(root, 'checksums.sha256'), checksums.join('\n') + '\n');
console.log(`Built ${records.length} heritage assets; original source ${sourceHash}; ${trackedAssets.length} checksum entries.`);
