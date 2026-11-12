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

// Pro-only examples: share prices / market data (시가총액·PER·PBR·배당수익률) are answered on 정밀 답변 for
// paid accounts only (ollarai_backend pipeline/price_preview.py, paid_only / precise_only). Picked from
// questions that passed every paid run of the backend's prices / valuation sets
// (pipeline_test_logs/ai_beta/newdata) and from query_history (answered with rows in nearly every run,
// paid ones included, results checked by hand), none tied to a fixed date so they don't go stale.
// medium: one condition, ranking or two-company comparison. hard: combined conditions, ratios,
// aggregates over a ranking, market data crossed with financials.
const PRO_QUESTIONS = {
    ko: {
        medium: [
            '테슬라 최근 1년 주가 수익률',
            'PER 낮은 코스피 기업 10개',
            '배당수익률 높은 미국 기업 5개',
            'PBR 1 미만인 코스피 기업 몇 개야',
            '아마존보다 시총 높은 회사 알려줘',
            '삼성전자랑 SK하이닉스 시가총액 비교해줘',
            '국내 반도체 회사 시가총액 순위 5개',
            '미국 기업 시가총액 순위 5위까지',
            '애플과 마이크로소프트 최근 1년 주가 수익률 비교',
            '애플 올해 최고 종가와 그 날짜',
            '최근 3개월 수익률 상위 10개 나스닥 종목',
        ],
        hard: [
            '메타 주가 52주 고점 대비 지금 몇 % 빠져 있어?',
            '엔비디아 최근 1년 최대 낙폭(MDD)',
            '엔비디아가 올해 하루에 5% 이상 떨어진 날은 며칠이야?',
            '52주 최고가 대비 반토막 난 나스닥 종목 몇 개야?',
            '52주 신고가 5% 이내에 있는 나스닥 종목 중 최근 한 달 평균 거래량 상위 10개',
            '최근 2주 안에 골든크로스(50일선이 200일선 상향 돌파) 나온 종목',
            '52주 최저가 대비 3배 이상 오른 미국 종목',
            '최근 6개월 동안 주가가 2배 이상 오른 나스닥 종목',
            '최근 5거래일 연속 상승한 나스닥 종목',
            '애플 시가총액은 삼성전자의 몇 배야?',
            '시가총액 상위 10개 미국 기업의 평균 PER',
            '코스피 시총 상위 3개 기업 배당수익률',
            'PER 10 이하이면서 ROE 15% 이상인 코스피 기업 중 시가총액 큰 순으로 10개',
            '시가총액이 2025년 매출의 10배 이상인 미국 기업 중 시총 큰 순 5개',
        ],
    },
    en: {
        medium: [
            'What are the 5 largest US companies by market cap?',
            'Top 5 US companies by dividend yield',
            'How many KOSPI companies trade below book value (P/B under 1)?',
            "What is Nvidia's 3-month stock return?",
            'Top 10 Nasdaq stocks by 3-month return',
        ],
        hard: [
            "How many times bigger is Apple's market cap than Samsung Electronics'?",
            'Nasdaq stocks that have risen 5 trading days in a row',
            'Top 10 NYSE stocks by 6-month price momentum',
        ],
    },
    // No hard Japanese question passed every run yet: both medium ones are shown
    ja: {
        medium: [
            'アマゾンより時価総額が大きい会社は？',
            'PBRが最も低い韓国企業5社',
            'テスラの年初来の株価騰落率は？',
        ],
        hard: [],
    },
};

const PRO_SHOWN = 2;

// The next question of a list in turn: each page load moves one along (random when storage is blocked)
function nextInTurn(list, key) {
    try {
        const last = Number.parseInt(localStorage.getItem(key), 10);
        const index = Number.isInteger(last) ? (last + 1) % list.length : Math.floor(Math.random() * list.length);
        localStorage.setItem(key, String(index));
        return list[index];
    } catch {
        return pick(list);
    }
}

// One medium and one hard Pro question, each list taking its own turns; a level with no questions
// is made up from the other one so PRO_SHOWN chips still show
export function proExampleQuestions(lang) {
    const levels = PRO_QUESTIONS[lang] || PRO_QUESTIONS.en;
    const picked = ['medium', 'hard']
        .filter(level => levels[level].length)
        .map(level => nextInTurn(levels[level], `ollarai-pro-example:${lang}:${level}`));
    const rest = [...levels.medium, ...levels.hard].filter(question => !picked.includes(question));
    while (picked.length < PRO_SHOWN && rest.length) picked.push(rest.splice(Math.floor(Math.random() * rest.length), 1)[0]);
    return picked;
}
