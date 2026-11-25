// PortOne browser SDK (V2) for domestic card subscriptions on the Korean pricing page: issues a
// KG Inicis billing key in Inicis's checkout window. The server charges the first month with it
// (POST /subscription/portone) and each month after that. Loaded on demand.

const SDK = 'https://cdn.portone.io/v2/browser-sdk.js';
const STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID;
const CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY;
export const PRICE_KRW = 9900;

let loading = null;

function loadSdk() {
    if (!loading) {
        loading = window.PortOne ? Promise.resolve(window.PortOne) : new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = SDK;
            script.onload = () => resolve(window.PortOne);
            script.onerror = () => reject(new Error('PortOne SDK failed to load'));
            document.head.appendChild(script);
        });
        loading.catch(() => { loading = null; });
    }
    return loading;
}

// Opens the checkout window. Resolves to { billingKey } or { code, message } (code is set when it
// failed or the member closed it). On mobile the page goes to redirectUrl instead and comes back
// with ?billingKey=... or ?code=...&message=... (readRedirect).
export async function issueBillingKey({ member, fullName, phoneNumber, redirectUrl }) {
    if (!STORE_ID || !CHANNEL_KEY) throw new Error('VITE_PORTONE_STORE_ID / VITE_PORTONE_CHANNEL_KEY are not set');
    const PortOne = await loadSdk();
    const response = await PortOne.requestIssueBillingKey({
        storeId: STORE_ID,
        channelKey: CHANNEL_KEY,
        billingKeyMethod: 'CARD',
        // KG Inicis: issueId (ASCII) and issueName are required
        issueId: `sub-${member.id.slice(0, 8)}-${Date.now()}`,
        issueName: '올라AI Pro 정기결제',
        // Shown in the window; with both set Inicis opens its newer PC window
        displayAmount: PRICE_KRW,
        currency: 'KRW',
        // The server checks the key belongs to this member (customer.id)
        customer: {
            customerId: member.id,
            fullName,
            phoneNumber,
            email: member.email || undefined,
        },
        // Required on mobile: the period the subscription is offered for
        offerPeriod: { interval: '1m' },
        redirectUrl,
    });
    return response || {};
}

// The result PortOne appended to redirectUrl on mobile, or null when this isn't a return from it.
export function readRedirect(search = window.location.search) {
    const params = new URLSearchParams(search);
    if (!params.has('billingKey') && !params.has('code')) return null;
    return {
        billingKey: params.get('billingKey') || undefined,
        code: params.get('code') || undefined,
        message: params.get('message') || undefined,
    };
}
