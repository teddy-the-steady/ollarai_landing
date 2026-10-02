import './style.css';
import { supabase, api, ApiError, signOut, LOGIN_PATH } from './beta/api.js';

const VIEWS = ['loading', 'start', 'pending', 'blocked', 'error', 'query'];
const startedKey = (userId) => `ollarai-beta-started:${userId}`;

const queryForm = document.getElementById('query-form');
const queryInput = document.getElementById('query-input');
const querySubmit = document.getElementById('query-submit');
const resultsEl = document.getElementById('results');

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

    // Only paid-tier queries are counted (free is unlimited, daily_limit is null)
    const isPaid = me.status === 'approved' && me.tier === 'paid';
    const badge = document.getElementById('usage-badge');
    badge.classList.toggle('hidden', !isPaid || me.daily_limit == null);
    badge.textContent = `유료 ${me.used_today} / ${me.daily_limit}`;

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
    if (me.status === 'approved') return showView('query');
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

// ---------- errors ----------

function errorMessage(error) {
    if (!(error instanceof ApiError)) return '문제가 발생했어요. 잠시 후 다시 시도해 주세요.';
    const detailMessage = typeof error.detail === 'string' ? null : error.detail?.message;
    switch (error.status) {
        case 0: return '네트워크 연결을 확인해 주세요.';
        case 403: return '이 계정에서는 유료 방식을 사용할 수 없어요.';
        case 429:
            return error.detail?.daily_limit
                ? `오늘 유료 질문 한도(${error.detail.daily_limit}회)를 모두 사용했어요. 무료로 바꾸면 계속 질문할 수 있고, 유료 한도는 매일 자정(한국 시간)에 초기화돼요.`
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
        const response = await api('/query', { method: 'POST', body: { question, language: 'ko', ...(tier ? { tier } : {}) } });
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
        card.showError(errorMessage(error));
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

function createResultCard(question) {
    const root = el('article', 'result-card');
    const header = el('div', 'flex items-start justify-between gap-3 mb-5');
    header.appendChild(el('h2', 'text-xl md:text-2xl font-semibold text-white leading-snug', question));
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

    return {
        el: root,
        showResponse(response) {
            clearInterval(timer);
            // Paid accounts can switch tiers, so mark which path produced this answer
            if (me?.tier === 'paid' && TIER_LABEL[response.tier]) {
                header.appendChild(el('span', `tier-badge tier-badge-${response.tier}`, TIER_LABEL[response.tier]));
            }
            body.replaceChildren();
            const parts = response.is_multi_query && response.queries?.length ? response.queries : [response];
            parts.forEach(part => body.appendChild(renderPart(part, response.is_multi_query)));
        },
        showError(message) {
            clearInterval(timer);
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

function renderPart(part, isMulti) {
    const wrap = el('section', 'flex flex-col gap-3');
    if (isMulti && part.question) {
        wrap.appendChild(el('h3', 'text-sm font-semibold text-slate-300', part.question));
    }
    if (part.message) {
        wrap.appendChild(notice(part.message, part.result ? 'warn' : 'info'));
    }
    if (part.result) {
        wrap.appendChild(renderTable(part.result, part.sql));
    } else if (!part.message) {
        wrap.appendChild(notice('결과를 찾지 못했어요. 질문을 조금 바꿔서 다시 시도해 주세요.', 'info'));
    }
    return wrap;
}

// Columns whose integers are identifiers or periods, not amounts: no thousands separators
const RAW_NUMBER_COLUMN = /(year|yr|quarter|qtr|month|period|code|ticker|corp_code|stock_code|^id$|_id$)/i;
const numberFormat = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 4 });

function formatCell(value, column) {
    if (value === null || value === undefined) return { text: '—', numeric: false };
    if (typeof value === 'number') {
        const raw = Number.isInteger(value) && RAW_NUMBER_COLUMN.test(column);
        return { text: raw ? String(value) : numberFormat.format(value), numeric: true };
    }
    if (typeof value === 'boolean') return { text: value ? 'true' : 'false', numeric: false };
    return { text: String(value), numeric: false };
}

function renderTable(result, sql) {
    const card = el('div', 'result-table-card');

    const toolbar = el('div', 'flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 text-xs text-slate-400');
    toolbar.appendChild(el('span', 'tabular-nums', result.truncated ? `상위 ${result.rows.length}행` : `${result.rows.length}행`));
    const actions = el('div', 'flex items-center gap-4');
    const copyBtn = el('button', 'hover:text-white transition', 'CSV 복사');
    copyBtn.type = 'button';
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(toCsv(result));
            copyBtn.textContent = '복사됨';
        } catch {
            copyBtn.textContent = '복사 실패';
        }
        setTimeout(() => { copyBtn.textContent = 'CSV 복사'; }, 1500);
    });
    actions.appendChild(copyBtn);
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
    const thead = el('thead');
    const headRow = el('tr');

    // Align a column right when all its non-null values are numbers
    const numericCols = result.columns.map((_, i) =>
        result.rows.some(r => r[i] !== null) && result.rows.every(r => r[i] === null || typeof r[i] === 'number'));

    result.columns.forEach((c, i) => headRow.appendChild(el('th', numericCols[i] ? 'is-num' : '', c)));
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = el('tbody');
    result.rows.forEach(row => {
        const tr = el('tr');
        row.forEach((value, i) => {
            const { text } = formatCell(value, result.columns[i]);
            tr.appendChild(el('td', numericCols[i] ? 'is-num' : '', text));
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    scroller.appendChild(table);
    card.appendChild(scroller);

    if (result.truncated) {
        card.appendChild(el('p', 'px-4 py-3 border-t border-white/5 text-xs text-slate-500',
            `결과가 많아 상위 ${result.rows.length}행만 표시했어요. 조건을 더 좁히면 전체 결과를 볼 수 있어요.`));
    }
    return card;
}

function toCsv(result) {
    const esc = (v) => {
        const s = v === null || v === undefined ? '' : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [result.columns, ...result.rows].map(r => r.map(esc).join(',')).join('\n');
}

init();
