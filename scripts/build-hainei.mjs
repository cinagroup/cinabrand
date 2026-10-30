import sharp from 'sharp';
import opentype from 'opentype.js';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fontSource } from './geist-wordmark.mjs';

const hash = data => createHash('sha256').update(data).digest('hex');
const crop = { left: 0, top: 0, width: 981, height: 493 };
const layouts = {
  horizontal: { width: 2432, height: 1152, tile: [64, 64, 1024], lettering: [1312, 329.5, 981], marks: [{ owner: 'symbol', x: 1104, y: 64, size: 80 }, { owner: 'lettering', x: 2309, y: 297.5, size: 64 }] },
  stacked: { width: 1408, height: 1792, tile: [224, 64, 960], lettering: [112, 1112, 1184], marks: [{ owner: 'symbol', x: 1200, y: 64, size: 80 }, { owner: 'lettering', x: 1312, y: 1084, size: 56 }] },
  wordmark: { width: 1216, height: 640, lettering: [64, 80, 981], marks: [{ owner: 'lettering', x: 1061, y: 48, size: 64 }] },
  symbol: { width: 1280, height: 1280, tile: [128, 128, 1024], marks: [{ owner: 'symbol', x: 1168, y: 96, size: 80 }] },
};

export async function buildHaineiKit({ root, mark, chinese, png, cornerRadiusRatio, vectorWordmark }) {
  const prefix = vectorWordmark?.kit.prefix ?? 'hainei';
  const folder = `assets/${prefix}`;
  const title = vectorWordmark?.kit.title ?? '海内 · 商品字标套件';
  const glyphSize = vectorWordmark ?? crop;
  const kitLayouts = vectorWordmark ? structuredClone(layouts) : layouts;
  if (vectorWordmark) {
    for (const [name, layout] of Object.entries(kitLayouts)) {
      if (!layout.lettering) continue;
      const height = layout.lettering[2] * glyphSize.height / glyphSize.width;
      if (name !== 'stacked') layout.lettering[1] = (layout.height - height) / 2;
      layout.marks.find(m => m.owner === 'lettering').y = layout.lettering[1] - (name === 'stacked' ? 28 : 32);
    }
  }
  const records = [];
  const save = async (path, bytes, metadata) => {
    await mkdir(dirname(resolve(root, path)), { recursive: true });
    await writeFile(resolve(root, path), bytes);
    records.push({ path, sha256: hash(bytes), ...metadata });
  };
  const savePng = async (path, bytes, metadata) => {
    const { width, height } = await sharp(bytes).metadata();
    await save(path, bytes, { format: 'png', width, height, ...metadata });
  };
  // The blank columns after x=980 separate 内 from 集 in the approved lettering.
  const lettering = vectorWordmark
    ? await sharp(Buffer.from(vectorWordmark.svg())).png(png).toBuffer()
    : await sharp(chinese).extract(crop).png(png).toBuffer();
  const { data, info } = await sharp(lettering).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) data[i] = data[i + 1] = data[i + 2] = 255;
  const white = await sharp(data, { raw: info }).png(png).toBuffer();
  await savePng(`${folder}/${prefix}-wordmark-source.png`, lettering, { role: vectorWordmark?.kit.role ?? 'original-hainei-lettering' });
  if (vectorWordmark) await save(`${folder}/${prefix}-wordmark-source.svg`, Buffer.from(vectorWordmark.svg()), { format: 'svg', width: glyphSize.width, height: glyphSize.height, role: vectorWordmark.kit.role, embeddedRaster: false });

  const fontBytes = await readFile(resolve(root, fontSource.path));
  if (hash(fontBytes) !== fontSource.sha256) throw new Error('Pinned registration-mark font has changed');
  const font = opentype.parse(fontBytes.buffer.slice(fontBytes.byteOffset, fontBytes.byteOffset + fontBytes.byteLength));
  if (!font.charToGlyph('®').index) throw new Error('Pinned font must contain the circled registered mark');
  const registeredPath = font.getPath('®', 0, 0, font.unitsPerEm, { kerning: true });
  const box = registeredPath.getBoundingBox();
  const viewBox = [box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1].map(n => Number(n.toFixed(6))).join(' ');
  const outline = registeredPath.toPathData(6);
  const uri = bytes => `data:image/png;base64,${bytes.toString('base64')}`;
  const header = (width, height, title = '海内') => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>${title}</title>`;
  const image = (bytes, x, y, width, height, attrs = '') => `<image x="${x}" y="${y}" width="${width}" height="${height}" xlink:href="${uri(bytes)}" ${attrs}/>`;
  const metadata = (name, registered, reversed, scale = 1) => {
    const layout = kitLayouts[name];
    const result = { layout: name, registered, tone: reversed ? 'white' : 'black', registrationMarks: registered ? layout.marks.map(m => ({ owner: m.owner, x: m.x * scale, y: m.y * scale, size: m.size * scale })) : [] };
    if (layout.tile) {
      const [x, y, size] = layout.tile.map(n => n * scale);
      Object.assign(result, { symbolFrame: { x, y, size }, cornerRadiusRatio, cornerRadiusPx: size * cornerRadiusRatio });
    }
    if (layout.lettering) {
      const [x, y, width] = layout.lettering.map(n => n * scale);
      result.letteringFrame = { x, y, width, height: width * glyphSize.height / glyphSize.width };
    }
    return result;
  };
  const lockup = (name, registered, reversed, scale = 1) => {
    const layout = kitLayouts[name];
    let svg = header(layout.width * scale, layout.height * scale);
    if (layout.tile) {
      const [x, y, size] = layout.tile.map(n => n * scale);
      const radius = size * cornerRadiusRatio;
      svg += `<defs><clipPath id="tile-corners"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" ry="${radius}"/></clipPath></defs>`;
      svg += image(mark, x, y, size, size, 'data-artwork="symbol" clip-path="url(#tile-corners)"');
    }
    if (layout.lettering) {
      const [x, y, width] = layout.lettering.map(n => n * scale);
      const height = width * glyphSize.height / glyphSize.width;
      svg += vectorWordmark
        ? `<svg data-artwork="lettering" x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${vectorWordmark.viewBox}"><path fill="${reversed ? '#ffffff' : '#000000'}" d="${vectorWordmark.path}"/></svg>`
        : image(reversed ? white : lettering, x, y, width, height, 'data-artwork="lettering"');
    }
    if (registered) {
      for (const m of layout.marks) svg += `<svg data-registration="${m.owner}" x="${m.x * scale}" y="${m.y * scale}" width="${m.size * scale}" height="${m.size * scale}" viewBox="${viewBox}"><path fill="${reversed ? '#ffffff' : '#000000'}" d="${outline}"/></svg>`;
    }
    return Buffer.from(svg + '</svg>');
  };
  for (const [name, layout] of Object.entries(kitLayouts)) {
    for (const registered of [false, true]) {
      for (const reversed of [false, true]) {
        if (name === 'symbol' && !registered && reversed) continue;
        const stem = `${folder}/${prefix}-${name}${registered ? '-registered' : ''}${reversed ? '-white' : ''}`;
        const svg = lockup(name, registered, reversed);
        await save(`${stem}.svg`, svg, { format: 'svg', width: layout.width, height: layout.height, embeddedRaster: vectorWordmark ? !!layout.tile : true, ...metadata(name, registered, reversed) });
        await savePng(`${stem}.png`, await sharp(svg).png(png).toBuffer(), metadata(name, registered, reversed));
        await savePng(`${stem}-${layout.width / 4}.png`, await sharp(lockup(name, registered, reversed, 0.25)).png(png).toBuffer(), metadata(name, registered, reversed, 0.25));
      }
    }
  }

  const label = (text, x, y, size = 23, color = '#64747d') => `<text x="${x}" y="${y}" font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif" font-size="${size}" fill="${color}">${text}</text>`;
  let sheet = header(1600, 1920, title) + '<rect width="1600" height="1920" fill="white"/>';
  sheet += label(title, 48, 76, 38, '#101b22');
  sheet += label('商品注册版 · 左：黑字　右：反白 · 图标与文字分别标注 ®', 48, 118, 22);
  for (const y of [150, 560, 970, 1380, 1790]) sheet += `<path d="M32 ${y}H1568" stroke="#e2e8ec"/>`;
  sheet += '<path d="M800 150V1790" stroke="#e2e8ec"/>';
  const titles = ['横版 · 图标 + 海内', '竖版 · 图标 + 海内', '独立图标', '独立海内字标'];
  const samples = [['horizontal', 80, 235, 640, 225, 320], ['stacked', 288, 660, 224, 650, 300], ['symbol', 256, 1070, 288, 1055, 310], ['wordmark', 80, 1445, 640, 1445, 340]];
  for (let i = 0; i < samples.length; i++) {
    const [name, x, y, width, panelY, panelHeight] = samples[i];
    sheet += label(`${String(i * 2 + 1).padStart(2, '0')}  ${titles[i]} · 黑字 ®`, 48, 205 + i * 410);
    sheet += label(`${String(i * 2 + 2).padStart(2, '0')}  ${titles[i]} · 反白 ®`, 848, 205 + i * 410);
    sheet += `<rect x="832" y="${panelY}" width="736" height="${panelHeight}" rx="3" fill="#123b56"/>`;
    for (const reversed of [false, true]) {
      const svg = lockup(name, true, reversed, width / kitLayouts[name].width);
      const rendered = await sharp(svg).png(png).toBuffer();
      const { width: w, height: h } = await sharp(rendered).metadata();
      sheet += image(rendered, x + (reversed ? 800 : 0), y, w, h);
    }
  }
  sheet += label(vectorWordmark ? `${vectorWordmark.kit.label} · 中文及 ® 为矢量轮廓 · 全彩图标 · 透明 PNG / 自包含 SVG` : '原稿「海内」字形 · 全彩图标 · 透明 PNG / 自包含 SVG · ® 为固定矢量轮廓', 48, 1840, 20);
  sheet += label('组合各含两处 ®；独立图标与字标各含一处 ®。另提供无 ® 的标准版本。', 48, 1876, 20);
  sheet += '</svg>';
  await savePng(`${folder}/preview.png`, await sharp(Buffer.from(sheet)).png(png).toBuffer(), { role: 'preview' });
  const manifest = {
    schemaVersion: 1, version: '2.1.1', name: title, wordmark: '海内',
    source: vectorWordmark ? { path: vectorWordmark.metadata.path, sha256: vectorWordmark.metadata.sha256, text: '海内', viewBox: vectorWordmark.viewBox } : { path: 'assets/heritage/cinagroup-wordmark-zh.png', sha256: hash(chinese), crop },
    ...(vectorWordmark ? { typography: { chinese: vectorWordmark.metadata } } : {}),
    registration: { symbol: '®', font: fontSource, viewBox, placement: 'upper-right-outside-artwork' },
    assets: records,
  };
  await writeFile(resolve(root, `${folder}/manifest.json`), JSON.stringify(manifest, null, 2) + '\n');
  return records.length;
}
