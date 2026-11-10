import './style.css';
import { supabase, APP_PATH, LOGIN_PATH } from './beta/api.js';
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
const passwordLabel = document.getElementById('auth-password-label');
// Email the verification link was last sent to (or a login was refused for), for "resend"
let unverifiedEmail = '';

// forgot: ask for a reset email. reset: set a new password after following that email's link.
const MODES = {
    login: { title: t('login.title'), subtitle: t('login.subtitle'), submit: t('login.submit') },
    signup: { title: t('signup.title'), subtitle: t('signup.subtitle'), submit: t('signup.submit') },
    forgot: { title: t('forgot.title'), subtitle: t('forgot.subtitle'), submit: t('forgot.submit') },
    reset: { title: t('reset.title'), subtitle: t('reset.subtitle'), submit: t('reset.submit') },
};
let mode = 'login';
const isNewPassword = () => mode === 'signup' || mode === 'reset';

// The reset email's link comes back here with a recovery session in the hash (type=recovery),
// or with error_code=otp_expired etc. when the link is stale. Read it before supabase-js clears it.
const hashParams = new URLSearchParams(window.location.hash.slice(1));
const recovering = hashParams.get('type') === 'recovery';
// The mobile Google sign-in comes back as /login/#google_credential=<ID token>, or #google_error=<code>
// when it was cancelled or failed (cloudfront/google-login-redirect.js). Drop it from the address bar right away.
const googleCredential = hashParams.get('google_credential');
const googleError = hashParams.get('google_error');
const googleReturned = googleCredential !== null || googleError !== null;
if (googleReturned) history.replaceState(null, '', window.location.pathname + window.location.search);

// Already signed in -> straight to the app (except a recovery session, which still needs the new password)
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session && !recovering && mode !== 'reset') window.location.replace(APP_PATH);
});
supabase.auth.onAuthStateChange(event => {
    if (event === 'PASSWORD_RECOVERY' && mode !== 'reset') setMode('reset');
});

function setMode(next) {
    mode = next;
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.toggle('is-active', tab.dataset.mode === mode));
    document.querySelectorAll('[data-modes]').forEach(el => {
        el.classList.toggle('hidden', !el.dataset.modes.split(' ').includes(mode));
    });
    document.getElementById('auth-title').textContent = MODES[mode].title;
    document.getElementById('auth-subtitle').textContent = MODES[mode].subtitle;
    submitBtn.textContent = MODES[mode].submit;
    passwordLabel.textContent = t(mode === 'reset' ? 'auth.new-password' : 'auth.password');
    passwordInput.autocomplete = isNewPassword() ? 'new-password' : 'current-password';
    // The rule is only shown (and checked) for new passwords; older accounts may predate it
    passwordInput.placeholder = isNewPassword() ? t('auth.password-placeholder') : '';
    showError('');
    showNotice('');
    showResend('');
}

document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => setMode(tab.dataset.mode));
});
document.getElementById('auth-forgot').addEventListener('click', () => setMode('forgot'));
document.getElementById('auth-back').addEventListener('click', () => setMode('login'));

if (recovering) {
    setMode('reset');
} else if (hashParams.get('error_code')) {
    setMode('forgot');
    showError(t('auth.error.link-expired'));
}

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

async function signInWithGoogle(credential, nonce) {
    showError('');
    showNotice('');
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: credential, nonce });
    if (error) {
        console.error(error);
        showError(authErrorMessage(error));
        return;
    }
    window.location.replace(APP_PATH);
}

// Mobile can't use GIS:
//   - the GIS popup hands the credential back through a second account sheet (iOS Chrome) or gets stuck in it
//   - every flow where Google POSTs an ID token back to us (GIS redirect mode /gsi/select, and
//     response_type=id_token&response_mode=form_post) ends in a bare accounts.google.com 500 on iOS for
//     some signed-in Google sessions; the code flow passes there (checked on an affected iPhone)
// So mobile runs an authorization code flow with our own redirect_uri (Google's screen names our site,
// unlike the Supabase redirect): /auth/google exchanges the code and bounces the ID token back here in
// the hash. The raw nonce waits in sessionStorage (same tab); Google gets its hash and puts it in the token.
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS reports as Mac
const NONCE_KEY = 'ollarai-google-nonce';

function finishGoogleRedirect() {
    let nonce = null;
    try {
        nonce = sessionStorage.getItem(NONCE_KEY);
        sessionStorage.removeItem(NONCE_KEY);
    } catch { /* storage blocked */ }
    // access_denied: the user backed out of Google's screen, nothing to report
    if (googleError === 'access_denied') return;
    if (googleError !== null || !googleCredential || !nonce) {
        showError(t('auth.error.generic'));
        return;
    }
    signInWithGoogle(googleCredential, nonce);
}

async function startGoogleCodeFlow() {
    const { nonce, hashed } = await makeNonce();
    sessionStorage.setItem(NONCE_KEY, nonce); // throws when storage is blocked -> Supabase redirect instead
    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        response_type: 'code',
        redirect_uri: window.location.origin + '/auth/google',
        scope: 'openid email profile',
        nonce: hashed,
        prompt: 'select_account',
        hl: lang,
    });
    window.location.assign('https://accounts.google.com/o/oauth2/v2/auth?' + params);
}

async function setUpGis() {
    if (!GOOGLE_CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID is not set');
    const [{ nonce, hashed }] = await Promise.all([makeNonce(), loadGis()]);
    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: hashed,
        callback: ({ credential }) => signInWithGoogle(credential, nonce),
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

if (googleReturned) finishGoogleRedirect();

// Mobile: our button (startGoogleCodeFlow). Desktop: the GIS button, or ours with the Supabase redirect if GIS fails.
if (isMobile) {
    useRedirectGoogle();
} else {
    setUpGis().catch(error => {
        console.error(error);
        useRedirectGoogle();
    });
}

googleBtn.addEventListener('click', async () => {
    showError('');
    showNotice('');
    googleBtn.disabled = true;
    if (isMobile && GOOGLE_CLIENT_ID) {
        try {
            await startGoogleCodeFlow();
            return;
        } catch (error) {
            console.error(error);
        }
    }
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

// Back from Google's page via the back/forward cache: the button is still disabled from the click
window.addEventListener('pageshow', e => {
    if (e.persisted) googleBtn.disabled = false;
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
    // updateUser without a (still valid) recovery session
    if (error.name === 'AuthSessionMissingError') return t('auth.error.link-expired');
    switch (error.code) {
        case 'same_password': return t('auth.error.same-password');
        case 'session_not_found':
        case 'session_expired': return t('auth.error.link-expired');
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
    if (mode !== 'reset' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t('auth.invalid.email');
    if (mode === 'forgot') return '';
    if (password.length < 8) return t('auth.invalid.password');
    if (isNewPassword()) {
        if (!PASSWORD_RULE.every(re => re.test(password))) return t('auth.invalid.password-rule');
        if (password !== confirmInput.value) return t('auth.invalid.mismatch');
    }
    if (mode === 'signup' && !consentInput.checked) return t('auth.invalid.consent');
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

        if (mode === 'forgot') {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + LOGIN_PATH,
            });
            if (error) throw error;
            // Same answer whether or not the address has an account (Supabase doesn't say either)
            showNotice(t('auth.reset-sent', { email }));
            return;
        }

        if (mode === 'reset') {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            form.reset();
            showNotice(t('auth.reset-done'));
            setTimeout(() => window.location.replace(APP_PATH), 1500);
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
