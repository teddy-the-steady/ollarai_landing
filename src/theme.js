// Light / dark theme. The first visit follows the system setting (and keeps following it while it changes);
// once the toggle is pressed the choice is saved and kept. The inline script in each page's <head> sets
// <html data-theme> before the first paint, so there is no flash - this module only wires the toggle buttons.
// Public pages put `<button type="button" data-theme-toggle class="theme-toggle"></button>` in their nav;
// signed-in pages (/app/, /account/) have it in the settings page (src/account.js) instead.

const KEY = 'theme';
const root = document.documentElement;
const systemLight = window.matchMedia('(prefers-color-scheme: light)');

function stored() {
    try {
        const v = localStorage.getItem(KEY);
        return v === 'light' || v === 'dark' ? v : null;
    } catch {
        return null;
    }
}

export const currentTheme = () => (root.dataset.theme === 'light' ? 'light' : 'dark');
// What the person picked: 'system' until they choose (the settings page offers all three)
export const themeChoice = () => stored() ?? 'system';
const systemTheme = () => (systemLight.matches ? 'light' : 'dark');

function apply(theme) {
    if (root.dataset.theme === theme) return;
    root.dataset.theme = theme;
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

// 'light' | 'dark' is kept; 'system' forgets the choice and follows the system again
export function setTheme(choice) {
    try {
        if (choice === 'system') localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, choice);
    } catch { /* private mode: still switches for this page */ }
    apply(choice === 'system' ? systemTheme() : choice);
}

// No saved choice yet: follow the system as it changes (e.g. macOS auto appearance at sunset)
systemLight.addEventListener('change', (e) => {
    if (!stored()) apply(systemTheme());
});
// Another tab picked a theme
window.addEventListener('storage', (e) => {
    if (e.key === KEY) apply(e.newValue === 'light' || e.newValue === 'dark' ? e.newValue : systemTheme());
});

const LABELS = {
    ko: { light: '라이트 모드로 전환', dark: '다크 모드로 전환' },
    en: { light: 'Switch to light mode', dark: 'Switch to dark mode' },
    ja: { light: 'ライトモードに切り替え', dark: 'ダークモードに切り替え' },
};

const SUN = '<svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
const MOON = '<svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

const buttons = [...document.querySelectorAll('[data-theme-toggle]')];

// The button shows where it goes: a moon in light mode, a sun in dark mode (CSS picks the icon by data-theme)
function label() {
    const texts = LABELS[(root.lang || 'ko').slice(0, 2)] ?? LABELS.en;
    const text = texts[currentTheme() === 'light' ? 'dark' : 'light'];
    buttons.forEach(btn => {
        btn.setAttribute('aria-label', text);
        btn.title = text;
    });
}

buttons.forEach(btn => {
    btn.innerHTML = SUN + MOON;
    btn.addEventListener('click', () => setTheme(currentTheme() === 'light' ? 'dark' : 'light'));
});
label();
window.addEventListener('themechange', label);
// The landing page switches language in place
new MutationObserver(label).observe(root, { attributes: true, attributeFilter: ['lang'] });
