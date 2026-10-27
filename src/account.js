import './style.css';
import { supabase, api, ApiError, signOut, LOGIN_PATH } from './beta/api.js';
import { locale, t, applyI18n, langSwitch, sitePath } from './beta/i18n.js';

// Subscription management (terms 제11조: cancelling must be no harder than subscribing).
// Everything comes from GET /me (subscription, paid_source); changes go through
// POST /subscription/cancel | resume.

document.title = t('account.page-title');
applyI18n();
langSwitch(document.getElementById('lang-switch'));

const bodyEl = document.getElementById('account-body');
const loadingEl = document.getElementById('account-loading');
const errorEl = document.getElementById('account-error');

const dateFormat = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });
const formatDate = (iso) => dateFormat.format(new Date(iso));
const formatPrice = (amount, currency) => new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function show(state) {
    loadingEl.classList.toggle('hidden', state !== 'loading');
    errorEl.classList.toggle('hidden', state !== 'error');
    bodyEl.classList.toggle('hidden', state !== 'body');
    bodyEl.classList.toggle('flex', state === 'body');
}

function handleAuthError(error) {
    if (error instanceof ApiError && error.status === 401) {
        signOut();
        return true;
    }
    return false;
}

// label / value rows
function details(rows) {
    const dl = el('dl', 'account-details');
    rows.forEach(([label, value]) => dl.append(el('dt', null, label), el('dd', null, value)));
    return dl;
}

function card(label) {
    const section = el('section', 'account-card');
    section.appendChild(el('p', 'account-label', label));
    return section;
}

function subscriptionCard(sub) {
    const section = card(t('account.plan'));
    const head = el('div', 'flex flex-wrap items-baseline justify-between gap-2');
    head.appendChild(el('h2', 'text-xl font-bold text-white', t('account.plan.paid')));
    head.appendChild(el('span', 'text-slate-300 tabular-nums', t('account.price', { price: formatPrice(sub.amount, sub.currency) })));
    section.appendChild(head);

    const end = formatDate(sub.current_period_end);
    section.appendChild(details([
        [t('account.provider'), t(`account.provider.${sub.provider}`)],
        sub.cancel_at_period_end ? [t('account.ends-on'), end] : [t('account.next-billing'), end],
    ]));
    if (sub.cancel_at_period_end) section.appendChild(el('p', 'account-note', t('account.canceled-note', { date: end })));
    else if (sub.status === 'past_due') section.appendChild(el('p', 'account-note account-note-warn', t('account.past-due-note', { date: end })));

    const actions = el('div', 'account-actions');
    const failure = el('p', 'hidden text-red-400 text-sm');
    if (sub.cancel_at_period_end) {
        actions.appendChild(el('p', 'text-sm text-slate-400', t('account.resume.desc', { date: end })));
        const resume = el('button', 'account-btn account-btn-primary', t('account.resume'));
        resume.type = 'button';
        resume.addEventListener('click', () => changeRenewal('/subscription/resume', [resume], failure));
        actions.appendChild(resume);
    } else {
        const cancel = el('button', 'account-btn', t('account.cancel'));
        cancel.type = 'button';
        cancel.addEventListener('click', () => {
            // One confirmation step, nothing more (terms 제11조)
            const confirmBox = el('div', 'account-confirm');
            confirmBox.appendChild(el('p', null, t('account.cancel.confirm-text', { date: end })));
            const row = el('div', 'flex flex-wrap gap-2');
            const yes = el('button', 'account-btn account-btn-danger', t('account.cancel.confirm'));
            yes.type = 'button';
            const back = el('button', 'account-btn', t('account.cancel.back'));
            back.type = 'button';
            yes.addEventListener('click', () => changeRenewal('/subscription/cancel', [yes, back], failure));
            back.addEventListener('click', () => confirmBox.replaceWith(cancel));
            row.append(yes, back);
            confirmBox.appendChild(row);
            cancel.replaceWith(confirmBox);
        });
        actions.appendChild(cancel);
    }
    actions.appendChild(failure);
    section.appendChild(actions);
    return section;
}

function grantCard() {
    const section = card(t('account.plan'));
    section.appendChild(el('h2', 'text-xl font-bold text-white', t('account.plan.grant')));
    section.appendChild(el('p', 'account-note', t('account.plan.grant.desc')));
    return section;
}

function freeCard(previous) {
    const section = card(t('account.plan'));
    section.appendChild(el('h2', 'text-xl font-bold text-white', t('account.plan.free')));
    section.appendChild(el('p', 'account-note', t('account.plan.free.desc')));
    if (previous) {
        section.appendChild(el('p', 'account-note', t('account.plan.free.expired', { date: formatDate(previous.current_period_end) })));
    }
    const link = el('a', 'account-btn account-btn-primary', t('account.plan.see-pricing'));
    link.href = sitePath('/pricing/');
    const actions = el('div', 'account-actions');
    actions.appendChild(link);
    section.appendChild(actions);
    return section;
}

function render(me) {
    const sub = me.subscription;
    const nodes = [];

    const accountCard = card(t('account.signed-in-as'));
    accountCard.appendChild(el('p', 'text-white break-all', me.email || ''));
    nodes.push(accountCard);

    if (sub?.active) nodes.push(subscriptionCard(sub));
    else if (me.paid_source === 'grant') nodes.push(grantCard());
    else nodes.push(freeCard(sub));

    if (me.monthly_limit != null) {
        const usage = card(t('account.usage'));
        usage.appendChild(el('p', 'text-white tabular-nums', t('account.usage.value', {
            used: (me.used_this_month ?? 0).toLocaleString(locale),
            limit: me.monthly_limit.toLocaleString(locale),
        })));
        nodes.push(usage);
    }

    if (sub && sub.provider !== 'manual') {
        const refund = el('p', 'text-sm text-slate-500 leading-relaxed px-1');
        refund.innerHTML = t('account.refund', { refund: sitePath('/terms/#refund') });
        nodes.push(refund);
    }

    bodyEl.replaceChildren(...nodes);
    show('body');
}

async function changeRenewal(path, buttons, failure) {
    buttons.forEach(btn => { btn.disabled = true; });
    const label = buttons[0].textContent;
    buttons[0].textContent = t('account.working');
    failure.classList.add('hidden');
    try {
        await api(path, { method: 'POST' });
        render(await api('/me'));
    } catch (error) {
        if (handleAuthError(error)) return;
        console.error(error);
        failure.textContent = t('account.action-failed');
        failure.classList.remove('hidden');
        buttons.forEach(btn => { btn.disabled = false; });
        buttons[0].textContent = label;
    }
}

async function load() {
    show('loading');
    try {
        render(await api('/me'));
    } catch (error) {
        if (handleAuthError(error)) return;
        console.error(error);
        show('error');
    }
}

async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.replace(LOGIN_PATH);
        return;
    }
    load();
}

supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') window.location.replace(LOGIN_PATH);
});

document.getElementById('logout-btn').addEventListener('click', signOut);
document.getElementById('account-retry').addEventListener('click', load);

init();
