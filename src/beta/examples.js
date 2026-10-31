// Example questions under the question box, one per group picked at random on each page load.
// Korean ones are worded as in ollarai_backend pipeline_test_logs/ai_beta runs where Quick passed every time
// (graded sets or judge 85+ on real questions); en/ja are translations of the same questions.
// Left out: ownership / EBITDA / FCF / segment questions (newdata sets) - they pass in tests but
// "기아 최대주주랑 지분율" failed on Quick in production (2026-10-31).
const EXAMPLES = {
    ko: {
        company: [
            'SK하이닉스 작년 4분기 영업이익 알려줘',
            '삼성전자 3년간 capex 추이',
            '카카오 작년 영업활동현금흐름 얼마임?',
            '삼성SDI가 자기주식을 얼마나 가지고 있어?',
            '도요타자동차 당기순이익 얼마야?',
        ],
        compare: [
            '삼성전자랑 SK하이닉스 최근 3년간 매출액 알려줘',
            '삼성전자랑 SK하이닉스 무형자산 3년치 비교해줘',
            '애플 작년 판매비와관리비 전년 대비 증감률',
        ],
        rank: [
            '2025년 매출이 높은 유통회사 5개 알려줘',
            '증권업에 속한 회사들 2025년 매출액이 큰 순서대로 보여줘',
            '2025년 연말 기준 현금을 제일 많이 들고 있는 회사 top 10',
            '코스닥 반도체 및 장비 작년 ROE 상위 5곳',
            '건설사 2024년 OPM Top 5 알려줘',
        ],
        filter: [
            '매출액 성장률이 100% 넘는 기업들 보여줘',
            '코스닥에서 작년 대비 매출성장률 높은 회사 5개 알려줘',
            '화장품 회사 중에서 매출액 대비 연구개발비 비율이 높은 회사 10개',
            '코스피 전자 장비 부품 작년 영업이익률 18% 초과 기업',
        ],
    },
    en: {
        company: [
            "SK hynix operating income in Q4 last year",
            "Samsung Electronics capex over the last 3 years",
            "Kakao operating cash flow last year",
            "How much treasury stock does Samsung SDI hold?",
            "Toyota Motor net income",
        ],
        compare: [
            "Samsung Electronics vs SK hynix revenue over the last 3 years",
            "Compare Samsung Electronics and SK hynix intangible assets over 3 years",
            "Apple SG&A change vs the previous year, last year",
        ],
        rank: [
            "Top 5 retailers by revenue in 2025",
            "Securities firms by 2025 revenue, largest first",
            "Top 10 companies by cash at the end of 2025",
            "Top 5 KOSDAQ semiconductor & equipment companies by ROE last year",
            "Top 5 construction companies by operating margin in 2024",
        ],
        filter: [
            "Companies with revenue growth over 100%",
            "Top 5 KOSDAQ companies by revenue growth vs last year",
            "Top 10 cosmetics companies by R&D to revenue ratio",
            "KOSPI electronic equipment & components companies with operating margin over 18% last year",
        ],
    },
    ja: {
        company: [
            'SKハイニックスの昨年第4四半期の営業利益',
            'サムスン電子の3年間の設備投資(capex)の推移',
            'カカオの昨年の営業キャッシュフロー',
            'サムスンSDIは自己株式をどれくらい持っている？',
            'トヨタ自動車の当期純利益は？',
        ],
        compare: [
            'サムスン電子とSKハイニックスの直近3年間の売上高',
            'サムスン電子とSKハイニックスの無形資産を3年分比較して',
            'アップルの昨年の販管費の前年比増減率',
        ],
        rank: [
            '2025年の売上高が多い小売企業5社',
            '証券会社の2025年売上高を多い順に',
            '2025年末時点で現金を最も多く持つ企業トップ10',
            'KOSDAQ半導体・装置の昨年ROE上位5社',
            '建設会社の2024年営業利益率トップ5',
        ],
        filter: [
            '売上高成長率が100%を超える企業',
            'KOSDAQで前年比売上成長率が高い5社',
            '化粧品会社のうち売上高研究開発費比率が高い10社',
            'KOSPI電子装置・部品で昨年の営業利益率が18%を超える企業',
        ],
    },
};

const pick = (list) => list[Math.floor(Math.random() * list.length)];

// One question per group, in group order
export function exampleQuestions(lang) {
    return Object.values(EXAMPLES[lang] || EXAMPLES.ko).map(pick);
}
