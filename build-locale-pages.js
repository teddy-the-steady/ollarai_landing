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
    ogTitle:       'Ollarai - Financials & Market Data, Just Ask',
    ogDesc:        'Spend zero minutes hunting for numbers. Ask about financial statements, stock prices and volume, or metrics like P/E and ROE, and get exact figures from filings and market data.',
    ogImage:       `${DOMAIN}/og/ollarai-og-image.png`,
    ogImageType:   'image/png',
    ogLocale:      'en_US',
    twTitle:       'Ollarai - Financials & Market Data, Just Ask',
    twDesc:        'Spend zero minutes hunting for numbers. Ask about financial statements, stock prices and volume, or metrics like P/E and ROE, and get exact figures from filings and market data.',
    twImage:       `${DOMAIN}/og/ollarai-og-image.png`,
  },
  ja: {
    dir: 'dist/ja',
    ogTitle:       'Ollarai - 財務・株価データ、聞けばすぐ',
    ogDesc:        '数字を探す時間は0分に。財務諸表から株価・出来高、PER・ROEなどの指標まで、質問すれば開示資料と株価データから正確な数値を見つけるAIデータ検索。',
    ogImage:       `${DOMAIN}/og/ollarai-og-image-ja.png`,
    ogImageType:   'image/png',
    ogLocale:      'ja_JP',
    twTitle:       'Ollarai - 財務・株価データ、聞けばすぐ',
    twDesc:        '数字を探す時間は0分に。財務諸表から株価・出来高、PER・ROEなどの指標まで、質問すれば開示資料と株価データから正確な数値を見つけるAIデータ検索。',
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
