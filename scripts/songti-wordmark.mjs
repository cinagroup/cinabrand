import { createFontWordmark } from './font-wordmark.mjs';

export const songtiFontSource = {
  family: 'Source Han Serif SC', chineseFamily: '思源宋体', style: 'Regular', weight: 400,
  release: '2.003', path: 'sources/fonts/source-han-serif/SourceHanSerifSC-Regular.otf',
  sha256: '78aa7a328fd974df2d688c8a9fd74a33d8334dfa84ab24d9d11efb2ffc464117',
  url: 'https://github.com/adobe-fonts/source-han-serif/releases/tag/2.003R',
  downloadUrl: 'https://raw.githubusercontent.com/adobe-fonts/source-han-serif/2.003R/OTF/SimplifiedChinese/SourceHanSerifSC-Regular.otf',
  gitBlobSha: 'cb41635674be23029e98469f729eded6ebc54611',
  license: 'SIL Open Font License 1.1', licensePath: 'sources/fonts/source-han-serif/OFL.txt',
};

export function createSongtiWordmark(root) {
  return createFontWordmark(root, songtiFontSource, { prefix: 'hainei-songti', title: '海内 · 宋体商品字标套件', role: 'songti-lettering', label: '思源宋体 SC Regular' });
}
