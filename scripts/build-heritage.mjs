import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGeistWordmark } from './geist-wordmark.mjs';
import { buildHaineiKit } from './build-hainei.mjs';
import { createFangsongWordmark } from './fangsong-wordmark.mjs';
import { createSongtiWordmark } from './songti-wordmark.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = 'sources/heritage/cinagroup_20251026.png';
const source = await readFile(resolve(root, sourcePath));
const hash = data => createHash('sha256').update(data).digest('hex');
const sourceHash = '78a54b7a5a654d20acf292a6188c4303597633b42d6899b1c7197b51fa9c2a5d';
if (hash(source) !== sourceHash) throw new Error('The approved source artwork has changed.');
const cornerRadiusRatio = 12 / 256;
const radiusFor = size => size * cornerRadiusRatio;

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

// Preserve the original Chinese glyphs, removing only their white background.
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
const chinese = await extractLettering(chineseRect);
const geist = await createGeistWordmark(root);
const english = await sharp(Buffer.from(geist.svg())).resize({ width: 4096 }).png(png).toBuffer();
const cn = await sharp(chinese).metadata();
const en = { width: geist.width, height: geist.height };
await savePng('assets/heritage/cinagroup-wordmark-zh.png', chinese, { role: 'original-chinese-lettering' });
await savePng('assets/heritage/cinagroup-wordmark-en.png', english, { role: 'rounded-geist-lettering' });
await save('assets/heritage/cinagroup-wordmark-en.svg', Buffer.from(geist.svg()), { format: 'svg', width: geist.width, height: geist.height, role: 'rounded-geist-lettering', embeddedRaster: false });
async function whiteLettering(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) data[i] = data[i + 1] = data[i + 2] = 255;
  return sharp(data, { raw: info }).png(png).toBuffer();
}
const whiteCn = await whiteLettering(chinese);
const uri = data => `data:image/png;base64,${data.toString('base64')}`;
const header = (width, height, title = '海内集团 CINAGROUP') => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>${title}</title>`;
const image = (buffer, x, y, width, height, attrs = '') => `<image x="${x}" y="${y}" width="${width}" height="${height}" xlink:href="${uri(buffer)}" ${attrs}/>`;

// Chinese-only exports embed the approved lettering, never a replacement font.
const smallChinese = await sharp(chinese).resize({ width: 512 }).png(png).toBuffer();
for (const reversed of [false, true]) {
  const lettering = reversed ? whiteCn : chinese;
  const stem = `assets/heritage/cinagroup-wordmark-zh${reversed ? '-white' : ''}`;
  const svg = Buffer.from(header(cn.width, cn.height, '海内集团') + image(lettering, 0, 0, cn.width, cn.height) + '</svg>');
  const metadata = { role: 'original-chinese-lettering' };
  if (reversed) await savePng(`${stem}.png`, lettering, metadata);
  await save(`${stem}.svg`, svg, { format: 'svg', width: cn.width, height: cn.height, embeddedRaster: true, ...metadata });
  await savePng(`${stem}-512.png`, reversed ? await whiteLettering(smallChinese) : smallChinese, metadata);
}

// Scale each complete wordmark proportionally to the same visible
// width. Match both endpoints without horizontally stretching any glyph.
const bilingual = (x, y, width, gap = 64) => ({
  chinese: [x, y, width],
  english: [x, y + width * cn.height / cn.width + gap, width],
});
const centeredTextTop = (height, width, gap = 64) =>
  (height - width * cn.height / cn.width - gap - width * en.height / en.width) / 2;
const layouts = {
  horizontal: { width: 3328, height: 1152, tile: [64, 64, 1024], ...bilingual(1248, centeredTextTop(1152, 2016), 2016) },
  stacked: { width: 1408, height: 1664, tile: [224, 64, 960], ...bilingual(112, 1112, 1184, 40) },
  english: { width: 3072, height: 1152, tile: [64, 64, 1024], english: [1248, (1152 - 1760 * en.height / en.width) / 2, 1760] },
  wordmark: { width: 2176, height: 960, ...bilingual(64, centeredTextTop(960, 2048), 2048) },
  chinese: { width: 3328, height: 1152, tile: [64, 64, 1024], chinese: [1248, (1152 - 2016 * cn.height / cn.width) / 2, 2016] },
  'chinese-stacked': { width: 1408, height: 1472, tile: [224, 64, 960], chinese: [112, 1112, 1184] },
};
function lockup(name, width, reversed = false) {
  const layout = layouts[name];
  const scale = width / layout.width;
  const height = Math.round(layout.height * scale);
  let svg = header(width, height, layout.chinese && !layout.english ? '海内集团' : undefined);
  if (layout.tile) {
    const [x, y, size] = layout.tile.map(n => n * scale);
    svg += `<defs><clipPath id="corners"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radiusFor(size)}" ry="${radiusFor(size)}"/></clipPath></defs>`;
    svg += image(mark, x, y, size, size, 'clip-path="url(#corners)"');
  }
  if (layout.chinese) {
    const [x, y, w] = layout.chinese.map(n => n * scale);
    svg += image(reversed ? whiteCn : chinese, x, y, w, w * cn.height / cn.width);
  }
  if (layout.english) {
    const [x, y, w] = layout.english.map(n => n * scale);
    svg += `<svg data-wordmark="english" x="${x}" y="${y}" width="${w}" height="${w * en.height / en.width}" viewBox="${geist.viewBox}"><path fill="${reversed ? '#ffffff' : '#000000'}" d="${geist.path}"/></svg>`;
  }
  return Buffer.from(svg + '</svg>');
}
function cornerMetadata(layout, scale = 1) {
  if (!layout.tile) return { cornerRadiusPx: null };
  const [x, y, size] = layout.tile.map(value => value * scale);
  return { cornerRadiusRatio, cornerRadiusPx: radiusFor(size), symbolFrame: { x, y, size } };
}
for (const [name, layout] of Object.entries(layouts)) {
  for (const reversed of [false, true]) {
    const suffix = reversed ? '-white' : '';
    const stem = `assets/heritage/cinagroup-${name}${suffix}`;
    const svg = lockup(name, layout.width, reversed);
    await save(`${stem}.svg`, svg, { format: 'svg', width: layout.width, height: layout.height, embeddedRaster: true, ...cornerMetadata(layout) });
    await savePng(`${stem}.png`, await sharp(svg).png(png).toBuffer(), cornerMetadata(layout));
    const smallWidth = layout.width / 4;
    await savePng(`${stem}-${smallWidth}.png`, await sharp(lockup(name, smallWidth, reversed)).png(png).toBuffer(), cornerMetadata(layout, 0.25));
  }
}

async function icon(size, rounded, radius = radiusFor(size)) {
  const scaled = await sharp(mark).resize(size, size).png(png).toBuffer();
  if (!rounded) return scaled;
  const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/></svg>`);
  return sharp(scaled).composite([{ input: mask, blend: 'dest-in' }]).png(png).toBuffer();
}
for (const size of [16, 24, 32, 48, 64, 96, 128, 180, 192, 256, 512, 1024]) {
  await savePng(`assets/icons/rounded/cinagroup-${size}.png`, await icon(size, true), { cornerRadiusRatio, cornerRadiusPx: radiusFor(size) });
}
const platformPngs = [
  ['assets/logo/cinagroup-logo.png', 256, false],
  ['assets/logo/cinagroup-logo-rounded.png', 256, true],
  ['assets/logo/cinagroup-logo-rounded-3px.png', 256, true, 3],
  ['assets/icons/web/favicon-16.png', 16, true],
  ['assets/icons/web/favicon-32.png', 32, true],
  ['assets/icons/web/apple-touch-icon.png', 180, false],
  ['assets/icons/web/pwa-192.png', 192, false],
  ['assets/icons/web/pwa-512.png', 512, false],
  ['assets/icons/app/cinagroup-app-icon-1024.png', 1024, false],
];
for (const [path, size, rounded, fixedRadius] of platformPngs) {
  const radius = fixedRadius ?? radiusFor(size);
  await savePng(path, await icon(size, rounded, radius), {
    cornerRadiusPx: rounded ? radius : 0,
    ...(rounded && fixedRadius === undefined ? { cornerRadiusRatio } : {}),
    ...(fixedRadius !== undefined ? { role: 'legacy-fixed-3px' } : {}),
  });
}
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
for (const path of ['assets/icons/web/favicon.ico', 'assets/icons/windows/cinagroup.ico']) await save(path, ico, { format: 'ico', sizes: icoSizes, cornerRadiusRatio });

// Contact sheet is only a preview; deliverable artwork never depends on fonts.
let sheet = header(1600, 1600) + '<rect width="1600" height="1600" fill="white"/>';
const label = (text, x, y, size = 23, color = '#64747d') => `<text x="${x}" y="${y}" font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif" font-size="${size}" fill="${color}">${text}</text>`;
sheet += label('海内集团 · 传承字标套件', 48, 76, 38, '#101b22');
sheet += label('CINAGROUP', 1292, 74, 24);
for (const y of [150, 610, 1070, 1530]) sheet += `<path d="M32 ${y}H1568" stroke="#e2e8ec"/>`;
sheet += '<path d="M800 150V1530" stroke="#e2e8ec"/>';
const titles = ['01  横版中英组合', '02  纯字标组合', '03  竖版中英组合', '04  英文组合', '05  深色应用', '06  独立图标 · 等比例圆角'];
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
sheet += label('传承中文 + Geist Regular · 英文圆角 50%，N 上下内角保留锐角 · 底板圆角 4.6875%', 48, 1575, 20);
sheet += '</svg>';
await savePng('assets/heritage/preview.png', await sharp(Buffer.from(sheet)).png(png).toBuffer(), { role: 'preview' });

// Separate contact sheet keeps the Chinese kit easy to browse without changing
// the established bilingual preview or the approved artwork.
sheet = header(1600, 1600, '海内集团 · 中文字标套件') + '<rect width="1600" height="1600" fill="white"/>';
sheet += label('海内集团 · 中文字标套件', 48, 76, 38, '#101b22');
sheet += label('图标 + 中文 / 横版 · 竖版 · 独立字标', 48, 118, 22);
for (const y of [150, 610, 1070, 1530]) sheet += `<path d="M32 ${y}H1568" stroke="#e2e8ec"/>`;
sheet += '<path d="M800 150V1530" stroke="#e2e8ec"/>';
const chineseTitles = ['01  横版中文组合', '02  横版中文组合 · 反白', '03  竖版中文组合', '04  竖版中文组合 · 反白', '05  独立中文字标', '06  独立中文字标 · 反白'];
for (let i = 0; i < chineseTitles.length; i++) sheet += label(chineseTitles[i], 48 + (i % 2) * 800, 205 + Math.floor(i / 2) * 460);
for (const [y, height] of [[245, 320], [700, 330], [1170, 280]]) sheet += `<rect x="832" y="${y}" width="736" height="${height}" rx="3" fill="#123b56"/>`;
await sample('chinese', 40, 290, 720);
await sample('chinese', 840, 290, 720, true);
await sample('chinese-stacked', 248, 700, 304);
await sample('chinese-stacked', 1048, 700, 304, true);
for (const reversed of [false, true]) sheet += image(reversed ? whiteCn : chinese, reversed ? 880 : 80, 1220, 640, 640 * cn.height / cn.width);
sheet += label('原稿中文字形 · 全彩图标 · 透明背景 · 底板圆角 4.6875% · SVG 内嵌原稿位图', 48, 1575, 20);
sheet += '</svg>';
await savePng('assets/heritage/preview-chinese.png', await sharp(Buffer.from(sheet)).png(png).toBuffer(), { role: 'preview' });

const manifest = {
  schemaVersion: 1, version: '2.1.1', name: '海内集团 · 传承字标 + Geist', englishWordmark: 'CINAGROUP',
  source: { path: sourcePath, sha256: sourceHash, width: 3238, height: 1024, symbolRect: { left: 0, top: 0, width: 1024, height: 1024 }, chineseRect },
  typography: { english: geist.metadata },
  rules: { shape: 'unchanged-source-raster', lettering: 'original Chinese glyphs; custom rounded Geist Regular English outlines', bilingualAlignment: 'equal-width-left-and-right', cornerRadiusRatio, cornerRadiusReference: { sizePx: 256, radiusPx: 12 }, svg: 'self-contained hybrid SVG: original symbol and Chinese PNGs, vector English paths', platformIcons: 'square artwork; OS applies its own mask' },
  assets: records,
};
await writeFile(resolve(root, 'assets/heritage/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const haineiCount = await buildHaineiKit({ root, mark, chinese, png, cornerRadiusRatio });
const fangsongWordmark = await createFangsongWordmark(root);
const fangsongCount = await buildHaineiKit({ root, mark, png, cornerRadiusRatio, vectorWordmark: fangsongWordmark });
const songtiWordmark = await createSongtiWordmark(root);
const songtiCount = await buildHaineiKit({ root, mark, png, cornerRadiusRatio, vectorWordmark: songtiWordmark });
async function walk(folder) {
  const entries = await readdir(resolve(root, folder), { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => entry.isDirectory() ? walk(`${folder}/${entry.name}`) : [`${folder}/${entry.name}`]));
  return files.flat();
}
const trackedAssets = (await Promise.all(['assets', 'sources'].map(walk))).flat().sort();
const checksums = await Promise.all(trackedAssets.map(async path => `${hash(await readFile(resolve(root, path)))}  ${path}`));
await writeFile(resolve(root, 'checksums.sha256'), checksums.join('\n') + '\n');
console.log(`Built ${records.length} heritage, ${haineiCount} Hainei, ${fangsongCount} FangSong and ${songtiCount} Songti assets; original source ${sourceHash}; ${trackedAssets.length} checksum entries.`);
