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
    return lists.map(pick);
}

// Pro-only examples: share prices / market data are answered on 정밀 답변 for paid accounts only
// (ollarai_backend pipeline/price_preview.py, paid_only / precise_only). Hard ones only (L4 / L5) from the
// backend's slang / quant2 / chart sets (pipeline_test_logs/ai_beta/newdata), picked from those that passed
// the latest paid runs and are tied to no fixed date. Listed with the sets taking turns so the two shown
// together differ.
const PRO_QUESTIONS = {
    ko: [
        '최근 거래일에 상승장악형 캔들 나온 나스닥 종목 거래량 상위 5개',
        '배당수익률 4% 이상이면서 2025년 배당성향(배당금/순이익) 50% 미만인 국내 기업',
        '코스피에서 MACD 골든크로스 나온 종목',
        '눌림목 나스닥 종목 거래량 상위 5개 (정배열 + 20일선 3% 이내)',
        '시가총액 상위 20개 미국 기업 중 올해 최대 낙폭(MDD)이 가장 컸던 5개',
        '시총 1조원 이상 국내 기업 중 FCF 수익률(2025년 잉여현금흐름/시가총액) 10% 넘는 곳 상위 5개',
        '오늘 MACD 데드크로스 난 미국 종목 중 시가총액 상위 5개',
        '코스닥에서 흑삼병 나온 종목 거래대금 상위 5개',
        '오늘 MACD 골든크로스가 나오면서 거래량도 20일 평균의 2배 넘게 터진 미국 종목',
        '최근 2주간 상한가 갔던 종목들 다음 거래일 평균 등락률',
        '삼성전자 MACD 지금 골든크로스야?',
        '오늘 52주 신고가를 돌파하면서 거래량이 20일 평균의 3배 이상인 종목',
    ],
    en: [
        'Nasdaq stocks with a bullish engulfing candle on the latest session, top 5 by volume',
        'Stocks that broke out to a new 52-week high today on volume at least 3x their 20-day average',
    ],
    ja: [
        '直近3営業日でMACDがシグナルを上抜けたナスダック銘柄、出来高上位5',
        '押し目：パーフェクトオーダーで20日線の3%以内まで下げたナスダック銘柄、出来高上位5',
        '赤三兵（3日連続の陽線で終値も毎日上昇）が出たナスダック銘柄、出来高上位5',
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
