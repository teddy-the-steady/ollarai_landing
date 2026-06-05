// Generates en/index.html and ja/index.html from index.html
// with locale-specific OG meta tags pre-baked for social crawlers.
// Run: node build-locale-pages.js

const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://ollarai.com'; // absolute base for og:image (crawlers ignore <base href>)

const base = fs.readFileSync('index.html', 'utf8');

const locales = {
  en: {
    dir: 'en',
    ogTitle:       'OllarAI - When Data Becomes the Answer to Investment',
    ogDesc:        'Zero hallucination AI-native investment research platform. Go beyond intuition. Invest with real market data and filings.',
    ogImage:       `${DOMAIN}/og/ollarai-og-image.png`,
    ogImageType:   'image/png',
    ogLocale:      'en_US',
    twTitle:       'OllarAI - When Data Becomes the Answer to Investment',
    twDesc:        'Zero hallucination AI-native investment research platform. Go beyond intuition. Invest with real market data and filings.',
    twImage:       `${DOMAIN}/og/ollarai-og-image.png`,
  },
  ja: {
    dir: 'ja',
    ogTitle:       'OllarAI - データが投資の答えになる瞬間',
    ogDesc:        'ハルシネーションなし。開示データをそのまま取得するAI投資リサーチプラットフォーム。',
    ogImage:       `${DOMAIN}/og/ollarai-og-image-ja.png`,
    ogImageType:   'image/png',
    ogLocale:      'ja_JP',
    twTitle:       'OllarAI - データが投資の答えになる瞬間',
    twDesc:        'ハルシネーションなし。開示データをそのまま取得するAI投資リサーチプラットフォーム。',
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
