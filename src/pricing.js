import './legal.js';
import { issueBillingKey, readRedirect } from './beta/portone.js';

// Pro checkout on the pricing pages. The dialog shows the notices and takes the consents the terms
// promise on the checkout screen, then:
// - en/ja: no overseas payment provider yet (being replaced) - the button is disabled in the HTML,
//   and submitting would only show the error state.
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
    const { supabase, api, ApiError, LOGIN_PATH, SESSION_REVOKED } = await loadApi();
    const { data } = await supabase.auth.getSession();
    const toLogin = () => { window.location.href = `${LOGIN_PATH}?lang=${lang}`; return null; };
    if (!data.session) return toLogin();
    try {
        return await api('/me');
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            if (error.detail?.code === SESSION_REVOKED) return null;  // api() is already on its way to the login page
            return toLogin();
        }
        throw error;
    }
}

// The name and phone number the member last typed in the form, kept in this browser so a reload or
// the return from PortOne's mobile window doesn't make them type it again. Only for the member who
// typed it; dropped once subscribed and on sign-out (api.js forgetBuyer).
async function savedBuyer(memberId) {
    const { BUYER_KEY } = await loadApi();
    try {
        const saved = JSON.parse(localStorage.getItem(BUYER_KEY));
        return saved?.memberId === memberId ? saved : null;
    } catch {
        return null;
    }
}

async function saveBuyer(memberId, fullName, phoneNumber) {
    const { BUYER_KEY } = await loadApi();
    try { localStorage.setItem(BUYER_KEY, JSON.stringify({ memberId, fullName, phoneNumber })); } catch { /* storage blocked */ }
}

// The billing key PortOne issued -> first payment on the server -> the thank-you page.
async function startDomesticSubscription(billingKey) {
    const { api, ApiError, forgetBuyer } = await loadApi();
    show('loading');
    try {
        await api('/subscription/portone', { method: 'POST', body: { billing_key: billingKey } });
        forgetBuyer();
        window.location.href = '/thanks/';
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
    // The member's saved name and number into empty fields (never over what they typed here)
    const fillBuyer = async () => {
        if (!domestic || !member) return;
        const saved = await savedBuyer(member.id);
        if (!saved) return;
        if (!form.elements.fullName.value) form.elements.fullName.value = saved.fullName || '';
        if (!form.elements.phoneNumber.value) form.elements.phoneNumber.value = saved.phoneNumber || '';
        updateSubmit();
    };
    [...checks, ...fields].forEach(input => input.addEventListener('input', updateSubmit));
    checks.forEach(check => check.addEventListener('change', updateSubmit));
    dialog.querySelectorAll('[data-action="close"]').forEach(btn => btn.addEventListener('click', () => dialog.close()));
    dialog.querySelectorAll('[data-action="back"]').forEach(btn => btn.addEventListener('click', () => show('consent')));

    button.addEventListener('click', async () => {
        // The thank-you page after payment (/thanks/) and the beta pages read this, so they stay in this language
        try { localStorage.setItem('ollarai-lang', lang); } catch { /* storage blocked */ }
        show('loading');
        dialog.showModal();
        try {
            member = await signedInMember();
            if (!member) return;
            if (member.paid_source === 'subscription' || member.paid_source === 'grant') show('subscribed');
            else {
                await fillBuyer();
                show('consent');
            }
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
            await saveBuyer(member.id, fullName, phoneNumber);
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

        // Overseas payments: provider not connected yet
        show('error');
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
            signedInMember().then(m => { member = m; return fillBuyer(); }).catch(console.error);
            issueFailed(returned);
        }
    }
}
