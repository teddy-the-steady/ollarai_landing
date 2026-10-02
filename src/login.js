import './style.css';
import { supabase, APP_PATH } from './beta/api.js';

const form = document.getElementById('auth-form');
const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');
const confirmInput = document.getElementById('auth-password-confirm');
const consentInput = document.getElementById('auth-consent');
const submitBtn = document.getElementById('auth-submit');
const errorEl = document.getElementById('auth-error');
const noticeEl = document.getElementById('auth-notice');

const MODES = {
    login: { title: '로그인', subtitle: '베타 테스트에 참여하려면 로그인해 주세요.', submit: '로그인' },
    signup: { title: '회원가입', subtitle: '이메일로 가입하고 베타 테스트를 신청하세요.', submit: '가입하기' },
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

// Supabase auth error codes -> user-facing Korean messages
function authErrorMessage(error) {
    switch (error.code) {
        case 'invalid_credentials': return '이메일 또는 비밀번호가 올바르지 않아요.';
        case 'email_not_confirmed': return '이메일 인증이 아직 완료되지 않았어요. 받은 메일함을 확인해 주세요.';
        case 'user_already_exists':
        case 'email_exists': return '이미 가입된 이메일이에요. 로그인해 주세요.';
        case 'weak_password': return '비밀번호가 너무 단순해요. 8자 이상으로 더 복잡하게 만들어 주세요.';
        case 'over_request_rate_limit':
        case 'over_email_send_rate_limit': return '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.';
        default: return '문제가 발생했어요. 잠시 후 다시 시도해 주세요.';
    }
}

function validate() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '올바른 이메일 주소를 입력해 주세요.';
    if (password.length < 8) return '비밀번호는 8자 이상이어야 해요.';
    if (mode === 'signup') {
        if (password !== confirmInput.value) return '비밀번호가 서로 달라요.';
        if (!consentInput.checked) return '개인정보 수집·이용에 동의해 주세요.';
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
        showNotice(`${email}로 인증 메일을 보냈어요. 메일의 링크를 누르면 가입이 완료돼요.`);
        form.reset();
    } catch (error) {
        console.error(error);
        showError(authErrorMessage(error));
    } finally {
        submitBtn.disabled = false;
    }
});
