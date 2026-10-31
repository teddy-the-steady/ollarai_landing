// Generates dist/en/index.html and dist/ja/index.html from dist/index.html
// with locale-specific OG meta tags pre-baked for social crawlers.
// Run after Vite build: npm run build:locales

import fs from 'fs';
import path from 'path';

const DOMAIN = 'https://ollarai.com'; // absolute base for og:image (crawlers ignore <base href>)

const base = fs.readFileSync('dist/index.html', 'utf8');

const locales = {
  en: {
    dir: 'dist/en',
    ogTitle:       'Ollarai - When Data Becomes the Answer to Investment',
    ogDesc:        'Spend zero minutes digging through filings. Ask for any financial figure and get it straight from the original filings. AI investment research.',
    ogImage:       `${DOMAIN}/og/ollarai-og-image.png`,
    ogImageType:   'image/png',
    ogLocale:      'en_US',
    twTitle:       'Ollarai - When Data Becomes the Answer to Investment',
    twDesc:        'Spend zero minutes digging through filings. Ask for any financial figure and get it straight from the original filings. AI investment research.',
    twImage:       `${DOMAIN}/og/ollarai-og-image.png`,
  },
  ja: {
    dir: 'dist/ja',
    ogTitle:       'Ollarai - データが投資の答えになる瞬間',
    ogDesc:        '開示資料を探す時間は0分に。知りたい財務数値を質問すれば、開示原文からそのまま取り出すAI投資リサーチ。',
    ogImage:       `${DOMAIN}/og/ollarai-og-image-ja.png`,
    ogImageType:   'image/png',
    ogLocale:      'ja_JP',
    twTitle:       'Ollarai - データが投資の答えになる瞬間',
    twDesc:        '開示資料を探す時間は0分に。知りたい財務数値を質問すれば、開示原文からそのまま取り出すAI投資リサーチ。',
    twImage:       `${DOMAIN}/og/ollarai-og-image-ja.png`,
  },
};

for (const [lang, cfg] of Object.entries(locales)) {
  let html = base;

  // Add <base href="/"> so all relative asset paths resolve from root
  html = html.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n    <base href="/">');

  // Swap OG meta tag content values
  html = html
    .replace(/(<meta property="og:title"\s+content=")[^"]*(")/,       `$1${cfg.ogTitle}$2`)
    .replace(/(<meta property="og:description"\s+content=")[^"]*(")/,  `$1${cfg.ogDesc}$2`)
    .replace(/(<meta property="og:image"\s+content=")[^"]*(")/,        `$1${cfg.ogImage}$2`)
    .replace(/(<meta property="og:image:type"\s+content=")[^"]*(")/,   `$1${cfg.ogImageType}$2`)
    .replace(/(<meta property="og:locale"\s+content=")[^"]*(")/,       `$1${cfg.ogLocale}$2`)
    .replace(/(<meta name="twitter:title"\s+content=")[^"]*(")/,       `$1${cfg.twTitle}$2`)
    .replace(/(<meta name="twitter:description"\s+content=")[^"]*(")/,  `$1${cfg.twDesc}$2`)
    .replace(/(<meta name="twitter:image"\s+content=")[^"]*(")/,       `$1${cfg.twImage}$2`);

  fs.mkdirSync(cfg.dir, { recursive: true });
  fs.writeFileSync(path.join(cfg.dir, 'index.html'), html, 'utf8');
  console.log(`✓ ${cfg.dir}/index.html`);
}
