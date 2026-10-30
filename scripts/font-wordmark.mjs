import opentype from 'opentype.js';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function createFontWordmark(root, source, kit) {
  const bytes = await readFile(resolve(root, source.path));
  if (createHash('sha256').update(bytes).digest('hex') !== source.sha256) throw new Error(`Pinned ${source.family} font has changed`);
  const font = opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  const text = '海内';
  const glyphs = font.stringToGlyphs(text);
  if (glyphs.length !== 2 || glyphs.some(glyph => !glyph.index)) throw new Error(`${source.family} must contain both 海 and 内`);
  const outline = font.getPath(text, 0, 0, font.unitsPerEm, { kerning: true });
  const box = outline.getBoundingBox();
  const width = box.x2 - box.x1, height = box.y2 - box.y1;
  const viewBox = [box.x1, box.y1, width, height].map(n => Number(n.toFixed(6))).join(' ');
  const path = outline.toPathData(6);
  const svg = (color = '#000000') => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}"><title>海内 · ${source.chineseFamily}</title><path fill="${color}" d="${path}"/></svg>`;
  return { kit, width, height, viewBox, path, svg,
    metadata: { ...source, text, unitsPerEm: font.unitsPerEm, kerning: true, glyphIndices: glyphs.map(glyph => glyph.index), outlines: 'unmodified-font-paths' },
  };
}
