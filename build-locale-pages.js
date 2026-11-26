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
    title:         'OllarAI - Financials & Market Data, Just Ask',
    ogTitle:       'OllarAI - Financials & Market Data, Just Ask',
    ogDesc:        'Ask about financial statements, stock prices, or P/E and ROE. OllarAI finds the figures in filings and market data for 9,300+ Korean and US-listed companies, and every number links to its source filing.',
    ogImage:       `${DOMAIN}/og/ollarai-og-2611b-en.png`,
    ogImageType:   'image/png',
    ogLocale:      'en_US',
    twTitle:       'OllarAI - Financials & Market Data, Just Ask',
    twDesc:        'Ask about financial statements, stock prices, or P/E and ROE. OllarAI finds the figures in filings and market data for 9,300+ Korean and US-listed companies, and every number links to its source filing.',
    twImage:       `${DOMAIN}/og/ollarai-og-2611b-en.png`,
  },
  ja: {
    dir: 'dist/ja',
    title:         'OllarAI - 財務・株価データ、聞けばすぐ',
    ogTitle:       'OllarAI - 財務・株価データ、聞けばすぐ',
    ogDesc:        '財務諸表、株価、PER・ROEを聞けば、韓国・米国の上場企業9,300社以上の開示と株価データから数字を探して表で表示します。すべての数字に開示原文へのリンク付き。',
    ogImage:       `${DOMAIN}/og/ollarai-og-2611b-ja.png`,
    ogImageType:   'image/png',
    ogLocale:      'ja_JP',
    twTitle:       'OllarAI - 財務・株価データ、聞けばすぐ',
    twDesc:        '財務諸表、株価、PER・ROEを聞けば、韓国・米国の上場企業9,300社以上の開示と株価データから数字を探して表で表示します。すべての数字に開示原文へのリンク付き。',
    twImage:       `${DOMAIN}/og/ollarai-og-2611b-ja.png`,
  },
};

for (const [lang, cfg] of Object.entries(locales)) {
  let html = base;

  // Add <base href="/"> so all relative asset paths resolve from root
  html = html.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n    <base href="/">');

  // The ko page leads with 올라AI (title, description, site name, JSON-LD); en/ja lead with OllarAI and
  // keep 올라AI as an alternate name.
  html = html
    .replace('<html lang="ko">', `<html lang="${lang}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${cfg.title}</title>`)
    .replace(/(<meta name="description"\s+content=")[^"]*(")/,       `$1${cfg.ogDesc}$2`)
    .replace(/(<meta property="og:site_name"\s+content=")[^"]*(")/,   '$1OllarAI$2')
    .replace(/"name": "올라AI",(\s*)"alternateName": \["OllarAI", /g, '"name": "OllarAI",$1"alternateName": ["올라AI", ');

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
