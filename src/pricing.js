import './legal.js';
import { loadPaddle, PADDLE_PRICE_ID } from './beta/paddle.js';

// Pro checkout on the en/ja pricing pages (overseas payments through Paddle; the Korean page will use
// Toss Payments). The dialog shows the notices and takes the consents the terms promise on the checkout
// screen, then opens Paddle's overlay with the member's id in customData - the webhook
// (POST /webhooks/paddle) finds the member by it, so a signed-out visitor goes to sign in first.

const button = document.getElementById('subscribe-btn');
const dialog = document.getElementById('subscribe-dialog');
const lang = document.documentElement.lang;

function show(state) {
    dialog.querySelectorAll('[data-state]').forEach(node => node.classList.toggle('hidden', node.dataset.state !== state));
}

async function signedInMember() {
    // Supabase only loads when someone wants to subscribe
    const { supabase, api, ApiError, LOGIN_PATH } = await import('./beta/api.js');
    const { data } = await supabase.auth.getSession();
    const toLogin = () => { window.location.href = `${LOGIN_PATH}?lang=${lang}`; return null; };
    if (!data.session) return toLogin();
    try {
        return await api('/me');
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) return toLogin();
        throw error;
    }
}

if (button && dialog) {
    const form = dialog.querySelector('form');
    const checks = [...form.querySelectorAll('input[type="checkbox"]')];
    const submit = form.querySelector('button[type="submit"]');
    let member = null;

    checks.forEach(check => check.addEventListener('change', () => {
        submit.disabled = !checks.every(c => c.checked);
    }));
    dialog.querySelectorAll('[data-action="close"]').forEach(btn => btn.addEventListener('click', () => dialog.close()));

    button.addEventListener('click', async () => {
        show('loading');
        dialog.showModal();
        try {
            member = await signedInMember();
            if (!member) return;
            if (member.paid_source === 'subscription' || member.paid_source === 'grant') show('subscribed');
            else show('consent');
        } catch (error) {
            console.error(error);
            show('error');
        }
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!checks.every(c => c.checked) || !member) return;
        show('loading');
        try {
            if (!PADDLE_PRICE_ID) throw new Error('VITE_PADDLE_PRICE_ID is not set');
            const Paddle = await loadPaddle({ lang });
            dialog.close();
            Paddle.Checkout.open({
                items: [{ priceId: PADDLE_PRICE_ID, quantity: 1 }],
                customer: member.email ? { email: member.email } : undefined,
                customData: { user_id: member.id },
            });
        } catch (error) {
            console.error(error);
            show('error');
        }
    });
}
