import { createFontWordmark } from './font-wordmark.mjs';

export const fangsongFontSource = {
  family: 'Zhuque Fangsong', chineseFamily: '朱雀仿宋', style: 'Regular', weight: 400,
  release: '0.212', path: 'sources/fonts/zhuque-fangsong/ZhuqueFangsong-Regular.ttf',
  sha256: '558c62730844fe54ba220146ed62f859d4e2880188d92d985f8921c6e3743bc4',
  url: 'https://github.com/TrionesType/zhuque/releases/tag/v0.212',
  archiveUrl: 'https://github.com/TrionesType/zhuque/releases/download/v0.212/ZhuqueFangsong-v0.212.zip',
  archiveSha256: 'bb8b661a7643d2296a72d9d10530a00949419c4e527fb61783f73c2ba1a8c062',
  license: 'SIL Open Font License 1.1', licensePath: 'sources/fonts/zhuque-fangsong/OFL.txt',
};

export function createFangsongWordmark(root) {
  return createFontWordmark(root, fangsongFontSource, { prefix: 'hainei-fangsong', title: '海内 · 仿宋商品字标套件', role: 'fangsong-lettering', label: '朱雀仿宋 Regular' });
}
