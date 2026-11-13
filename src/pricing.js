import './legal.js';
import { loadPaddle, PADDLE_PRICE_ID } from './beta/paddle.js';
import { issueBillingKey, readRedirect } from './beta/portone.js';

// Pro checkout on the pricing pages. The dialog shows the notices and takes the consents the terms
// promise on the checkout screen, then:
// - en/ja: Paddle's overlay with the member's id in customData - the webhook (POST /webhooks/paddle)
//   finds the member by it.
// - ko: PortOne's KG Inicis window issues a billing key for the member (customer id = member id);
//   POST /subscription/portone charges the first month with it and opens the subscription. On
//   mobile the window takes over the page and comes back here with ?billingKey= (or ?code=).
// Either way a signed-out visitor goes to sign in first.

const button = document.getElementById('subscribe-btn');
const dialog = document.getElementById('subscribe-dialog');
const lang = document.documentElement.lang;
const domestic = lang === 'ko';

function show(state, message) {
    dialog.querySelectorAll('[data-state]').forEach(node => node.classList.toggle('hidden', node.dataset.state !== state));
    const slot = dialog.querySelector(`[data-state="${state}"] [data-message]`);
    if (slot) {
        slot.textContent = message || '';
        slot.classList.toggle('hidden', !message);
    }
}

async function loadApi() {
    // Supabase only loads when someone wants to subscribe
    return import('./beta/api.js');
}

async function signedInMember() {
    const { supabase, api, ApiError, LOGIN_PATH } = await loadApi();
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

// The billing key PortOne issued -> first payment on the server -> the subscription screen.
async function startDomesticSubscription(billingKey) {
    const { api, ApiError } = await loadApi();
    show('loading');
    try {
        await api('/subscription/portone', { method: 'POST', body: { billing_key: billingKey } });
        window.location.href = '/account/?lang=ko';
    } catch (error) {
        console.error(error);
        if (error instanceof ApiError && error.status === 402) show('declined', error.detail?.message);
        else if (error instanceof ApiError && error.status === 409) show('subscribed');
        else show('error');
    }
}

// PortOne's answer when no billing key came back: closed by the member, or refused.
function issueFailed(result) {
    // The member closed the window: back to the form as it was
    if (/cancel|취소/i.test(`${result.code} ${result.message}`)) show('consent');
    else show('declined', result.message);
}

function normalizedPhone(value) {
    const digits = value.replace(/\D/g, '');
    return /^01\d{8,9}$/.test(digits) ? digits : null;
}

if (button && dialog) {
    const form = dialog.querySelector('form');
    const checks = [...form.querySelectorAll('input[type="checkbox"]')];
    const fields = [...form.querySelectorAll('input[type="text"], input[type="tel"]')];
    const submit = form.querySelector('button[type="submit"]');
    let member = null;

    const updateSubmit = () => {
        submit.disabled = !checks.every(c => c.checked) || !fields.every(f => f.value.trim());
    };
    [...checks, ...fields].forEach(input => input.addEventListener('input', updateSubmit));
    checks.forEach(check => check.addEventListener('change', updateSubmit));
    dialog.querySelectorAll('[data-action="close"]').forEach(btn => btn.addEventListener('click', () => dialog.close()));
    dialog.querySelectorAll('[data-action="back"]').forEach(btn => btn.addEventListener('click', () => show('consent')));

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

        if (domestic) {
            const fullName = form.elements.fullName.value.trim();
            const phoneNumber = normalizedPhone(form.elements.phoneNumber.value);
            if (!phoneNumber) {
                form.elements.phoneNumber.setCustomValidity('휴대폰 번호를 숫자 10~11자리로 입력해 주세요');
                form.elements.phoneNumber.reportValidity();
                form.elements.phoneNumber.addEventListener('input', () => form.elements.phoneNumber.setCustomValidity(''), { once: true });
                return;
            }
            // A modal <dialog> sits in the top layer, above PortOne's window - close it while that is
            // open (the form keeps its values), and bring it back for the result.
            dialog.close();
            let result;
            try {
                result = await issueBillingKey({
                    member, fullName, phoneNumber,
                    redirectUrl: `${window.location.origin}/pricing/`,
                });
            } catch (error) {
                console.error(error);
                dialog.showModal();
                show('error');
                return;
            }
            dialog.showModal();
            if (result.billingKey && !result.code) await startDomesticSubscription(result.billingKey);
            else issueFailed(result);
            return;
        }

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

    // Back from PortOne's mobile window
    const returned = domestic ? readRedirect() : null;
    if (returned) {
        window.history.replaceState(null, '', window.location.pathname);
        dialog.showModal();
        if (returned.billingKey && !returned.code) {
            startDomesticSubscription(returned.billingKey);
        } else {
            // The form needs the member again if they retry
            signedInMember().then(m => { member = m; }).catch(console.error);
            issueFailed(returned);
        }
    }
}
