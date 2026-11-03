import './style.css';
import { lang, t, applyI18n, langSwitch, sitePath } from './beta/i18n.js';
import { loadPaddle } from './beta/paddle.js';

// Paddle's default payment link (/checkout/). Payment links and payment-method update emails open
// this page with ?_ptxn=<transaction id>; Paddle.js sees it on Initialize and opens the checkout
// overlay by itself. Without _ptxn there is nothing to pay, so go to the pricing page.

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
} else {
    loadPaddle({
        lang,
        eventCallback(event) {
            if (event.name === 'checkout.loaded') states.loading.classList.add('hidden');
            else if (event.name === 'checkout.closed') show('closed');
            else if (event.name === 'checkout.error') show('error');
        },
    }).then(Paddle => {
        document.getElementById('checkout-reopen').addEventListener('click', () => {
            show('loading');
            Paddle.Checkout.open({ transactionId });
        });
    }).catch(error => {
        console.error(error);
        show('error');
    });
}
