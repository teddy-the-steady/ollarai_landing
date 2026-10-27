import './style.css';
import { supabase, APP_PATH } from './beta/api.js';
import { t, applyI18n, langSwitch, sitePath } from './beta/i18n.js';

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
    showError('');
    showNotice('');
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

function validate() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t('auth.invalid.email');
    if (password.length < 8) return t('auth.invalid.password');
    if (mode === 'signup') {
        if (password !== confirmInput.value) return t('auth.invalid.mismatch');
        if (!consentInput.checked) return t('auth.invalid.consent');
    }
    return '';
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    showNotice('');

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
            options: { emailRedirectTo: window.location.origin + APP_PATH },
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
        form.reset();
    } catch (error) {
        console.error(error);
        showError(authErrorMessage(error));
    } finally {
        submitBtn.disabled = false;
    }
});
