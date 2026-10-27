import './style.css';
import { supabase, api, ApiError, signOut, LOGIN_PATH } from './beta/api.js';
import { VIEW_CURRENCIES, moneyCell, hasToggle } from './beta/money.js';

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

function renderAccount() {
    document.getElementById('account').classList.replace('hidden', 'flex');
    const emailEl = document.getElementById('account-email');
    emailEl.textContent = me.email || '';
    emailEl.classList.toggle('md:inline', !!me.email);

    // Only paid-tier queries are counted, per calendar month (free is unlimited, monthly_limit is null)
    const isPaid = me.status === 'approved' && me.tier === 'paid';
    const badge = document.getElementById('usage-badge');
    const showBadge = isPaid && me.monthly_limit != null;
    badge.classList.toggle('hidden', !showBadge);
    if (showBadge) {
        badge.textContent = `이번 달 유료 ${(me.used_this_month ?? 0).toLocaleString('ko-KR')} / ${me.monthly_limit.toLocaleString('ko-KR')}`;
    }

    document.getElementById('tier-toggle').classList.toggle('hidden', !isPaid);
    document.getElementById('query-hint').classList.toggle('max-sm:hidden', isPaid);
    renderTierToggle();
}

// ---------- tier toggle (paid accounts only) ----------

const TIER_KEY = 'ollarai-beta-tier';
const TIER_LABEL = { free: '무료', paid: '유료' };

// The tier sent with /query: null lets the server use the account's tier
function selectedTier() {
    if (me?.tier !== 'paid') return null;
    return storageGet(TIER_KEY) === 'free' ? 'free' : 'paid';
}

function renderTierToggle() {
    const tier = selectedTier();
    document.querySelectorAll('#tier-toggle [data-tier]').forEach(btn => {
        btn.setAttribute('aria-checked', String(btn.dataset.tier === tier));
    });
}

document.querySelectorAll('#tier-toggle [data-tier]').forEach(btn => {
    btn.addEventListener('click', () => {
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
        historyMoreBtn.textContent = '이전 질문 더 보기';
        historyMoreWrap.classList.toggle('hidden', !historyBefore);
    } catch (error) {
        if (handleAuthError(error)) return;
        console.error(error);
        historyMoreBtn.textContent = '이전 질문을 불러오지 못했어요 · 다시 시도';
        historyMoreWrap.classList.remove('hidden');
    } finally {
        historyMoreBtn.disabled = false;
    }
}

function historyCard(item) {
    const card = createResultCard(item.question, item.created_at);
    if (item.status === 200 && item.response) card.showResponse(item.response, item.id);
    else {
        const error = new ApiError(item.status, item.error);
        card.showError(errorMessage(error), error.requestId);
    }
    return card;
}

historyMoreBtn.addEventListener('click', loadHistory);

// ---------- errors ----------

function errorMessage(error) {
    if (!(error instanceof ApiError)) return '문제가 발생했어요. 잠시 후 다시 시도해 주세요.';
    const detailMessage = typeof error.detail === 'string' ? null : error.detail?.message;
    switch (error.status) {
        case 0: return '네트워크 연결을 확인해 주세요.';
        case 403: return '이 계정에서는 유료 방식을 사용할 수 없어요.';
        case 429:
            return error.detail?.monthly_limit
                ? `이번 달 유료 질문 한도(${error.detail.monthly_limit.toLocaleString('ko-KR')}회)를 모두 사용했어요. 무료로 바꾸면 계속 질문할 수 있고, 유료 한도는 매월 1일 0시(한국 시간)에 초기화돼요.`
                : '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.';
        case 503: return detailMessage || '서비스가 잠시 불안정해요. 잠시 후 다시 시도해 주세요.';
        default: return '답변을 생성하지 못했어요. 잠시 후 다시 시도해 주세요.';
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

queryInput.addEventListener('input', () => {
    autoResize();
    querySubmit.disabled = busy || !queryInput.value.trim();
});

queryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        queryForm.requestSubmit();
    }
});

queryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = queryInput.value.trim();
    if (!question || busy) return;

    setBusy(true);
    const card = createResultCard(question);
    resultsEl.prepend(card.el);

    try {
        const tier = selectedTier();
        // auto: the server reads the language (any Hangul = ko) - 'ko' sent English / Japanese through Korean MT
        const response = await api('/query', { method: 'POST', body: { question, language: 'auto', ...(tier ? { tier } : {}) } });
        card.showResponse(response);
        queryInput.value = '';
        autoResize();
    } catch (error) {
        if (handleAuthError(error)) return;
        if (error instanceof ApiError && error.status === 403 && error.detail?.status) {
            // Approval was revoked / never granted
            me.status = error.detail.status;
            routeByStatus();
            return;
        }
        console.error(error);
        card.showError(errorMessage(error), error instanceof ApiError ? error.requestId : null);
    } finally {
        setBusy(false);
        loadMe().catch(() => {});
    }
});

// ---------- result rendering ----------

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

const timeFormat = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

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
    const loadingText = el('span', null, '질문을 분석하고 있어요…');
    loading.appendChild(loadingText);
    body.appendChild(loading);
    body.appendChild(el('div', 'skeleton-table'));
    root.appendChild(body);

    // Requests can take ~20s; keep the user posted
    const started = Date.now();
    const timer = setInterval(() => {
        const s = Math.floor((Date.now() - started) / 1000);
        loadingText.textContent = s < 5 ? '질문을 분석하고 있어요…' : s < 15 ? `데이터를 조회하고 있어요… ${s}초` : `조금만 기다려 주세요… ${s}초`;
    }, 1000);

    // Beta users can quote this when reporting a problem (matches the server's req= log lines)
    function showRequestId(requestId) {
        if (!requestId) return;
        const label = `ID ${requestId}`;
        const btn = el('button', 'font-mono hover:text-slate-300 transition', label);
        btn.type = 'button';
        btn.title = '요청 ID 복사';
        btn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(requestId);
                btn.textContent = '복사됨';
            } catch {
                btn.textContent = '복사 실패';
            }
            setTimeout(() => { btn.textContent = label; }, 1500);
        });
        meta.appendChild(el('span', null, '·'));
        meta.appendChild(btn);
    }

    return {
        el: root,
        showResponse(response, historyId = response.history_id) {
            clearInterval(timer);
            showRequestId(response.request_id);
            // Paid accounts can switch tiers, so mark which path produced this answer
            if (me?.tier === 'paid' && TIER_LABEL[response.tier]) {
                header.appendChild(el('span', `tier-badge tier-badge-${response.tier}`, TIER_LABEL[response.tier]));
            }
            body.replaceChildren();
            const parts = response.is_multi_query && response.queries?.length ? response.queries : [response];
            parts.forEach((part, i) => {
                const loadAll = historyId != null && isPaidAccount()
                    ? () => api(`/history/${historyId}/rows?part=${i}`) : null;
                body.appendChild(renderPart(part, response.is_multi_query, loadAll));
            });
        },
        showError(message, requestId) {
            clearInterval(timer);
            showRequestId(requestId);
            body.replaceChildren(notice(message, 'error'));
        },
    };
}

function notice(message, kind = 'info') {
    const box = el('div', `result-notice result-notice-${kind}`);
    box.appendChild(el('i', kind === 'error' ? 'fas fa-circle-exclamation mt-0.5' : 'fas fa-circle-info mt-0.5'));
    box.appendChild(el('span', null, message));
    return box;
}

function renderPart(part, isMulti, loadAll) {
    const wrap = el('section', 'flex flex-col gap-3');
    if (isMulti && part.question) {
        wrap.appendChild(el('h3', 'text-sm font-semibold text-slate-300', part.question));
    }
    if (part.message) {
        wrap.appendChild(notice(part.message, part.result ? 'warn' : 'info'));
    }
    if (part.clarification?.options?.length) {
        wrap.appendChild(clarificationOptions(part.clarification));
    }
    if (part.result) {
        wrap.appendChild(renderTable(part.result, part.sql, loadAll));
    } else if (!part.message) {
        wrap.appendChild(notice('결과를 찾지 못했어요. 질문을 조금 바꿔서 다시 시도해 주세요.', 'info'));
    }
    return wrap;
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
            autoResize();
            queryForm.requestSubmit();
            resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        box.appendChild(btn);
    });
    return box;
}

// Columns whose integers are identifiers or periods, not amounts: no thousands separators
const RAW_NUMBER_COLUMN = /(year|yr|quarter|qtr|month|period|code|ticker|corp_code|stock_code|^id$|_id$)/i;
const numberFormat = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 4 });
const amountFormat = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });

function formatCell(value, column) {
    if (value === null || value === undefined) return { text: '—', numeric: false };
    if (typeof value === 'number') {
        const raw = Number.isInteger(value) && RAW_NUMBER_COLUMN.test(column);
        return { text: raw ? String(value) : numberFormat.format(value), numeric: true };
    }
    if (typeof value === 'boolean') return { text: value ? 'true' : 'false', numeric: false };
    return { text: String(value), numeric: false };
}

// ---------- currency toggle (result tables with amounts) ----------

const CURRENCY_KEY = 'ollarai-beta-currency';
const CURRENCY_EVENT = 'ollarai-currency';

function selectedCurrency() {
    const stored = storageGet(CURRENCY_KEY);
    return VIEW_CURRENCIES.includes(stored) ? stored : 'KRW';
}

// One choice for every table on the page
function currencyToggle(current) {
    const group = el('div', 'tier-toggle currency-toggle');
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-label', '금액 통화');
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
    MIXED: '여러 통화가 섞인 값이라 환산하지 않았어요',
    null: '통화를 확인하지 못해 환산하지 않았어요',
};

// Shown values of `result` in `view`: [{ value, text, numeric, currency }] per cell; currency is set
// on amount cells, and differs from `view` when the amount couldn't be converted.
function viewCells(result, view) {
    return result.rows.map((row, i) => row.map((value, j) => {
        const cell = view ? moneyCell(value, result.columns[j], i, result.money, view) : null;
        if (!cell) return { value, ...formatCell(value, result.columns[j]) };
        const shown = cell.currency === view ? Math.round(cell.value) : cell.value;
        return { value: shown, text: amountFormat.format(shown), numeric: true, currency: cell.currency };
    }));
}

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

// loadAll: fetches every row of a truncated table (paid accounts), or null
function renderTable(result, sql, loadAll) {
    const card = el('div', 'result-table-card');
    const toggleable = hasToggle(result);
    let view = toggleable ? selectedCurrency() : null;
    const locked = result.locked_rows || 0;
    const lockedLabel = `${locked}${result.truncated ? '+' : ''}`;
    let shown = Math.min(result.rows.length, PAID_PAGE_ROWS);

    const toolbar = el('div', 'flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 text-xs text-slate-400');
    const rowCount = el('span', 'tabular-nums');
    const countRows = () => {
        rowCount.textContent = locked ? `${result.rows.length + locked}${result.truncated ? '+' : ''}행 중 ${result.rows.length}행`
            : result.truncated ? `상위 ${result.rows.length}행` : `${result.rows.length}행`;
    };
    countRows();
    toolbar.appendChild(rowCount);
    const actions = el('div', 'flex items-center gap-4');
    let toggle = null;
    if (toggleable) {
        toggle = currencyToggle(view);
        actions.appendChild(toggle.el);
    }
    if (isPaidAccount()) {
        const copyBtn = el('button', 'hover:text-white transition', 'CSV 복사');
        copyBtn.type = 'button';
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(toCsv(result, view));
                copyBtn.textContent = '복사됨';
            } catch {
                copyBtn.textContent = '복사 실패';
            }
            setTimeout(() => { copyBtn.textContent = 'CSV 복사'; }, 1500);
        });
        actions.appendChild(copyBtn);
    }
    let sqlBlock = null;
    if (sql) {
        const sqlBtn = el('button', 'hover:text-white transition', 'SQL 보기');
        sqlBtn.type = 'button';
        sqlBlock = el('pre', 'result-sql hidden', sql);
        sqlBtn.addEventListener('click', () => {
            const hidden = sqlBlock.classList.toggle('hidden');
            sqlBtn.textContent = hidden ? 'SQL 보기' : 'SQL 숨기기';
        });
        actions.appendChild(sqlBtn);
    }
    toolbar.appendChild(actions);
    card.appendChild(toolbar);
    if (sqlBlock) card.appendChild(sqlBlock);

    if (!result.rows.length) {
        card.appendChild(el('p', 'px-4 py-8 text-center text-slate-500 text-sm', '조건에 맞는 데이터가 없어요.'));
        return card;
    }

    const scroller = el('div', 'result-table-scroll');
    const table = el('table', 'result-table');
    scroller.appendChild(table);
    card.appendChild(scroller);

    // Align a column right when all its non-null values are numbers
    const numericColumns = () => result.columns.map((_, i) =>
        result.rows.some(r => r[i] !== null) && result.rows.every(r => r[i] === null || typeof r[i] === 'number'));
    let numericCols = numericColumns();

    function draw() {
        const thead = el('thead');
        const headRow = el('tr');
        result.columns.forEach((c, i) => {
            const label = view && result.money.columns[c] ? `${c} (${view})` : c;
            headRow.appendChild(el('th', numericCols[i] ? 'is-num' : '', label));
        });
        thead.appendChild(headRow);

        const tbody = el('tbody');
        const cells = viewCells(result, view);
        cells.slice(0, shown).forEach(row => {
            const tr = el('tr');
            row.forEach((cell, i) => {
                const td = el('td', numericCols[i] ? 'is-num' : '', cell.text);
                // An amount left in its own currency says which
                if (cell.currency !== undefined && cell.currency !== view) {
                    td.classList.add('is-unconverted');
                    if (cell.currency && cell.currency !== 'MIXED') td.appendChild(el('span', 'cell-currency', cell.currency));
                    td.title = UNCONVERTED_TITLE[cell.currency] ?? `${cell.currency} 환율이 없어 환산하지 않았어요`;
                }
                tr.appendChild(td);
            });
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
        cta.href = '/pricing/';
        cta.appendChild(el('i', 'fas fa-lock'));
        cta.appendChild(el('span', null, `나머지 ${lockedLabel}행은 유료 플랜에서 볼 수 있어요.`));
        cta.appendChild(el('i', 'fas fa-arrow-right text-xs'));
        card.appendChild(cta);
        return card;
    }

    // 100 rows -> the rest /query sent -> (warned) every row
    const footer = el('div');
    card.appendChild(footer);

    async function showAll(btn, hint) {
        btn.disabled = true;
        btn.textContent = '불러오는 중…';
        try {
            const full = await loadAll();
            Object.assign(result, { rows: full.rows, truncated: full.truncated, money: full.money });
            loadAll = null; // still truncated only under SQL_FULL_MAX_ROWS - nothing more to load
            numericCols = numericColumns();
            shown = result.rows.length;
            countRows();
            draw();
            renderFooter();
        } catch (error) {
            if (handleAuthError(error)) return;
            console.error(error);
            hint.textContent = '전체 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
            btn.disabled = false;
            btn.textContent = '다시 시도';
        }
    }

    function renderFooter() {
        footer.replaceChildren();
        if (result.rows.length > shown) {
            const moreBtn = el('button', 'result-more', `${result.rows.length - shown}행 더 보기`);
            moreBtn.type = 'button';
            moreBtn.addEventListener('click', () => {
                shown = result.rows.length;
                draw();
                renderFooter();
            });
            footer.appendChild(moreBtn);
        } else if (result.truncated && loadAll) {
            const box = el('div', 'result-load-all');
            const hint = el('p', null, `결과가 ${result.rows.length}행보다 많아요. 전체를 불러오면 시간이 걸리고 화면이 느려질 수 있어요.`);
            const btn = el('button', 'result-load-all-btn', '전체 불러오기');
            btn.type = 'button';
            btn.addEventListener('click', () => showAll(btn, hint));
            box.append(hint, btn);
            footer.appendChild(box);
        } else if (result.truncated) {
            footer.appendChild(el('p', 'px-4 py-3 border-t border-white/5 text-xs text-slate-500',
                `결과가 많아 상위 ${result.rows.length}행만 표시했어요. 조건을 더 좁히면 전체 결과를 볼 수 있어요.`));
        }
    }
    renderFooter();
    return card;
}

// The table as shown: amounts in the selected currency
function toCsv(result, view) {
    const esc = (v) => {
        const s = v === null || v === undefined ? '' : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = result.columns.map(c => (view && result.money.columns[c] ? `${c} (${view})` : c));
    const rows = viewCells(result, view).map(row => row.map(cell =>
        cell.currency !== undefined && cell.currency !== view && cell.currency ? `${cell.value} ${cell.currency}` : cell.value));
    return [header, ...rows].map(r => r.map(esc).join(',')).join('\n');
}

init();
