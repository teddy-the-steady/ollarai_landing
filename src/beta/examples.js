import { api } from './api.js';

// Example questions under the question box, one per group picked at random on each page load, all from
// GET /examples: worded by the backend from the newest filings and checked on Quick the night before
// (ollarai_backend common/example_questions.py), {group: [question, ...]}. No list of our own - when the
// server has none or can't be reached, no chips are shown.

const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Chips under the question box - fewer than the groups, so each load shows a different mix
const SHOWN = 4;

// One question from each of SHOWN random groups, in group order; [] when the server has none
export async function exampleQuestions(lang) {
    const groups = await api(`/examples?lang=${lang}`).then(data => data?.groups || {}).catch(() => ({}));
    const lists = Object.values(groups).filter(questions => questions?.length);
    while (lists.length > SHOWN) lists.splice(Math.floor(Math.random() * lists.length), 1);
    // A chip ends with "?" or no mark: older nights' wordings may still end with "." / "。"
    return lists.map(pick).map(question => question.trim().replace(/[.。．]+$/u, '').trimEnd());
}

// Pro-only examples: share prices / market data are answered on 정밀 답변 for paid accounts only
// (ollarai_backend pipeline/price_preview.py, paid_only / precise_only). Taken word for word from the
// backend's slang / quant2 / chart sets (pipeline_test_logs/ai_beta/newdata), only wordings that passed at
// least 4 of the last 6 paid runs and none tied to a fixed date. Chart-pattern ones (CHART_PATTERNS_PLAN.md:
// patterns / patterns_sequence sets) passed every one of their last 4-5 runs (2 paid + chart_pattern_eval
// run-service). A chip has to read at a glance: short,
// no explanation in brackets, and no clipped slang (맥디 골크) - investor terms like 장대양봉 / 상따 / 점상
// are fine. Listed with the sets taking turns so the two shown together mostly differ.
const PRO_QUESTIONS = {
    ko: [
        '오늘 장대양봉 나온 나스닥 종목 거래량 상위 5개',
        '오늘 MACD 데드크로스 난 미국 종목 중 시가총액 상위 5개',
        'PBR 1배 미만에 ROE 10% 넘는 코스피 기업 시총 순으로 5개',
        '지금 컵앤핸들 만들고 있는 나스닥 종목',
        '상따 하면 어땠어? 최근 2주 상한가 종목들 다음날 평균 수익률',
        '최근 3거래일 안에 MACD 골든크로스 나온 나스닥 종목 중 거래량 상위 5개',
        '최근 20거래일 안에 쌍바닥 돌파한 코스피 종목',
        '엔비디아 PER이 미국 반도체 회사 평균 PER보다 높아?',
        '최근 2주 사이에 점상 간 종목 있어?',
        '삼중바닥 찍고 장대양봉 나온 국내 상장 종목',
        '코스닥에서 최근 5거래일 연속 오른 종목 거래량 상위 5개',
        '코스닥 소형주 중 최근 일주일 30% 넘게 급등한 종목',
        '네이버 지금 쌍바닥 만드는 중이야?',
        '오늘 52주 신고가를 돌파하면서 거래량이 20일 평균의 3배 이상인 종목',
        '최근 거래일에 상승장악형 캔들 나온 나스닥 종목 거래량 상위 5개',
        '최근 10거래일 안에 박스권 돌파한 나스닥 종목',
        '오늘 5일선이 20일선을 골든크로스한 뉴욕증권거래소 종목 거래량 상위 5개',
        '지금 역헤드앤숄더 만들고 있는 나스닥 종목',
        '최근 2주 동안 상한가 두 번 이상 간 종목',
        '원형 바닥 찍고 52주 신고가 찍은 코스피 종목',
        '어제 3% 이상 갭상승으로 시작한 코스닥 종목 거래대금 순으로 5개',
        '최근 3거래일 망치형 나온 국내 상장 종목',
    ],
    en: [
        'Which Korean stocks hit the daily limit up on the latest trading day?',
        'KOSDAQ stocks forming a bull flag right now',
        'Nasdaq stocks with a MACD bullish crossover in the last 3 trading days, top 5 by volume',
        'US companies with P/B under 3 and ROE above 20%: top 5 by 6-month stock return',
        'KOSDAQ stocks that broke out of a double bottom in the last 10 trading days',
        'Nasdaq stocks with a bullish engulfing candle on the latest session, top 5 by volume',
        'Stocks that broke out to a new 52-week high today on volume at least 3x their 20-day average',
        'How many Nasdaq stocks are making higher highs and higher lows?',
        "Apple's market cap is how many times its 2025 net income?",
        'US-listed stocks that broke out of a Darvas box in the last 10 trading days',
    ],
    ja: [
        '今日大陽線が出たナスダック銘柄、出来高上位5',
        '週足でカップウィズハンドルを形成中の米国上場の銘柄',
        '直近3営業日でMACDがシグナルを上抜けたナスダック銘柄、出来高上位5',
        '直近5営業日でトリプルボトムを上抜けした米国上場の銘柄',
        'PBR1倍割れでROE10%以上の韓国企業、時価総額上位5社',
        'フラッグを付けた後に52週高値を更新したKOSDAQの銘柄',
        '韓国株で直近の取引日にストップ高になった銘柄',
        '今ダブルトップを形成中の韓国上場の銘柄',
        '直近の取引日に5%以上窓を開けて下落して始まったNYSE銘柄、出来高上位5',
    ],
};

const PRO_SHOWN = 2;

// The next n questions of a list in turn: each page load moves n along (random when storage is blocked)
function nextInTurn(list, key, n = 1) {
    let start;
    try {
        const last = Number.parseInt(localStorage.getItem(key), 10);
        start = Number.isInteger(last) ? (last + 1) % list.length : Math.floor(Math.random() * list.length);
        localStorage.setItem(key, String((start + n - 1) % list.length));
    } catch {
        start = Math.floor(Math.random() * list.length);
    }
    return Array.from({ length: Math.min(n, list.length) }, (_, i) => list[(start + i) % list.length]);
}

// PRO_SHOWN hard Pro questions, the next ones in turn per load
export function proExampleQuestions(lang) {
    return nextInTurn(PRO_QUESTIONS[lang] || PRO_QUESTIONS.en, `ollarai-pro-example:${lang}:hard`, PRO_SHOWN);
}
