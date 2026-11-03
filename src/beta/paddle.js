// Paddle.js for overseas payments (en/ja pricing pages, /checkout/). Loaded on demand: Paddle.Initialize
// may run once per page, so every caller goes through loadPaddle().

const PADDLE_JS = 'https://cdn.paddle.com/paddle/v2/paddle.js';
const CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
export const PADDLE_PRICE_ID = import.meta.env.VITE_PADDLE_PRICE_ID;

let loading = null;

function loadScript() {
    if (window.Paddle) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = PADDLE_JS;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Paddle.js failed to load'));
        document.head.appendChild(script);
    });
}

// Resolves to window.Paddle, initialized. lang: 'en' | 'ja' | 'ko' for the checkout;
// eventCallback gets the checkout events (checkout.loaded, checkout.closed, ...).
export function loadPaddle({ lang, eventCallback } = {}) {
    if (!loading) {
        if (!CLIENT_TOKEN) return Promise.reject(new Error('VITE_PADDLE_CLIENT_TOKEN is not set'));
        loading = loadScript().then(() => {
            // Sandbox client-side tokens start with test_
            if (CLIENT_TOKEN.startsWith('test_')) window.Paddle.Environment.set('sandbox');
            window.Paddle.Initialize({
                token: CLIENT_TOKEN,
                checkout: {
                    settings: {
                        displayMode: 'overlay',
                        theme: 'dark',
                        locale: lang,
                        successUrl: `${window.location.origin}/account/?lang=${lang}`,
                    },
                },
                eventCallback,
            });
            return window.Paddle;
        });
        loading.catch(() => { loading = null; });
    }
    return loading;
}
