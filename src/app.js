import './style.css';
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
import flagFontUrl from 'country-flag-emoji-polyfill/dist/TwemojiCountryFlags.woff2?url';
import { supabase, api, ApiError, signOut, LOGIN_PATH } from './beta/api.js';
import { VIEW_CURRENCIES, moneyCell, hasToggle } from './beta/money.js';
import { createFormatter, shownColumns } from './beta/display.js';
import { lang, locale, t, applyI18n, langSwitch, sitePath } from './beta/i18n.js';
import { exampleQuestions, proExampleQuestions } from './beta/examples.js';
import { rowFilings, tableFilings, filingLabel, systemName, refLink, refTopic, STATEMENTS, TOPICS } from './beta/sources.js';

// Windows has no flag glyphs (🇰🇷 shows as "KR"): the flags-only Twemoji font, loaded there alone
polyfillCountryFlagEmojis('Twemoji Country Flags', flagFontUrl);

applyI18n();
langSwitch(document.getElementById('lang-switch'));
document.getElementById('home-link').href = sitePath('/');

const VIEWS = ['loading', 'start', 'pending', 'blocked', 'error', 'query'];
const startedKey = (userId) => `ollarai-beta-started:${userId}`;

const queryForm = document.getElementById('query-form');
const queryInput = document.getElementById('query-input');
const querySubmit = document.getElementById('query-submit');
const resultsEl = document.getElementById('results');
const historyMoreWrap = document.getElementById('history-more-wrap');
const historyMoreBtn = document.getElementById('history-more');

let me = null;
let busy = false;

function showView(name) {
    VIEWS.forEach(v => document.getElementById(`view-${v}`).classList.toggle('hidden', v !== name));
    if (name === 'query') queryInput.focus();
}

function storageGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
}

function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch { /* storage blocked */ }
}

// ---------- account ----------

// Free accounts see how many questions are left today from 80% of the daily cap on
const FREE_WARN_RATIO = 0.8;
const shortDate = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });

function renderAccount() {
    document.getElementById('account').classList.replace('hidden', 'flex');
    const emailEl = document.getElementById('account-email');
    emailEl.textContent = me.email || '';
    emailEl.classList.toggle('md:inline', !!me.email);

    // Launch event accounts: questions left and the end date, linking to the pricing page.
    // Paid accounts: this month's paid count, always shown. Free accounts: the daily cap
    // (free_daily_limit), shown only once FREE_WARN_RATIO of it is used.
    const isPaid = me.status === 'approved' && me.tier === 'paid';
    const badge = document.getElementById('usage-badge');
    // Each badge has a full text (desktop, and the tooltip) and a short one for mobile
    let badgeText = null;
    let badgeShort = null;
    let badgeLink = null;
    if (isPaid && me.paid_source === 'event' && me.event) {
        const n = Math.max(0, me.event.total - me.event.used).toLocaleString(locale);
        badgeText = t('app.usage.event', { n, date: shortDate.format(new Date(me.event.expires_at)) });
        badgeShort = t('app.usage.event.short', { n });
        badgeLink = `${sitePath('/pricing/')}?event_until=${encodeURIComponent(me.event.expires_at)}`;
    } else if (isPaid && me.monthly_limit != null) {
        const vars = {
            used: (me.used_this_month ?? 0).toLocaleString(locale),
            limit: me.monthly_limit.toLocaleString(locale),
        };
        badgeText = t('app.usage', vars);
        badgeShort = t('app.usage.short', vars);
    } else if (me.status === 'approved' && me.free_daily_limit != null
        && me.free_used_today >= me.free_daily_limit * FREE_WARN_RATIO) {
        const n = Math.max(0, me.free_daily_limit - me.free_used_today).toLocaleString(locale);
        badgeText = n !== '0' ? t('app.usage.free-left', { n }) : t('app.usage.free-none');
        badgeShort = t('app.usage.free-left.short', { n });
    }
    badge.classList.toggle('hidden', !badgeText);
    if (badgeText) {
        document.getElementById('usage-badge-full').textContent = badgeText;
        document.getElementById('usage-badge-short').textContent = badgeShort;
        badge.title = badgeText;
    }
    if (badgeLink) badge.href = badgeLink;
    else badge.removeAttribute('href');
    badge.classList.toggle('hover:text-white', !!badgeLink);

    document.getElementById('tier-toggle').classList.toggle('hidden', me.status !== 'approved');
    document.querySelector('#tier-toggle .tier-lock').classList.toggle('hidden', isPaid);
    if (isPaid) tierUpsell.classList.add('hidden');
    renderTierToggle();
}

// ---------- tier toggle ----------
// Shown as Quick / Precise. Free accounts always ask in Quick: picking Precise
// explains it and links to the pricing page instead.

const TIER_KEY = 'ollarai-beta-tier';
const TIER_LABEL = { free: t('app.tier.free'), paid: t('app.tier.paid') };
const tierUpsell = document.getElementById('tier-upsell');
document.getElementById('tier-upsell-link').href = sitePath('/pricing/');

// The tier sent with /query: null lets the server use the account's tier
function selectedTier() {
    if (me?.tier !== 'paid') return null;
    return storageGet(TIER_KEY) === 'free' ? 'free' : 'paid';
}

function renderTierToggle() {
    const tier = selectedTier() || 'free';
    document.querySelectorAll('#tier-toggle [data-tier]').forEach(btn => {
        btn.setAttribute('aria-checked', String(btn.dataset.tier === tier));
    });
}

document.querySelectorAll('#tier-toggle [data-tier]').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!isPaidAccount()) {
            tierUpsell.classList.toggle('hidden', btn.dataset.tier !== 'paid');
            return;
        }
        storageSet(TIER_KEY, btn.dataset.tier);
        renderTierToggle();
        queryInput.focus();
    });
});

function routeByStatus() {
    if (me.status === 'approved') {
        showView('query');
        if (!historyLoaded) loadHistory();
        return;
    }
    if (me.status === 'blocked') return showView('blocked');
    // pending: the first visit shows the start screen, later visits go straight to the waiting screen
    showView(storageGet(startedKey(me.id)) ? 'pending' : 'start');
}

async function loadMe() {
    me = await api('/me');
    renderAccount();
    return me;
}

function handleAuthError(error) {
    if (error instanceof ApiError && error.status === 401) {
        signOut();
        return true;
    }
    return false;
}

async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.replace(LOGIN_PATH);
        return;
    }

    showView('loading');
    try {
        await loadMe();
        routeByStatus();
    } catch (error) {
        if (handleAuthError(error)) return;
        console.error(error);
        document.getElementById('view-error-message').textContent = errorMessage(error);
        showView('error');
    }
}

supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') window.location.replace(LOGIN_PATH);
});

document.getElementById('logout-btn').addEventListener('click', signOut);
document.getElementById('error-retry-btn').addEventListener('click', init);

document.getElementById('start-btn').addEventListener('click', () => {
    storageSet(startedKey(me.id), '1');
    showView('pending');
});

document.getElementById('pending-refresh-btn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const hint = document.getElementById('pending-hint');
    btn.disabled = true;
    hint.classList.add('hidden');
    try {
        await loadMe();
        if (me.status === 'pending') hint.classList.remove('hidden');
        else routeByStatus();
    } catch (error) {
        if (!handleAuthError(error)) {
            hint.textContent = errorMessage(error);
            hint.classList.remove('hidden');
        }
    } finally {
        btn.disabled = false;
    }
});

// ---------- history ----------

const HISTORY_PAGE_SIZE = 10;
let historyLoaded = false;
let historyBefore = null;

// Past questions (newest first) go below anything asked on this page
async function loadHistory() {
    historyLoaded = true;
    historyMoreBtn.disabled = true;
    try {
        const params = new URLSearchParams({ limit: HISTORY_PAGE_SIZE });
        if (historyBefore) params.set('before', historyBefore);
        const page = await api(`/history?${params}`);
        page.items.forEach(item => resultsEl.appendChild(historyCard(item).el));
        historyBefore = page.next_before;
        historyMoreBtn.textContent = t('app.history.more');
        historyMoreWrap.classList.toggle('hidden', !historyBefore);
    } catch (error) {
        if (handleAuthError(error)) return;
        console.error(error);
        historyMoreBtn.textContent = t('app.history.failed');
        historyMoreWrap.classList.remove('hidden');
    } finally {
        historyMoreBtn.disabled = false;
    }
}

function historyCard(item) {
    const card = createResultCard(item.question, item.created_at);
    if (item.status === 200 && item.response) card.showResponse(item.response, item.id);
    else {
        card.showError(errorMessage(new ApiError(item.status, item.error)));
    }
    return card;
}

historyMoreBtn.addEventListener('click', loadHistory);

// ---------- errors ----------

function errorMessage(error) {
    if (!(error instanceof ApiError)) return t('app.err.generic');
    const detailMessage = typeof error.detail === 'string' ? null : error.detail?.message;
    switch (error.status) {
        case 0: return t('app.err.network');
        case 403: return t('app.err.paid-unavailable');
        case 429:
            if (error.detail?.monthly_limit) {
                return t('app.err.monthly-limit', { limit: error.detail.monthly_limit.toLocaleString(locale) });
            }
            if (error.detail?.event_total) {
                return t('app.err.event-limit', { limit: error.detail.event_total.toLocaleString(locale) });
            }
            if (error.detail?.daily_limit) {
                return t('app.err.daily-limit', { limit: error.detail.daily_limit.toLocaleString(locale) });
            }
            return t('app.err.rate-limit');
        case 503: return detailMessage || t('app.err.unavailable');
        default: return t('app.err.answer');
    }
}

// ---------- question input ----------

function setBusy(value) {
    busy = value;
    querySubmit.disabled = value || !queryInput.value.trim();
    queryInput.readOnly = value;
}

function autoResize() {
    queryInput.style.height = 'auto';
    queryInput.style.height = Math.min(queryInput.scrollHeight, 240) + 'px';
}

// Where the question in the box came from, sent as /query `source` (the server's
// notice_report.py counts how often a suggestion is picked): an example chip or a
// suggestion button sets it, typing in the box makes it 'typed' again.
let questionSource = 'typed';

queryInput.addEventListener('input', () => {
    questionSource = 'typed';
    autoResize();
    querySubmit.disabled = busy || !queryInput.value.trim();
});

queryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        queryForm.requestSubmit();
    }
});

const queryExamples = document.getElementById('query-examples');
// Set by the first question: chips arriving after it stay hidden
let examplesDismissed = false;
// Pro chips (share prices / market data, paid accounts on 정밀 답변 only): a medium one and a hard one,
// each in turn per load. Paid accounts get it in the box with Precise picked; free accounts are asked whether
// to go to the pricing page.
const proChips = proExampleQuestions(lang).map(proQuestion => {
    const proChip = el('button', 'query-example query-example-pro');
    proChip.type = 'button';
    proChip.title = t('app.examples.pro.title');
    proChip.appendChild(el('span', 'query-example-pro-badge', 'PRO'));
    proChip.appendChild(el('span', null, proQuestion));
    proChip.addEventListener('click', () => {
        if (busy) return;
        if (!isPaidAccount()) {
            proDialog.showModal();
            return;
        }
        // Like the other chips it only fills the box, and switches the answer mode to Precise
        storageSet(TIER_KEY, 'paid');
        renderTierToggle();
        queryInput.value = proQuestion;
        questionSource = 'example';
        autoResize();
        querySubmit.disabled = false;
        queryInput.focus();
    });
    return proChip;
});

const proDialog = document.getElementById('pro-dialog');
proDialog.querySelector('[data-action="cancel"]').addEventListener('click', () => proDialog.close());
proDialog.querySelector('[data-action="confirm"]').addEventListener('click', () => {
    window.location.href = sitePath('/pricing/');
});
// A click on the backdrop (outside the box) cancels
proDialog.addEventListener('click', (e) => {
    if (e.target === proDialog) proDialog.close();
});

// Server chips and Pro chips go up together, in random order, once /examples answers (or fails)
exampleQuestions(lang).then(questions => {
    const chips = questions.map(question => {
        const btn = el('button', 'query-example', question);
        btn.type = 'button';
        btn.addEventListener('click', () => {
            if (busy) return;
            queryInput.value = btn.textContent.trim();
            questionSource = 'example';
            autoResize();
            querySubmit.disabled = false;
            queryInput.focus();
        });
        return btn;
    }).concat(proChips);
    // Fisher-Yates shuffle
    for (let i = chips.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chips[i], chips[j]] = [chips[j], chips[i]];
    }
    queryExamples.append(...chips);
    if (!examplesDismissed) queryExamples.classList.remove('hidden');
});

queryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const question = queryInput.value.trim();
    if (!question || busy) return;
    const source = questionSource;
    questionSource = 'typed';
    ask(question, selectedTier(), true, source);
});

// tier: null lets the server use the account's tier. fromInput clears the box on success.
async function ask(question, tier, fromInput = false, source = 'typed') {
    setBusy(true);
    tierUpsell.classList.add('hidden');
    examplesDismissed = true;
    queryExamples.classList.add('hidden');
    const card = createResultCard(question);
    resultsEl.prepend(card.el);

    try {
        // auto: the server reads the language (any Hangul = ko) - 'ko' sent English / Japanese through Korean MT
        const response = await api('/query', { method: 'POST', body: { question, language: 'auto', source, ...(tier ? { tier } : {}) } });
        card.showResponse(response, response.history_id, true);
        if (fromInput) {
            queryInput.value = '';
            autoResize();
        }
    } catch (error) {
        if (handleAuthError(error)) return;
        if (error instanceof ApiError && error.status === 403 && error.detail?.status) {
            // Approval was revoked / never granted
            me.status = error.detail.status;
            routeByStatus();
            return;
        }
        console.error(error);
        card.showError(errorMessage(error));
    } finally {
        setBusy(false);
        loadMe().catch(() => {});
    }
}

// ---------- result rendering ----------

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

const timeFormat = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

function createResultCard(question, createdAt = new Date()) {
    const root = el('article', 'result-card');
    const header = el('div', 'flex items-start justify-between gap-3 mb-5');
    const titleWrap = el('div', 'min-w-0');
    titleWrap.appendChild(el('h2', 'text-xl md:text-2xl font-semibold text-white leading-snug', question));
    const meta = el('p', 'mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500 tabular-nums');
    meta.appendChild(el('span', null, timeFormat.format(new Date(createdAt))));
    titleWrap.appendChild(meta);
    header.appendChild(titleWrap);
    root.appendChild(header);

    const body = el('div', 'flex flex-col gap-6');
    const loading = el('div', 'flex items-center gap-3 text-slate-400 text-sm');
    loading.appendChild(el('span', 'beta-spinner beta-spinner-sm'));
    const loadingText = el('span', null, t('result.loading.analyzing'));
    loading.appendChild(loadingText);
    body.appendChild(loading);
    body.appendChild(el('div', 'skeleton-table'));
    root.appendChild(body);

    // Requests can take ~20s; keep the user posted
    const started = Date.now();
    const timer = setInterval(() => {
        const s = Math.floor((Date.now() - started) / 1000);
        loadingText.textContent = s < 5 ? t('result.loading.analyzing')
            : t(s < 15 ? 'result.loading.querying' : 'result.loading.waiting', { s });
    }, 1000);

    return {
        el: root,
        // live: just asked on this page (not history), so it may offer a Precise retry
        showResponse(response, historyId = response.history_id, live = false) {
            clearInterval(timer);
            // Mark which path (Quick / Precise) produced this answer
            if (TIER_LABEL[response.tier]) {
                header.appendChild(el('span', `tier-badge tier-badge-${response.tier}`, TIER_LABEL[response.tier]));
            }
            body.replaceChildren();
            const parts = response.is_multi_query && response.queries?.length ? response.queries : [response];
            parts.forEach((part, i) => {
                const loadAll = historyId != null && isPaidAccount()
                    ? () => api(`/history/${historyId}/rows?part=${i}`) : null;
                const loadSummary = historyId != null ? () => api(`/history/${historyId}/summary?part=${i}`) : null;
                body.appendChild(renderPart(part, response.is_multi_query, loadAll, loadSummary));
            });
            if (live && response.tier === 'free') body.appendChild(retryPrecise(question));
        },
        showError(message) {
            clearInterval(timer);
            body.replaceChildren(notice(message, 'error'));
        },
    };
}

// Under a Quick answer: paid accounts ask the same question again in Precise,
// free accounts get a link to the pricing page
function retryPrecise(question) {
    if (!isPaidAccount()) {
        const link = el('a', 'result-retry');
        link.href = sitePath('/pricing/');
        link.appendChild(el('i', 'fas fa-lock text-xs'));
        link.appendChild(el('span', null, t('result.retry-precise.locked')));
        link.appendChild(el('i', 'fas fa-arrow-right text-xs'));
        return link;
    }
    const btn = el('button', 'result-retry');
    btn.type = 'button';
    btn.appendChild(el('i', 'fas fa-rotate-right text-xs'));
    btn.appendChild(el('span', null, t('result.retry-precise')));
    btn.addEventListener('click', () => {
        if (busy) return;
        ask(question, 'paid');
        resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return btn;
}

function notice(message, kind = 'info') {
    const box = el('div', `result-notice result-notice-${kind}`);
    box.appendChild(el('i', kind === 'error' ? 'fas fa-circle-exclamation mt-0.5' : 'fas fa-circle-info mt-0.5'));
    box.appendChild(el('span', null, message));
    return box;
}

function renderPart(part, isMulti, loadAll, loadSummary) {
    const wrap = el('section', 'flex flex-col gap-3');
    if (isMulti && part.question) {
        wrap.appendChild(el('h3', 'text-sm font-semibold text-slate-300', part.question));
    }
    if (part.interpretation) {
        wrap.appendChild(interpretationLine(part.interpretation));
    }
    if (part.message) {
        wrap.appendChild(notice(part.message, part.result ? 'warn' : 'info'));
    }
    if (part.clarification?.options?.length) {
        wrap.appendChild(clarificationOptions(part.clarification));
    }
    const summary = part.result && summaryLine(part.summary, loadSummary);
    if (summary) wrap.appendChild(summary);
    if (part.result) {
        wrap.appendChild(renderTable(part.result, loadAll));
    } else if (!part.message) {
        wrap.appendChild(notice(t('result.not-found'), 'info'));
    }
    return wrap;
}

// How the server read the question ("이렇게 이해했어요: 삼성전자 · 영업이익 · 2025년"): a misread
// company, item or period is plain to see, and that part is what the user changes.
function interpretationLine(read) {
    const companies = [...(read.companies || [])];
    if (read.more_companies) companies.push(t('result.more-companies', { n: read.more_companies }));
    const parts = [companies.join(', '), ...(read.groups || []), ...(read.items || []), ...(read.periods || [])]
        .filter(Boolean);
    const line = el('p', 'result-read');
    line.appendChild(el('span', 'result-read-label', t('result.read')));
    line.appendChild(el('span', null, parts.join(' · ')));
    if (!read.basis?.length) return line;
    // The knowledge graph's reasons (server pipeline/basis.py): which category a company set was
    // drawn from ("현대자동차 경쟁사 = 완성차 (분류 규칙 + 부문 매출 84%)"), a ratio's formula, an
    // industry's own definition of a line (US banks' revenue).
    const box = el('div', 'flex flex-col gap-1');
    box.appendChild(line);
    read.basis.forEach(text => {
        const row = el('p', 'result-basis');
        row.appendChild(el('span', 'result-read-label', t('result.basis')));
        row.appendChild(el('span', null, text));
        box.appendChild(row);
    });
    return box;
}

// A few sentences above the table (server pipeline/result_summary.py): a larger table's count comes
// with the answer; a small table's is made after it ({pending}) - the table is shown meanwhile, and
// the line goes away when there is none (the summary didn't pass the server's checks, or failed).
function summaryLine(summary, loadSummary) {
    if (summary?.text) return el('p', 'result-summary', summary.text);
    if (!summary?.pending || !loadSummary) return null;
    const line = el('p', 'result-summary is-loading', t('result.summary-loading'));
    loadSummary()
        .then(made => {
            if (made?.text) {
                line.textContent = made.text;
                line.classList.remove('is-loading');
            } else {
                line.remove();
            }
        })
        .catch(() => line.remove());
    return line;
}

// An ask-back ("디와이키" could be 디와이씨 or 디와이): requests are one-shot, so each option is
// the whole question rewritten - picking one sends it as a new question, like typing it.
function clarificationOptions(clarification) {
    const box = el('div', 'clarify-options');
    clarification.options.forEach(option => {
        const btn = el('button', 'clarify-option', option.label);
        btn.type = 'button';
        btn.title = option.question;
        btn.addEventListener('click', () => {
            if (busy) return;
            queryInput.value = option.question;
            questionSource = 'suggestion';
            autoResize();
            queryForm.requestSubmit();
            resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        box.appendChild(btn);
    });
    return box;
}

const cellFormat = createFormatter(lang, locale);

// ---------- currency toggle (result tables with amounts) ----------

const CURRENCY_KEY = 'ollarai-beta-currency';
const CURRENCY_EVENT = 'ollarai-currency';

function selectedCurrency() {
    const stored = storageGet(CURRENCY_KEY);
    if (VIEW_CURRENCIES.includes(stored)) return stored;
    return lang === 'ko' ? 'KRW' : 'USD';
}

// One choice for every table on the page
function currencyToggle(current) {
    const group = el('div', 'tier-toggle currency-toggle');
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-label', t('result.currency'));
    VIEW_CURRENCIES.forEach(c => {
        const btn = el('button', null, c);
        btn.type = 'button';
        btn.setAttribute('role', 'radio');
        btn.dataset.currency = c;
        btn.addEventListener('click', () => {
            storageSet(CURRENCY_KEY, c);
            document.dispatchEvent(new CustomEvent(CURRENCY_EVENT, { detail: c }));
        });
        group.appendChild(btn);
    });
    const mark = (view) => group.querySelectorAll('button').forEach(btn =>
        btn.setAttribute('aria-checked', String(btn.dataset.currency === view)));
    mark(current);
    return { el: group, mark };
}

const UNCONVERTED_TITLE = {
    MIXED: t('result.unconverted.mixed'),
    null: t('result.unconverted.unknown'),
};

// Currency of an amount cell outside the toggle: won when the server converted it, else the row's own
function amountCurrency(money, column, rowIndex) {
    const col = money?.columns?.[column];
    if (!col) return money?.row_currency?.[rowIndex] ?? null; // per-share prices of the same rows
    return col.converted ? 'KRW' : (money.row_currency?.[rowIndex] ?? null);
}

// Shown cells of `result` in `view`, one per shown column (shownColumns): { value, text, numeric, title?, currency? };
// currency is set on toggled amount cells, and differs from `view` when the amount couldn't be converted.
function viewCells(result, view, cols) {
    const companies = result.display?.companies;
    return result.rows.map((row, i) => cols.map(col => {
        const value = row[col.index];
        if (col.format === 'period') return { value, text: cellFormat.period(value, row[col.end]), numeric: false };
        const cell = view ? moneyCell(value, col.name, i, result.money, view) : null;
        if (!cell) return { value, ...cellFormat.cell(value, col, amountCurrency(result.money, col.name, i), companies) };
        const shown = cell.currency === view ? Math.round(cell.value) : cell.value;
        return { value: shown, ...cellFormat.cell(shown, col, cell.currency, companies), currency: cell.currency };
    }));
}

// display.transpose (a few rows of many figures, read down): the columns heading each original row,
// and the figure columns that become rows. null: shown as is - also with held-back rows to preview.
function turnedColumns(result, cols) {
    const header = result.display?.transpose?.header;
    if (!header || result.locked_rows) return null;
    const heads = new Set(header);
    return { header: cols.filter(col => heads.has(col.index)), figures: cols.filter(col => !heads.has(col.index)) };
}

// One original row's column title: its header cells' text ("2025.01 ~ 2025.12 · 연간 · 연결")
const turnedTitle = (row, cols, header) => header.map(col => row[cols.indexOf(col)].text).filter(Boolean).join(' · ');

// ---------- rows by account tier ----------

// Paid tables open with this many rows; "more" shows the rest of what /query sent (SQL_EXEC_MAX_ROWS),
// and past that, after a warning, every row comes from GET /history/{id}/rows. Free accounts get only
// the server's first rows (FREE_MAX_ROWS); the others come as a count, ResultTable.locked_rows.
const PAID_PAGE_ROWS = 100;
const LOCKED_PREVIEW_ROWS = 5;

const isPaidAccount = () => me?.tier === 'paid';

// Blurred stand-ins for held-back rows: shown rows with their digits scrambled - the real ones never reach the page
function lockedPreview(cells, count, numericCols) {
    return Array.from({ length: count }, (_, i) => {
        const tr = el('tr', 'is-locked');
        tr.setAttribute('aria-hidden', 'true');
        tr.style.opacity = String(1 - i * 0.15);
        cells[i % cells.length].forEach((cell, j) => {
            const text = cell.text.replace(/\d/g, d => String((Number(d) * 7 + i + j) % 10));
            tr.appendChild(el('td', numericCols[j] ? 'is-num' : '', text));
        });
        return tr;
    });
}

// Share prices (ResultTable.price): where they come from and that they are approximate, under the table
function priceNote(price) {
    const note = el('div', 'px-4 py-3 border-t border-white/5 text-xs text-slate-500 space-y-1');
    (price.attribution || []).forEach(line => note.appendChild(el('p', null, line)));
    const notice = price.notice?.[lang] ?? price.notice?.en;
    if (notice) note.appendChild(el('p', null, notice));
    return note;
}

// The filings the figures were read from (ResultTable.sources), listed when opened - so a table
// whose rows grew (load all) lists theirs too
const SOURCES_LISTED = 30;

function sourcesNote(result) {
    const box = el('details', 'result-sources');
    const summary = el('summary', null);
    const label = () => summary.replaceChildren(el('i', 'fas fa-file-lines'),
        el('span', null, t('result.sources', { n: tableFilings(result.sources, result.rows.length).length })));
    label();
    const body = el('div', 'result-sources-body');
    box.append(summary, body);
    box.addEventListener('toggle', () => {
        if (!box.open) return;
        label();
        const filings = tableFilings(result.sources, result.rows.length);
        const list = el('ul');
        filings.slice(0, SOURCES_LISTED).forEach(({ filing, roles, sections, topics }) => {
            const li = el('li');
            const a = el('a', null, filingLabel(filing, lang));
            a.href = filing.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            li.append(el('span', 'result-sources-system', systemName(filing)), a);
            // the statements' own pages in the filing, each once (an older DART report has one page for all)
            const pages = new Map();
            STATEMENTS.filter(st => sections.has(st)).forEach(st => {
                const { url } = sections.get(st);
                if (!pages.has(url)) pages.set(url, []);
                pages.get(url).push(t(`result.sources.statement.${st}`));
            });
            if (pages.size) {
                const links = el('span', 'result-sources-statements');
                [...pages].forEach(([url, names], k) => {
                    if (k) links.appendChild(document.createTextNode(' · '));
                    const page = el('a', null, names.join('·'));
                    page.href = url;
                    page.target = '_blank';
                    page.rel = 'noopener noreferrer';
                    links.appendChild(page);
                });
                li.appendChild(links);
            }
            // what else the rows read from it (R&D, sales by segment, the shareholder list): no page of its own
            const read = TOPICS.filter(tp => topics.has(tp)).map(tp => t(`result.sources.topic.${tp}`));
            if (read.length) li.appendChild(el('span', 'result-sources-statements', read.join(' · ')));
            const kinds = [...roles].map(role => t(`result.sources.role.${role}`)).join(' · ');
            if (kinds) li.appendChild(el('span', 'result-sources-role', kinds));
            list.appendChild(li);
        });
        const children = [list];
        if (filings.length > SOURCES_LISTED) {
            children.push(el('p', null, t('result.sources.more', { n: filings.length - SOURCES_LISTED })));
        }
        children.push(el('p', 'result-sources-hint', t('result.sources.hint')));
        body.replaceChildren(...children);
    });
    return box;
}

// loadAll: fetches every row of a truncated table (paid accounts), or null
function renderTable(result, loadAll) {
    const card = renderTableCard(result, loadAll);
    if (result.price && result.rows.length) card.appendChild(priceNote(result.price));
    if (result.sources && tableFilings(result.sources, result.rows.length).length) card.appendChild(sourcesNote(result));
    return card;
}

// The last cell of a row: a link to the row's own filing - the statement's page in it when known -,
// every filing it was read from in the title
function sourceTd(result, i) {
    const td = el('td', 'result-source-cell');
    const refs = rowFilings(result.sources, i);
    if (!refs.length) return td;
    const filings = refs.map(ref => result.sources.filings[ref.filing]);
    const a = el('a', null);
    a.appendChild(el('i', 'fas fa-file-lines'));
    a.href = refLink(result.sources, refs[0]).url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    const named = (j) => {
        const { statement } = refLink(result.sources, refs[j]);
        const topic = statement ? null : refTopic(refs[j]);
        return statement ? `${filingLabel(filings[j], lang)} · ${t(`result.sources.statement.${statement}`)}`
            : topic ? `${filingLabel(filings[j], lang)} · ${t(`result.sources.topic.${topic}`)}`
            : filingLabel(filings[j], lang);
    };
    const lines = refs.map((ref, j) => `${named(j)} (${t(`result.sources.role.${ref.role}`)})`);
    a.title = [t('result.sources.open'), ...new Set(lines)].join('\n');
    a.setAttribute('aria-label', `${t('result.sources.open')}: ${named(0)}`);
    td.appendChild(a);
    return td;
}

function renderTableCard(result, loadAll) {
    const card = el('div', 'result-table-card');
    const toggleable = hasToggle(result);
    let view = toggleable ? selectedCurrency() : null;
    const locked = result.locked_rows || 0;
    const lockedLabel = `${locked}${result.truncated ? '+' : ''}`;
    let shown = Math.min(result.rows.length, PAID_PAGE_ROWS);

    const toolbar = el('div', 'flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 text-xs text-slate-400');
    const rowCount = el('span', 'tabular-nums');
    const countRows = () => {
        const n = result.rows.length;
        rowCount.textContent = locked ? t('result.rows.of', { n, total: `${n + locked}${result.truncated ? '+' : ''}` })
            : t(result.truncated ? 'result.rows.top' : 'result.rows', { n });
    };
    countRows();
    toolbar.appendChild(rowCount);
    const actions = el('div', 'flex items-center gap-4');
    let toggle = null;
    if (toggleable) {
        toggle = currencyToggle(view);
        actions.appendChild(toggle.el);
    }
    // Share-price results (ResultTable.price): no CSV / copy-all - figures are not handed out in bulk
    if (isPaidAccount() && !result.price?.restricted) {
        const copyBtn = el('button', 'hover:text-white transition', t('result.csv'));
        copyBtn.type = 'button';
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(toCsv(result, view));
                copyBtn.textContent = t('result.copied');
            } catch {
                copyBtn.textContent = t('result.copy-failed');
            }
            setTimeout(() => { copyBtn.textContent = t('result.csv'); }, 1500);
        });
        actions.appendChild(copyBtn);
    }
    toolbar.appendChild(actions);
    card.appendChild(toolbar);

    if (!result.rows.length) {
        card.appendChild(el('p', 'px-4 py-8 text-center text-slate-500 text-sm', t('result.empty')));
        return card;
    }

    const scroller = el('div', 'result-table-scroll');
    const table = el('table', 'result-table');
    scroller.appendChild(table);
    card.appendChild(scroller);

    const cols = shownColumns(result, lang);
    const turned = turnedColumns(result, cols);
    if (turned) {
        table.classList.add('is-turned');
        rowCount.textContent = t('result.rows', { n: turned.figures.length });
    }
    // Align a column right when all its non-null values are numbers
    const numericColumns = () => cols.map(col => col.format !== 'period' && result.rows.some(r => r[col.index] !== null)
        && result.rows.every(r => r[col.index] === null || typeof r[col.index] === 'number'));
    let numericCols = numericColumns();

    // A cell, greyed with the reason when its amount is left in its own currency
    function cellTd(cell, numeric) {
        const td = el('td', numeric ? 'is-num' : '', cell.text);
        if (cell.title) td.title = cell.title;
        if (cell.exact) {  // 1,661억원 <-> 166,123,456,789원 on a click (or Enter / Space)
            td.classList.add('is-expandable');
            td.tabIndex = 0;
            td.title = t('result.exact');
            td.setAttribute('aria-pressed', 'false');
            const flip = () => {
                const open = td.getAttribute('aria-pressed') !== 'true';
                td.textContent = open ? cell.exact : cell.text;
                td.setAttribute('aria-pressed', String(open));
            };
            td.addEventListener('click', () => {
                if (String(window.getSelection?.() ?? '')) return;  // selecting the figure to copy it, not flipping it
                flip();
            });
            td.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                e.preventDefault();
                flip();
            });
        }
        if (cell.flag) {  // companies of more than one country: each one's flag (the CSV keeps the name alone)
            const flag = el('span', 'flag', cell.flag);
            flag.title = cell.flagTitle;
            flag.setAttribute('aria-label', cell.flagTitle);
            td.prepend(flag);
        }
        if (cell.currency !== undefined && cell.currency !== view) {
            td.classList.add('is-unconverted');
            td.title = UNCONVERTED_TITLE[cell.currency] ?? t('result.unconverted.no-rate', { currency: cell.currency });
        }
        return td;
    }

    // Turned: one column per original row, one row per figure, labelled
    function drawTurned() {
        const cells = viewCells(result, view, cols);
        const headRow = el('tr');
        headRow.appendChild(el('th', null, t('result.item')));
        cells.forEach(row => headRow.appendChild(el('th', 'is-num', turnedTitle(row, cols, turned.header))));
        const thead = el('thead');
        thead.appendChild(headRow);
        const tbody = el('tbody');
        turned.figures.forEach(col => {
            const j = cols.indexOf(col);
            const tr = el('tr');
            const th = el('th', null, col.label);
            th.scope = 'row';
            if (col.label !== col.name) th.title = col.name;
            tr.appendChild(th);
            cells.forEach(row => tr.appendChild(cellTd(row[j], numericCols[j])));
            tbody.appendChild(tr);
        });
        table.replaceChildren(thead, tbody);
    }

    function draw() {
        if (turned) return drawTurned();
        const thead = el('thead');
        const headRow = el('tr');
        cols.forEach((col, i) => {
            const th = el('th', numericCols[i] ? 'is-num' : '', col.label);
            if (col.label !== col.name && col.format !== 'period') th.title = col.name;
            headRow.appendChild(th);
        });
        const linked = Boolean(result.sources);
        if (linked) {
            const th = el('th', 'result-source-cell');
            th.setAttribute('aria-label', t('result.sources.column'));
            headRow.appendChild(th);
        }
        thead.appendChild(headRow);

        const tbody = el('tbody');
        const cells = viewCells(result, view, cols);
        cells.slice(0, shown).forEach((row, r) => {
            const tr = el('tr');
            row.forEach((cell, i) => tr.appendChild(cellTd(cell, numericCols[i])));
            if (linked) tr.appendChild(sourceTd(result, r));
            tbody.appendChild(tr);
        });
        if (locked) tbody.append(...lockedPreview(cells, Math.min(locked, LOCKED_PREVIEW_ROWS), numericCols));
        table.replaceChildren(thead, tbody);
    }
    draw();

    if (toggleable) {
        document.addEventListener(CURRENCY_EVENT, (e) => {
            view = e.detail;
            toggle.mark(view);
            draw();
        });
    }

    if (locked) {
        const cta = el('a', 'result-locked');
        cta.href = sitePath('/pricing/');
        cta.appendChild(el('i', 'fas fa-lock'));
        cta.appendChild(el('span', null, t('result.locked', { n: lockedLabel })));
        cta.appendChild(el('i', 'fas fa-arrow-right text-xs'));
        card.appendChild(cta);
        return card;
    }

    // 100 rows -> the rest /query sent -> (warned) every row
    const footer = el('div');
    card.appendChild(footer);

    async function showAll(btn, hint) {
        btn.disabled = true;
        btn.textContent = t('result.load-all.loading');
        try {
            const full = await loadAll();
            Object.assign(result, { rows: full.rows, truncated: full.truncated, money: full.money,
                sources: full.sources, display: full.display ?? result.display });
            loadAll = null; // still truncated only under SQL_FULL_MAX_ROWS - nothing more to load
            numericCols = numericColumns();
            shown = result.rows.length;
            countRows();
            draw();
            renderFooter();
        } catch (error) {
            if (handleAuthError(error)) return;
            console.error(error);
            hint.textContent = t('result.load-all.failed');
            btn.disabled = false;
            btn.textContent = t('app.retry');
        }
    }

    function renderFooter() {
        footer.replaceChildren();
        if (result.rows.length > shown) {
            const moreBtn = el('button', 'result-more', t('result.more', { n: result.rows.length - shown }));
            moreBtn.type = 'button';
            moreBtn.addEventListener('click', () => {
                shown = result.rows.length;
                draw();
                renderFooter();
            });
            footer.appendChild(moreBtn);
        } else if (result.truncated && loadAll) {
            const box = el('div', 'result-load-all');
            const hint = el('p', null, t('result.load-all.hint', { n: result.rows.length }));
            const btn = el('button', 'result-load-all-btn', t('result.load-all'));
            btn.type = 'button';
            btn.addEventListener('click', () => showAll(btn, hint));
            box.append(hint, btn);
            footer.appendChild(box);
        } else if (result.truncated) {
            footer.appendChild(el('p', 'px-4 py-3 border-t border-white/5 text-xs text-slate-500',
                t('result.truncated', { n: result.rows.length })));
        }
    }
    renderFooter();
    return card;
}

// The table as shown - labels, company names, periods - with whole numbers: amounts in the selected currency
function toCsv(result, view) {
    const esc = (v) => {
        const s = v === null || v === undefined ? '' : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const cols = shownColumns(result, lang);
    const label = (col) => (view && result.money?.columns?.[col.name] ? `${col.label} (${view})` : col.label);
    const cells = viewCells(result, view, cols);
    const rows = cells.map(row => row.map(cell => {
        if (cell.value === null || cell.value === undefined) return '';
        if (typeof cell.value !== 'number') return cell.text;
        return cell.currency !== undefined && cell.currency !== view && cell.currency ? `${cell.value} ${cell.currency}` : cell.value;
    }));
    const turned = turnedColumns(result, cols);
    const table = turned  // as shown: one line per figure, one column per original row
        ? [[t('result.item'), ...cells.map(row => turnedTitle(row, cols, turned.header))],
            ...turned.figures.map(col => [label(col), ...rows.map(row => row[cols.indexOf(col)])])]
        : [cols.map(label), ...rows];
    return table.map(r => r.map(esc).join(',')).join('\n');
}

init();
