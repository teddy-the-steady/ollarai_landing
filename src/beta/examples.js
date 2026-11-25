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
// (ollarai_backend pipeline/price_preview.py, paid_only / precise_only). Taken from the backend's sets
// (pipeline_test_logs/ai_beta/newdata: slang / quant / quant2 / chart / mholdout / patterns /
// patterns_sequence), and kept only when asked live twice on Precise as the test account (2026-11-25)
// came back with rows that answer the question, no notice and no time-out - a pattern set "passes" in the
// backend's runs on 0 rows too, which shows the user "couldn't find any". Dropped then: 상따 / 점상 (the
// slang went unread), MACD golden cross (read as the moving-average one), single-company patterns
// (네이버 쌍바닥), bullish engulfing / bull flag on one market (often none that day), 원형 바닥 + 신고가,
// a 5% gap down on NYSE (timed out), and ones that failed one of the two runs. A chip has to read at a
// glance: short, no explanation in brackets, and no clipped slang (맥디 골크) - investor terms like
// 장대양봉 / 상한가 / 동전주 are fine. Listed with the kinds taking turns so the two shown together mostly differ.
const PRO_QUESTIONS = {
    ko: [
        '오늘 장대양봉 나온 나스닥 종목 거래량 상위 5개',
        '테슬라 20일선 이격도 몇 %야?',
        '오늘 MACD 데드크로스 난 미국 종목 중 시가총액 상위 5개',
        '오늘 52주 신저가 찍은 나스닥 종목 시가총액 상위 5개',
        'PBR 1배 미만에 ROE 10% 넘는 코스피 기업 시총 순으로 5개',
        '지금 컵앤핸들 만들고 있는 나스닥 종목',
        '주가 1만원 이하 코스피 종목 중 최근 일주일 상승률 상위 5개',
        '테슬라 시총이 2025년 매출의 몇 배인지 알려줘',
        '최근 20거래일 안에 쌍바닥 돌파한 코스피 종목',
        '엔비디아 PER이 미국 반도체 회사 평균 PER보다 높아?',
        '코스피 종목 중 최근 고점과 저점을 모두 높이고 있는 종목 몇 개야?',
        '삼중바닥 찍고 장대양봉 나온 국내 상장 종목',
        '어제 코스피 거래대금 상위 5개',
        '코스닥에서 최근 5거래일 연속 오른 종목 거래량 상위 5개',
        'AMD PBR이 미국 반도체 회사들 평균보다 낮은 편이야?',
        '코스닥 소형주 중 최근 일주일 30% 넘게 급등한 종목',
        '최근 6개월 동안 주가가 2배 이상 오른 나스닥 종목',
        '오늘 52주 신고가를 돌파하면서 거래량이 20일 평균의 3배 이상인 종목',
        '52주 최고가 대비 반토막 난 나스닥 종목 몇 개야?',
        '최근 10거래일 안에 박스권 돌파한 나스닥 종목',
        '나스닥 동전주 중 오늘 거래량 상위 5개',
        '오늘 5일선이 20일선을 골든크로스한 뉴욕증권거래소 종목 거래량 상위 5개',
        '어제 상한가 간 종목 알려줘',
        '어제 3% 이상 갭상승으로 시작한 코스닥 종목 거래대금 순으로 5개',
        '최근 5거래일 V자 반등 나온 미국 상장 종목',
        '최근 3거래일 망치형 나온 국내 상장 종목',
        '마이크로소프트 주가가 50일 이동평균선보다 몇 % 위에 있어?',
    ],
    en: [
        'Which Korean stocks hit the daily limit up on the latest trading day?',
        'KOSDAQ stocks forming a double top right now',
        'Nasdaq stocks with a MACD bullish crossover in the last 3 trading days, top 5 by volume',
        'Top 10 Nasdaq stocks by 3-month return',
        'US companies with P/B under 3 and ROE above 20%: top 5 by 6-month stock return',
        'Korean-listed stocks forming a bull flag right now',
        'Stocks that broke out to a new 52-week high today on volume at least 3x their 20-day average',
        'What are the 5 largest US companies by market cap?',
        'How many Nasdaq stocks are making higher highs and higher lows?',
        'KOSDAQ stocks forming a head and shoulders right now',
        "Apple's market cap is how many times its 2025 net income?",
        'US-listed stocks that broke out of a Darvas box in the last 10 trading days',
    ],
    ja: [
        '今日大陽線が出たナスダック銘柄、出来高上位5',
        '今三尊を形成中の韓国上場の銘柄',
        '週足でカップウィズハンドルを形成中の米国上場の銘柄',
        'メタのPER、PBR、ROEを教えて',
        '直近3営業日でMACDがシグナルを上抜けたナスダック銘柄、出来高上位5',
        '2025年の営業利益率が30%以上の米国企業、時価総額上位5社',
        '直近5営業日でトリプルボトムを上抜けした米国上場の銘柄',
        '直近5営業日でフラッグを上抜けした韓国上場の銘柄',
        'PBR1倍割れでROE10%以上の韓国企業、時価総額上位5社',
        '今日陽のはらみ線が出たKOSPIの銘柄はいくつ?',
        'フラッグを付けた後に52週高値を更新したKOSDAQの銘柄',
        '今ダブルトップを形成中の韓国上場の銘柄',
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
