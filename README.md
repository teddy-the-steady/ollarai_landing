# OllarAI Landing Page

AI-native investment research platform landing page built with Vite and Tailwind CSS.

## 🚀 Quick Start

### Development

```bash
npm install
npm run dev
```

The dev server will start at `http://localhost:5173` with hot module replacement.

### Production Build

```bash
# Build main site
npm run build

# Build with locale pages (en/, ja/)
npm run build:all
```

The optimized files will be in `dist/`:
```
dist/
├── index.html              # Main page (Korean)
├── en/
│   └── index.html          # English page with locale-specific OG tags
├── ja/
│   └── index.html          # Japanese page with locale-specific OG tags
└── assets/
    ├── index-[hash].js     # Bundled JavaScript (minified)
    └── index-[hash].css    # Bundled CSS (minified)
```

## 📦 Project Structure

```
.
├── index.html              # Main HTML template
├── src/
│   ├── main.js            # JavaScript entry point
│   └── style.css          # Tailwind CSS + custom styles
├── fonts/                 # Custom fonts
├── og/                    # Open Graph images
├── build-locale-pages.js  # Generates locale-specific pages
├── vite.config.js         # Vite configuration
└── tailwind.config.js     # Tailwind configuration
```

## 🌐 Localization

The build process generates three versions:
- `/` - Korean (default)
- `/en/` - English
- `/ja/` - Japanese

Each locale page has:
- Language-specific Open Graph tags for social sharing
- `<base href="/">` for correct asset paths
- Shared optimized CSS/JS bundles

## 🔧 Configuration

### Vite (`vite.config.js`)
- Output directory: `dist/`
- Asset naming with cache-busting hashes
- Auto-open browser in dev mode

### Tailwind (`tailwind.config.js`)
- Scans `index.html` and `src/**/*` for classes
- Build-time purge for optimal bundle size

### PostCSS (`postcss.config.js`)
- Tailwind CSS processing
- Autoprefixer for browser compatibility

## 📝 License

ISC
