// Mini chart of a chart-pattern event (GET /history/{id}/chart - server pipeline/pattern_charts.py): candles as
// an index (the window's first close = 100), the pattern's points as markers, its lines, the neckline / target /
// stop as price lines with their distance from the last close, the moving averages as lines. No price reaches the page: the server sends the
// index and approximations only (PRICE_DATA_LICENSING_PLAN.md §5.3) - the range is shown as text beside it.
// Lightweight Charts (Apache-2.0, TradingView attribution logo kept) is loaded only when a chart opens.
import { lang, t } from './i18n.js';

// Korean / Japanese charts: rising red, falling blue; English: green / red
const UP_RED = lang === 'ko' || lang === 'ja';
const UP = UP_RED ? '#ef4444' : '#22c55e';
const DOWN = UP_RED ? '#3b82f6' : '#ef4444';
// The neckline only: no target / stop price is drawn (server pattern_charts.py - not investment advice)
const LEVEL_COLORS = { neckline: '#fbbf24' };
// Moving averages (server `ma`: 5 / 20 / 60 / 120 days, or 5 / 10 / 20 / 60 weeks on weekly bars), by order
const MA_COLORS = ['#f472b6', '#fb923c', '#38bdf8', '#a78bfa'];
const maWeekly = (chart) => chart.timeframe === 'W' || chart.bars === 'W';

let libraryPromise = null;
const library = () => (libraryPromise ??= import('lightweight-charts'));

// "약 6.8만~7.4만원" / "about $60-$110": the window's lowest low and highest high, as the server rounded them
const WON_UNITS = { ko: ['억', '만', '원'], ja: ['億', '万', 'ウォン'] };

function rangeText(range) {
    const units = WON_UNITS[lang];
    const fmt = (v) => {
        if (range.currency !== 'KRW') return `$${v.toLocaleString('en-US')}`;
        if (!units) return `₩${v.toLocaleString('en-US')}`;
        if (v >= 1e8) return `${+(v / 1e8).toFixed(2)}${units[0]}`;
        if (v >= 1e4) return `${+(v / 1e4).toFixed(1)}${units[1]}`;
        return v.toLocaleString('en-US');
    };
    const unit = range.currency === 'KRW' && units ? units[2] : '';
    return t('result.chart.range', { min: fmt(range.min), max: fmt(range.max), unit });
}

const signed = (n) => `${n > 0 ? '+' : ''}${n}%`;

function header(chart) {
    const box = document.createElement('div');
    box.className = 'pattern-chart-head';
    const title = document.createElement('strong');
    title.textContent = chart.label?.[lang] ?? chart.label?.en ?? chart.pattern;
    box.appendChild(title);
    // a day state (long candle, cross ... - "PriceEvents") or a window screen's days has no status, only its
    // day - a window its first ~ last session
    const facts = chart.status ? [t(`result.chart.status.${chart.status}`)] : [];
    if (chart.timeframe === 'W' || chart.bars === 'W') facts.push(t('result.chart.weekly'));
    const d = chart.dates;
    const dot = (s) => s.replaceAll('-', '.');
    if (d.event) facts.push(d.start ? `${dot(d.start)} ~ ${dot(d.event)}` : dot(d.event));
    else if (d.breakout) facts.push(t('result.chart.breakout', { date: d.breakout.replaceAll('-', '.') }));
    else if (d.completion) facts.push(t('result.chart.completion', { date: d.completion.replaceAll('-', '.') }));
    const meta = document.createElement('span');
    meta.textContent = facts.filter(Boolean).join(' · ');
    box.appendChild(meta);
    return box;
}

function footer(chart) {
    const box = document.createElement('div');
    box.className = 'pattern-chart-foot';
    const lines = [t('result.chart.index'), rangeText(chart.level_range)];
    chart.levels.forEach(lv => lines.push(`${t(`result.chart.level.${lv.kind}`)} ${signed(lv.pct_from_last)}`));
    lines.forEach(text => {
        const span = document.createElement('span');
        span.textContent = text;
        box.appendChild(span);
    });
    (chart.ma ?? []).forEach((ma, i) => {
        const span = document.createElement('span');
        span.style.color = MA_COLORS[i % MA_COLORS.length];
        span.textContent = `— ${t(maWeekly(chart) ? 'result.chart.ma_weekly' : 'result.chart.ma', { n: ma.period })}`;
        box.appendChild(span);
    });
    const note = document.createElement('p');
    note.className = 'pattern-chart-disclaimer';
    note.textContent = t('result.chart.disclaimer');
    box.appendChild(note);
    return box;
}

// Draws `chart` into `container`; returns a function that removes it (the chart listens to resizes)
export async function renderPatternChart(container, chart) {
    const { createChart, CrosshairMode } = await library();
    container.replaceChildren(header(chart));
    const area = document.createElement('div');
    area.className = 'pattern-chart-area';
    container.append(area, footer(chart));

    const view = createChart(area, {
        height: 260,
        layout: { background: { color: 'transparent' }, textColor: '#94a3b8', fontSize: 11, attributionLogo: true },
        grid: { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
        rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)' },
        timeScale: { borderColor: 'rgba(255,255,255,0.08)' },
        crosshair: { mode: CrosshairMode.Normal },
        localization: { priceFormatter: (v) => v.toFixed(1) },
        handleScroll: false,
        handleScale: false,
    });
    const candles = view.addCandlestickSeries({
        upColor: UP, downColor: DOWN, borderUpColor: UP, borderDownColor: DOWN, wickUpColor: UP, wickDownColor: DOWN,
        priceLineVisible: false, lastValueVisible: false,
    });
    candles.setData(chart.candles.map(([time, open, high, low, close]) => ({ time, open, high, low, close })));

    const volume = view.addHistogramSeries({ priceScaleId: '', priceFormat: { type: 'volume' }, lastValueVisible: false,
        priceLineVisible: false });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    candles.priceScale().applyOptions({ scaleMargins: { top: 0.08, bottom: 0.22 } });
    volume.setData(chart.volume.map(([time, value], i) => ({
        time, value: value ?? 0,
        color: chart.candles[i] && chart.candles[i][4] >= chart.candles[i][1] ? `${UP}55` : `${DOWN}55`,
    })));

    (chart.ma ?? []).forEach((ma, i) => {
        const line = view.addLineSeries({ color: MA_COLORS[i % MA_COLORS.length], lineWidth: 1, priceLineVisible: false,
            lastValueVisible: false, crosshairMarkerVisible: false });
        line.setData(ma.points.map(([time, value]) => ({ time, value })));
    });
    chart.lines.forEach(seg => {
        const line = view.addLineSeries({ color: '#e2e8f0', lineWidth: 1, lineStyle: 2, priceLineVisible: false,
            lastValueVisible: false, crosshairMarkerVisible: false });
        // two points on the same bar (a one-day level) can't be a series: drawn as the price line instead
        if (seg[0].time !== seg[1].time) line.setData([...seg].sort((a, b) => (a.time < b.time ? -1 : 1)));
    });
    chart.levels.forEach(lv => candles.createPriceLine({
        price: lv.value, color: LEVEL_COLORS[lv.kind] ?? '#94a3b8', lineWidth: 1, lineStyle: 1, axisLabelVisible: true,
        title: `${t(`result.chart.level.${lv.kind}`)} ${signed(lv.pct_from_last)}`,
    }));
    const bull = chart.direction === 'bull';
    candles.setMarkers(chart.points.map(p => ({
        time: p.time,
        position: p.value <= (chart.candles.find(c => c[0] === p.time)?.[3] ?? p.value) + 0.05 ? 'belowBar' : 'aboveBar',
        // no direction (a window screen's days, a volume spike): neutral
        color: chart.direction == null ? '#e2e8f0' : bull ? UP : DOWN,
        shape: 'circle',
        text: p.label,
    })).sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0)));
    view.timeScale().fitContent();

    const resize = new ResizeObserver(() => view.applyOptions({ width: area.clientWidth }));
    resize.observe(area);
    return () => {
        resize.disconnect();
        view.remove();
    };
}
