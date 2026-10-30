// How a result table's cells are shown, from ResultTable.display
// (ollarai_backend service_pipeline/pipeline/result_display.py): column labels in ko / en / ja,
// a format per column, the companies' display names, period_start_date / period_end_date shown as one.
// Tables saved before display existed (display: null) are shown as before - raw names, plain numbers.

const PERIOD_LABEL = { ko: '기간', en: 'Period', ja: '期間' };

// Unit after a 조·억 amount or a price (ko, ja); en uses Intl's currency symbol
const CURRENCY_WORD = {
    ko: { KRW: '원', USD: '달러', JPY: '엔', CNY: '위안', EUR: '유로', HKD: '홍콩달러' },
    ja: { KRW: 'ウォン', USD: 'ドル', JPY: '円', CNY: '元', EUR: 'ユーロ', HKD: '香港ドル' },
};
const LARGE_UNITS = {
    ko: [[1e12, '조'], [1e8, '억'], [1e4, '만']],
    ja: [[1e12, '兆'], [1e8, '億'], [1e4, '万']],
};
const SHARES_UNIT = { ko: '주', ja: '株', en: '' };
const MULTIPLE_UNIT = { ko: '배', ja: '倍', en: 'x' };
const HALF = { ko: ['상반기', '하반기'], en: ['H1', 'H2'], ja: ['上期', '下期'] };

// Columns whose integers are identifiers or periods, not amounts: no thousands separators (tables without display)
const RAW_NUMBER_COLUMN = /(year|yr|quarter|qtr|month|period|code|ticker|corp_code|stock_code|^id$|_id$)/i;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

const isCurrencyCode = (c) => typeof c === 'string' && /^[A-Z]{3}$/.test(c);

export function createFormatter(lang, locale) {
    const number = (digits) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits });
    const int = number(0);
    const dec2 = number(2);
    const dec4 = number(4);

    // 원 glued, 달러 spaced (ko); 円 / ドル glued (ja)
    function currencyWord(code) {
        if (!code) return '';
        const word = CURRENCY_WORD[lang]?.[code];
        if (!word) return ` ${code}`;
        return lang === 'ko' && word !== '원' ? ` ${word}` : word;
    }

    // 97조 1,467억원 / 1,661억원 / 5,320만원 (ko), 97兆1,467億ウォン (ja), ₩97.1T / $68.2B (en).
    // currency null (not traced, or MIXED): no unit.
    function amount(value, currency) {
        const code = isCurrencyCode(currency) ? currency : null;
        const abs = Math.abs(value);
        if (lang === 'en') {
            const opts = abs < 1e4 ? { maximumFractionDigits: abs < 100 ? 2 : 0 } : { notation: 'compact', maximumFractionDigits: 1 };
            if (code) Object.assign(opts, { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' });
            try { return new Intl.NumberFormat('en-US', opts).format(value); } catch { return int.format(value); }
        }
        const [[trillion, tLabel], [hundredMillion, hLabel], [tenThousand, kLabel]] = LARGE_UNITS[lang] || LARGE_UNITS.ko;
        // Units picked on the rounded value: 9,999.6억 is 1조, 9,999.6만 is 1억
        const hundredMillions = Math.round(abs / hundredMillion);
        const tenThousands = Math.round(abs / tenThousand);
        let text;
        if (hundredMillions * hundredMillion >= trillion) {
            const rest = hundredMillions % 1e4;
            text = `${int.format(Math.floor(hundredMillions / 1e4))}${tLabel}`
                + (rest ? `${lang === 'ko' ? ' ' : ''}${int.format(rest)}${hLabel}` : '');
        } else if (tenThousands * tenThousand >= hundredMillion) {
            text = `${int.format(hundredMillions)}${hLabel}`;
        } else if (abs >= tenThousand) {
            text = `${int.format(tenThousands)}${kLabel}`;
        } else {
            text = (abs < 100 ? dec2 : int).format(abs);
        }
        return `${value < 0 ? '-' : ''}${text}${currencyWord(code)}`;
    }

    // 4,950원 / $123.45 - per-share amounts, never shortened
    function price(value, currency) {
        const code = isCurrencyCode(currency) ? currency : null;
        if (lang === 'en' && code) {
            try {
                return new Intl.NumberFormat('en-US', { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol',
                    maximumFractionDigits: 2 }).format(value);
            } catch { /* not a code Intl knows */ }
        }
        return `${dec2.format(value)}${lang === 'en' ? (code ? ` ${code}` : '') : currencyWord(code)}`;
    }

    function date(value) {
        const m = ISO_DATE.exec(String(value));
        if (!m) return String(value);
        const [, y, mo, d] = m;
        if (lang === 'en') {
            return new Date(Date.UTC(+y, +mo - 1, +d)).toLocaleDateString('en-US',
                { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
        }
        return `${y}.${mo}.${d}`;
    }

    const monthName = (mo) => new Date(Date.UTC(2000, mo - 1, 1)).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });

    // 2025.07 ~ 2025.09 / Jul–Sep 2025 for whole months, else both dates
    function period(start, end) {
        const s = ISO_DATE.exec(String(start ?? ''));
        const e = ISO_DATE.exec(String(end ?? ''));
        if (!s || !e) return [start, end].filter(v => v != null).map(date).join(' ~ ') || '—';
        const lastDay = new Date(Date.UTC(+e[1], +e[2], 0)).getUTCDate();
        if (s[3] !== '01' || +e[3] !== lastDay) return `${date(start)} ~ ${date(end)}`;
        const same = s[1] === e[1] && s[2] === e[2];
        if (lang === 'en') {
            const a = monthName(+s[2]), b = monthName(+e[2]);
            if (same) return `${a} ${s[1]}`;
            return s[1] === e[1] ? `${a}–${b} ${s[1]}` : `${a} ${s[1]} – ${b} ${e[1]}`;
        }
        return same ? `${s[1]}.${s[2]}` : `${s[1]}.${s[2]} ~ ${e[1]}.${e[2]}`;
    }

    // { text, numeric, title? } of one cell. currency: the amount's currency when known.
    function cell(value, col, currency, companies) {
        if (value === null || value === undefined) return { text: '—', numeric: false };
        const mapped = col.values?.[String(value)];
        if (mapped) return { text: mapped[lang] ?? String(value), numeric: false };
        if (col.format === 'company') {
            const names = companies?.[value];
            return { text: (lang === 'ko' ? names?.ko : names?.en) ?? names?.en ?? String(value), numeric: false };
        }
        if (typeof value === 'string' && col.format !== 'text' && col.format !== 'legacy' && ISO_DATE.test(value)) {
            return { text: date(value), numeric: false };
        }
        if (typeof value !== 'number') return { text: String(value), numeric: false };
        const full = `${dec4.format(value)}${isCurrencyCode(currency) ? ` ${currency}` : ''}`;
        switch (col.format) {
            case 'amount': return { text: amount(value, currency), numeric: true, title: full };
            case 'price': return { text: price(value, currency), numeric: true };
            case 'shares': return { text: `${int.format(value)}${SHARES_UNIT[lang] ?? ''}`, numeric: true };
            case 'percent': return { text: `${dec2.format(value)}%`, numeric: true };
            case 'fraction': return { text: `${dec2.format(value * 100)}%`, numeric: true, title: full };
            case 'multiple': return { text: `${dec2.format(value)}${MULTIPLE_UNIT[lang] ?? 'x'}`, numeric: true };
            case 'integer': return { text: int.format(value), numeric: true };
            case 'year': return { text: String(value), numeric: true };
            case 'quarter':
                return { text: lang === 'ko' ? `${value}분기` : lang === 'ja' ? `第${value}四半期` : `Q${value}`, numeric: false };
            case 'half': return { text: HALF[lang]?.[value - 1] ?? String(value), numeric: false };
            case 'month': return { text: lang === 'en' ? monthName(value) : `${value}${lang === 'ja' ? '月' : '월'}`, numeric: false };
            case 'legacy':
                return { text: Number.isInteger(value) && RAW_NUMBER_COLUMN.test(col.name) ? String(value) : dec4.format(value), numeric: true };
            default: return { text: dec2.format(value), numeric: true, title: full };
        }
    }

    return { cell, period };
}

// The columns to show: [{ index, name, label, format, values, end? }] - ids left out,
// a period pair as one column (index = the start's, end = the end's).
export function shownColumns(result, lang) {
    const display = result.display;
    if (!display) {
        return result.columns.map((name, index) => ({ index, name, label: name, format: 'legacy' }));
    }
    const ends = new Map((display.periods || []).map(([s, e]) => [s, e]));
    const skipped = new Set((display.periods || []).map(([, e]) => e));
    const out = [];
    display.columns.forEach((col, index) => {
        if (col.format === 'id' || skipped.has(index)) return;
        const name = result.columns[index];
        const entry = { index, name, label: col.label?.[lang] ?? name, format: col.format, values: col.values };
        if (ends.has(index)) {
            Object.assign(entry, { end: ends.get(index), label: PERIOD_LABEL[lang] ?? PERIOD_LABEL.en, format: 'period' });
        }
        out.push(entry);
    });
    return out;
}
