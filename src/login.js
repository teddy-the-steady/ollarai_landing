import './style.css';
import { supabase, APP_PATH } from './beta/api.js';
import { lang, t, applyI18n, langSwitch, sitePath } from './beta/i18n.js';

document.title = t('login.page-title');
applyI18n(document, { terms: sitePath('/terms/'), privacy: sitePath('/privacy/') });
langSwitch(document.getElementById('lang-switch'));
document.getElementById('home-link').href = sitePath('/');

const form = document.getElementById('auth-form');
const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');
const confirmInput = document.getElementById('auth-password-confirm');
const consentInput = document.getElementById('auth-consent');
const submitBtn = document.getElementById('auth-submit');
const errorEl = document.getElementById('auth-error');
const noticeEl = document.getElementById('auth-notice');
const resendBtn = document.getElementById('auth-resend');
const googleBtn = document.getElementById('auth-google');
// Email the verification link was last sent to (or a login was refused for), for "resend"
let unverifiedEmail = '';

const MODES = {
    login: { title: t('login.title'), subtitle: t('login.subtitle'), submit: t('login.submit') },
    signup: { title: t('signup.title'), subtitle: t('signup.subtitle'), submit: t('signup.submit') },
};
let mode = 'login';

// Already signed in -> straight to the app
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) window.location.replace(APP_PATH);
});

function setMode(next) {
    mode = next;
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.toggle('is-active', tab.dataset.mode === mode));
    document.querySelectorAll('[data-signup-only]').forEach(el => {
        el.classList.toggle('hidden', mode !== 'signup');
        el.classList.toggle('flex', mode === 'signup');
    });
    document.getElementById('auth-title').textContent = MODES[mode].title;
    document.getElementById('auth-subtitle').textContent = MODES[mode].subtitle;
    submitBtn.textContent = MODES[mode].submit;
    passwordInput.autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
    // The rule is only shown (and checked) for new passwords; older accounts may predate it
    passwordInput.placeholder = mode === 'signup' ? t('auth.password-placeholder') : '';
    showError('');
    showNotice('');
    showResend('');
}

document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => setMode(tab.dataset.mode));
});

function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.toggle('hidden', !message);
}

function showNotice(message) {
    noticeEl.textContent = message;
    noticeEl.classList.toggle('hidden', !message);
}

function showResend(email) {
    unverifiedEmail = email;
    resendBtn.classList.toggle('hidden', !email);
}

const redirectTo = () => window.location.origin + APP_PATH;

// Google accounts come back verified, so Supabase links them to an email sign-up with the same
// (verified) address: one auth user id, one row in our users table, same approval status.
//
// Google Identity Services runs the sign-in on our own origin, so Google's prompt names our site
// instead of the Supabase callback domain. The ID token goes to Supabase with the raw nonce;
// Google gets its SHA-256 hash. If GIS can't load, the redirect button below is the fallback.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const gisContainer = document.getElementById('auth-google-gis');

function useRedirectGoogle() {
    gisContainer.remove();
    googleBtn.classList.remove('hidden');
}

function loadGis() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function makeNonce() {
    const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce));
    const hashed = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    return { nonce, hashed };
}

async function setUpGis() {
    if (!GOOGLE_CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID is not set');
    const [{ nonce, hashed }] = await Promise.all([makeNonce(), loadGis()]);
    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: hashed,
        callback: async ({ credential }) => {
            showError('');
            showNotice('');
            const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: credential, nonce });
            if (error) {
                console.error(error);
                showError(authErrorMessage(error));
                return;
            }
            window.location.replace(APP_PATH);
        },
    });
    google.accounts.id.renderButton(gisContainer, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        locale: lang,
        width: Math.min(400, gisContainer.offsetWidth),
    });
}

setUpGis().catch(error => {
    console.error(error);
    useRedirectGoogle();
});

googleBtn.addEventListener('click', async () => {
    showError('');
    showNotice('');
    googleBtn.disabled = true;
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectTo() },
    });
    if (error) {
        console.error(error);
        showError(authErrorMessage(error));
        googleBtn.disabled = false;
    }
});

resendBtn.addEventListener('click', async () => {
    showError('');
    resendBtn.disabled = true;
    const email = unverifiedEmail;
    const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: redirectTo() },
    });
    resendBtn.disabled = false;
    if (error) {
        console.error(error);
        showError(authErrorMessage(error));
        return;
    }
    showNotice(t('auth.confirm-sent', { email }));
});

// Supabase auth error codes -> user-facing messages
function authErrorMessage(error) {
    switch (error.code) {
        case 'invalid_credentials': return t('auth.error.invalid-credentials');
        case 'email_not_confirmed': return t('auth.error.email-not-confirmed');
        case 'user_already_exists':
        case 'email_exists': return t('auth.error.exists');
        case 'weak_password': return t('auth.error.weak-password');
        case 'over_request_rate_limit':
        case 'over_email_send_rate_limit': return t('auth.error.rate-limit');
        default: return t('auth.error.generic');
    }
}

// Sign-up password: 8+ characters with an uppercase, lowercase, digit and symbol
const PASSWORD_RULE = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9\s]/];

function validate() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t('auth.invalid.email');
    if (password.length < 8) return t('auth.invalid.password');
    if (mode === 'signup') {
        if (!PASSWORD_RULE.every(re => re.test(password))) return t('auth.invalid.password-rule');
        if (password !== confirmInput.value) return t('auth.invalid.mismatch');
        if (!consentInput.checked) return t('auth.invalid.consent');
    }
    return '';
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    showNotice('');
    showResend('');

    const invalid = validate();
    if (invalid) {
        showError(invalid);
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    submitBtn.disabled = true;

    try {
        if (mode === 'login') {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            window.location.replace(APP_PATH);
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            // lang ends up in user_metadata, where the email templates read it as .Data.lang
            options: { emailRedirectTo: redirectTo(), data: { lang } },
        });
        if (error) throw error;
        // With email confirmation on, Supabase answers an existing email with a user that has no identities
        if (data.user && data.user.identities?.length === 0) {
            showError(authErrorMessage({ code: 'user_already_exists' }));
            return;
        }
        if (data.session) {
            window.location.replace(APP_PATH);
            return;
        }
        // Email confirmation is on: no session until the link is clicked
        showNotice(t('auth.confirm-sent', { email }));
        showResend(email);
        form.reset();
    } catch (error) {
        console.error(error);
        showError(authErrorMessage(error));
        if (error.code === 'email_not_confirmed') showResend(email);
    } finally {
        submitBtn.disabled = false;
    }
});
