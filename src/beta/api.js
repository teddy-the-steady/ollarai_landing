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

export class ApiError extends Error {
    constructor(status, detail) {
        super(typeof detail === 'string' ? detail : detail?.message || `HTTP ${status}`);
        this.status = status;
        this.detail = detail;
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
    if (!res.ok) throw new ApiError(res.status, data?.detail ?? null);
    return data;
}

export async function signOut() {
    await supabase.auth.signOut();
    window.location.href = LOGIN_PATH;
}
