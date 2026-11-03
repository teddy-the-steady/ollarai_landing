import './style.css';
import { lang, t, applyI18n, langSwitch, sitePath } from './beta/i18n.js';

// Paddle's default payment link (/checkout/). Payment links and payment-method update emails open
// this page with ?_ptxn=<transaction id>; Paddle.js sees it on Initialize and opens the checkout
// overlay by itself. Without _ptxn there is nothing to pay, so go to the pricing page.

const PADDLE_CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;

document.title = t('checkout.page-title');
applyI18n();
langSwitch(document.getElementById('lang-switch'));
document.getElementById('home-link').href = sitePath('/');
document.getElementById('checkout-pricing').href = sitePath('/pricing/');

const states = {
    loading: document.getElementById('checkout-loading'),
    closed: document.getElementById('checkout-closed'),
    error: document.getElementById('checkout-error'),
};

function show(state) {
    Object.entries(states).forEach(([name, node]) => node.classList.toggle('hidden', name !== state));
}

const transactionId = new URLSearchParams(window.location.search).get('_ptxn');

if (!transactionId) {
    window.location.replace(sitePath('/pricing/'));
} else if (!PADDLE_CLIENT_TOKEN || !window.Paddle) {
    console.error(PADDLE_CLIENT_TOKEN ? 'Paddle.js failed to load' : 'VITE_PADDLE_CLIENT_TOKEN is not set');
    show('error');
} else {
    // Sandbox client-side tokens start with test_
    if (PADDLE_CLIENT_TOKEN.startsWith('test_')) window.Paddle.Environment.set('sandbox');

    window.Paddle.Initialize({
        token: PADDLE_CLIENT_TOKEN,
        checkout: {
            settings: {
                displayMode: 'overlay',
                theme: 'dark',
                locale: lang,
                successUrl: `${window.location.origin}/account/`,
            },
        },
        eventCallback(event) {
            if (event.name === 'checkout.loaded') states.loading.classList.add('hidden');
            else if (event.name === 'checkout.closed') show('closed');
            else if (event.name === 'checkout.error') show('error');
        },
    });

    document.getElementById('checkout-reopen').addEventListener('click', () => {
        show('loading');
        window.Paddle.Checkout.open({ transactionId });
    });
}
