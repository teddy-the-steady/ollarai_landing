// Example questions under the question box, one per group picked at random on each page load.
// Korean ones are worded as in ollarai_backend pipeline_test_logs/ai_beta runs where Quick passed every time
// (graded sets or judge 85+ on real questions); en/ja are translations of the same questions.
// EBITDA / FCF / segment questions (newdata sets) were rechecked on 2026-10-31: their SQL with the current
// rewrites ran under the 10s statement timeout with sensible rows. Ownership questions stay out until the
// ollarai_backend ownership_latest_year fix ("기아 최대주주랑 지분율" timed out on Quick) is deployed.
const EXAMPLES = {
    ko: {
        company: [
            'SK하이닉스 작년 4분기 영업이익 알려줘',
            '삼성전자 3년간 capex 추이',
            '카카오 작년 영업활동현금흐름 얼마임?',
            '삼성SDI가 자기주식을 얼마나 가지고 있어?',
            '삼성전자 2025년 EBITDA',
            '삼성전자 EBITDA 4년치 알려줘',
            '삼성전자 2025년 잉여현금흐름',
            '현대차 최근 3년 FCF 추이',
        ],
        compare: [
            '삼성전자랑 SK하이닉스 최근 3년간 매출액 알려줘',
            '삼성전자랑 SK하이닉스 무형자산 3년치 비교해줘',
            '삼성전자랑 SK하이닉스 2025년 EBITDA 비교',
            '애플 작년 판매비와관리비 전년 대비 증감률',
        ],
        rank: [
            '2025년 매출이 높은 유통회사 5개 알려줘',
            '국내 증권사 2025년 순이익 상위 5곳',
            '게임회사 2025년 EBITDA 높은 순으로 상위 5곳',
            '2025년 연말 기준 현금을 제일 많이 들고 있는 회사 top 10',
            '코스닥 반도체 및 장비 작년 ROE 상위 5곳',
            '화장품 회사 중에서 매출액 대비 연구개발비 비율이 높은 회사 10개',
            '코스닥에서 작년 대비 매출성장률 높은 회사 5개 알려줘',
        ],
        breakdown: [
            '삼성전자 부문별 매출',
            '현대차 2025년 사업부문별 영업이익',
            'SK텔레콤 2025년 사업부문별 영업이익',
            'LG전자 지역별 매출',
            '농심 제품별 매출 알려줘',
            '네이버 2025년 일본 매출',
        ],
    },
    en: {
        company: [
            "SK hynix operating income in Q4 last year",
            "Samsung Electronics capex over the last 3 years",
            "Kakao operating cash flow last year",
            "How much treasury stock does Samsung SDI hold?",
            "Samsung Electronics EBITDA in 2025",
            "Samsung Electronics EBITDA for the last 4 years",
            "Samsung Electronics free cash flow in 2025",
            "Hyundai Motor FCF trend over the last 3 years",
        ],
        compare: [
            "Samsung Electronics vs SK hynix revenue over the last 3 years",
            "Compare Samsung Electronics and SK hynix intangible assets over 3 years",
            "Compare 2025 EBITDA of Samsung Electronics and SK hynix",
            "Apple SG&A change vs the previous year, last year",
        ],
        rank: [
            "Top 5 retailers by revenue in 2025",
            "Top 5 Korean securities firms by net income in 2025",
            "Top 5 game companies by EBITDA in 2025",
            "Top 10 companies by cash at the end of 2025",
            "Top 5 KOSDAQ semiconductor & equipment companies by ROE last year",
            "Top 10 cosmetics companies by R&D to revenue ratio",
            "Top 5 KOSDAQ companies by revenue growth vs last year",
        ],
        breakdown: [
            "Samsung Electronics revenue by segment",
            "Hyundai Motor 2025 operating income by business segment",
            "SK Telecom 2025 operating income by business segment",
            "LG Electronics revenue by region",
            "Nongshim revenue by product",
            "NAVER revenue from Japan in 2025",
        ],
    },
    ja: {
        company: [
            'SKハイニックスの昨年第4四半期の営業利益',
            'サムスン電子の3年間の設備投資(capex)の推移',
            'カカオの昨年の営業キャッシュフロー',
            'サムスンSDIは自己株式をどれくらい持っている？',
            'サムスン電子の2025年EBITDA',
            'サムスン電子のEBITDAを4年分',
            'サムスン電子の2025年フリーキャッシュフロー',
            '現代自動車の直近3年のFCFの推移',
        ],
        compare: [
            'サムスン電子とSKハイニックスの直近3年間の売上高',
            'サムスン電子とSKハイニックスの無形資産を3年分比較して',
            'サムスン電子とSKハイニックスの2025年EBITDA比較',
            'アップルの昨年の販管費の前年比増減率',
        ],
        rank: [
            '2025年の売上高が多い小売企業5社',
            '国内証券会社の2025年純利益上位5社',
            'ゲーム会社の2025年EBITDA上位5社',
            '2025年末時点で現金を最も多く持つ企業トップ10',
            'KOSDAQ半導体・装置の昨年ROE上位5社',
            '化粧品会社のうち売上高研究開発費比率が高い10社',
            'KOSDAQで前年比売上成長率が高い5社',
        ],
        breakdown: [
            'サムスン電子の部門別売上高',
            '現代自動車の2025年事業部門別営業利益',
            'SKテレコムの2025年事業部門別営業利益',
            'LG電子の地域別売上高',
            '農心の製品別売上高',
            'NAVERの2025年日本売上高',
        ],
    },
};

const pick = (list) => list[Math.floor(Math.random() * list.length)];

// One question per group, in group order
export function exampleQuestions(lang) {
    return Object.values(EXAMPLES[lang] || EXAMPLES.ko).map(pick);
}
