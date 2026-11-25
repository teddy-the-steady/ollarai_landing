import { createClient } from '@supabase/supabase-js';

// Supabase URL / publishable (anon) key are public by design; they end up in the bundle.
// Set them in .env.local (see .env.example).
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const API_URL = (import.meta.env.VITE_API_URL || 'https://api-dev.ollarai.com').replace(/\/$/, '');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
});

export const LOGIN_PATH = '/login/';
export const APP_PATH = '/app/';

// 401 detail.code when a newer sign-in of the same account (on another device) pushed this
// session out - the API allows a few sign-ins at once (service_pipeline/auth.py MAX_ACTIVE_SESSIONS).
export const SESSION_REVOKED = 'session_revoked';
let sessionRevoked = false;

// The login page, saying why when this session was pushed out.
export const loginUrl = () => LOGIN_PATH + (sessionRevoked ? `?reason=${SESSION_REVOKED}` : '');

// The buyer's name and phone number the Korean pricing page keeps for the member's next checkout
// (src/pricing.js) - this browser only, never sent to us. Gone on sign-out.
export const BUYER_KEY = 'ollarai-buyer';

export function forgetBuyer() {
    try { localStorage.removeItem(BUYER_KEY); } catch { /* storage blocked */ }
}

// This browser's session only: a global sign-out would end the other device's session too.
async function leaveRevokedSession() {
    sessionRevoked = true;
    forgetBuyer();
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    window.location.replace(loginUrl());
}

export class ApiError extends Error {
    constructor(status, detail, requestId = null) {
        super(typeof detail === 'string' ? detail : detail?.message || `HTTP ${status}`);
        this.status = status;
        this.detail = detail;
        this.requestId = requestId ?? detail?.request_id ?? null;
    }
}

// Calls the pipeline API with the current session's access token.
export async function api(path, { method = 'GET', body } = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new ApiError(401, 'Not signed in');

    let res;
    try {
        res = await fetch(API_URL + path, {
            method,
            headers: {
                Authorization: `Bearer ${session.access_token}`,
                ...(body ? { 'Content-Type': 'application/json' } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch (e) {
        throw new ApiError(0, 'network');
    }

    const data = await res.json().catch(() => null);
    if (res.status === 401 && data?.detail?.code === SESSION_REVOKED) await leaveRevokedSession();
    if (!res.ok) throw new ApiError(res.status, data?.detail ?? null, res.headers.get('X-Request-ID'));
    return data;
}

export async function signOut() {
    // Already signed out locally (pushed out): keep the reason on the way to the login page.
    forgetBuyer();
    if (sessionRevoked) return window.location.replace(loginUrl());
    await supabase.auth.signOut();
    window.location.href = LOGIN_PATH;
}
