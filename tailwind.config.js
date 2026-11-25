/** @type {import('tailwindcss').Config} */
// `white` and `slate` read CSS variables (src/style.css :root / [data-theme="light"]) so the light theme can flip
// them: text-white becomes the darkest ink, white/5 overlays become dark tints, slate-200 body text becomes slate-800.
const themed = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;
const slate = Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(s => [s, themed(`slate-${s}`)]));

export default {
  content: [
    "./index.html",
    "./privacy/**/*.html",
    "./terms/**/*.html",
    "./pricing/**/*.html",
    "./login/**/*.html",
    "./app/**/*.html",
    "./account/**/*.html",
    "./thanks/**/*.html",
    "./en/**/*.html",
    "./ja/**/*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        white: themed('white'),
        slate,
      },
    },
  },
  plugins: [],
}
