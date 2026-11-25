import './style.css';
import './theme.js';

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = this.getAttribute('href');
        if (target === '#') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            document.querySelector(target).scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Dialog management
const dialog = document.getElementById('preparing-dialog');
const dialogMessage = dialog.querySelector('p');

function openDialog(message) {
    dialogMessage.innerHTML = message || i18n[currentLang]['dialog-default'];
    dialog.classList.remove('hidden');
}

function closeDialog() {
    dialog.classList.add('hidden');
}

document.getElementById('dialog-close').addEventListener('click', closeDialog);
document.getElementById('dialog-backdrop').addEventListener('click', closeDialog);

document.querySelectorAll('button.bg-primary:not(#dialog-close):not(#cta-start-btn):not(#screening-cta-btn):not(#nav-cta-btn):not(#hero-cta-btn)').forEach(btn => {
    btn.addEventListener('click', () => openDialog());
});

// Start CTAs: the app opens in the site's language (src/beta/i18n.js; /app/ redirects to /login/ when signed out)
['nav-cta-btn', 'hero-cta-btn', 'screening-cta-btn', 'cta-start-btn'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
        window.location.href = `/app/?lang=${currentLang}`;
    });
});

// Tooltip positioning
function positionAndShow(wrapper) {
    const box = wrapper.querySelector('.tooltip-box');
    const rect = wrapper.getBoundingClientRect();
    const tooltipWidth = 260;
    const vw = window.innerWidth;
    const margin = 8;
    const center = rect.left + rect.width / 2;
    const tipLeft = center - tooltipWidth / 2;
    const tipRight = center + tooltipWidth / 2;
    if (tipLeft < margin) {
        box.style.transform = `translateX(calc(-50% + ${margin - tipLeft}px))`;
    } else if (tipRight > vw - margin) {
        box.style.transform = `translateX(calc(-50% - ${tipRight - (vw - margin)}px))`;
    } else {
        box.style.transform = '';
    }
    wrapper.classList.add('active');
}

function closeAll() {
    document.querySelectorAll('.tooltip-wrapper.active').forEach(t => t.classList.remove('active'));
}

document.querySelectorAll('.tooltip-wrapper').forEach(tip => {
    tip.addEventListener('touchstart', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const wasActive = this.classList.contains('active');
        closeAll();
        if (!wasActive) positionAndShow(this);
    }, { passive: false });

    tip.addEventListener('click', function (e) {
        e.stopPropagation();
        const wasActive = this.classList.contains('active');
        closeAll();
        if (!wasActive) positionAndShow(this);
    });
});

document.addEventListener('touchstart', closeAll);
document.addEventListener('click', closeAll);

// i18n data
const i18n = {
    ko: {
        title: 'Ollarai - 재무·시세 데이터, 물어보면 바로',
        // OG / Twitter meta, kept in sync with index.html (ko) and build-locale-pages.js (en, ja)
        'og-title': 'Ollarai - 재무·시세 데이터, 물어보면 바로',
        'og-description': '재무제표, 주가, PER·ROE를 물어보면 한국·미국 상장사 9,300여 곳의 공시와 시세에서 숫자를 찾아 표로 보여 드립니다. 모든 숫자에 공시 원문 링크가 붙습니다.',
        'og-image': 'og/ollarai-og-2611-ko.png',
        'og-locale': 'ko_KR',
        'nav-data': '데이터',
        'nav-sources': '출처',
        'nav-updates': '업데이트',
        'hero-title': '숫자 찾는 시간은<br/><span class="text-primary">0분</span>으로.',
        'hero-subtitle': '재무제표, 주가, PER·ROE를 평소 말투로 물어보세요. 한국·미국 상장사 9,300여 곳의 공시와 시세에서 숫자를 찾아 표로 보여 드려요.',
        'screening-cta': '무료로 물어보기',
        'data-title': '물어볼 수 있는 데이터',
        'data-desc': 'DART·SEC EDGAR 공시와 거래소 시세를 직접 모아 만든 데이터베이스에서 답합니다. 웹 검색 결과를 요약하지 않아요.',
        'data-col-kr': '한국 (코스피·코스닥)',
        'data-col-us': '미국 (NYSE·나스닥)',
        'data-col-plan': '플랜',
        'data-free': '무료',
        'data-fin-label': '재무제표',
        'data-fin-kr': '2,698곳 · 2016년부터',
        'data-fin-us': '6,680곳 · 2016년부터',
        'data-price-label': '일별 시세 (종가·거래량)',
        'data-price-kr': '2020년부터',
        'data-price-us': '2016년부터',
        'data-ratio-label': 'PER · PBR · ROE',
        'data-ratio-kr': '공시 실적과 종가로 계산 (추정치 아님)',
        'data-ratio-us': '공시 실적과 종가로 계산 (추정치 아님)',
        'data-chart-label': '차트 패턴 · 이동평균',
        'data-chart-kr': '쌍바닥, 박스권 돌파, 골든크로스 등',
        'data-chart-us': '일봉 · 주봉 · 월봉',
        'data-asof': '기업 수는 2026년 11월 25일 기준입니다.',
        'manual-title': '영업이익 하나 확인하는 데 몇 번 클릭하나요?',
        'manual-desc': '비교할 회사가 열 곳이면 아래 과정을 열 번 반복해야 합니다.',
        'manual-old-title': 'DART에서 직접 찾을 때',
        'manual-step1': 'DART에서 회사 이름 검색',
        'manual-step2': '공시 목록에서 분기보고서 열기',
        'manual-step3': '목차에서 ‘III. 재무에 관한 사항’ 찾기',
        'manual-step4': '연결 손익계산서에서 영업이익 줄 찾기',
        'manual-step5': '단위(백만원)를 확인하고 엑셀로 옮기기',
        'manual-step6': '다른 분기, 다른 회사도 처음부터 다시',
        'manual-new-title': '<span class="ollarai-brand">Ollarai</span>에서',
        'manual-new-query': '삼성전자 최근 4개 분기 영업이익',
        'manual-new-desc': '4개 분기 숫자가 표 하나로 나오고, 행마다 그 숫자가 나온 공시 원문 링크가 붙습니다. 107,440,482백만원 같은 숫자는 107조 4,405억처럼 읽기 쉽게 바꿔 보여 드려요.',
        'feat1-title': '모든 숫자에<br/>공시 원문 링크가 붙습니다.',
        'feat1-desc': '<span class="ollarai-brand">Ollarai</span>는 DART와 SEC EDGAR에 올라온 재무제표를 직접 모아 데이터베이스로 만들고, 질문을 SQL로 바꿔 숫자를 꺼냅니다. 결과 표의 행마다 출처 공시 링크가 있어서 원문과 바로 대조할 수 있어요.',
        'feat1-tooltip': '블룸버그에 비하면 아직 버그 수준이지만, 데이터 범위는 매일 조금씩 넓어지고 있습니다.',
        'updates-title': '최근 업데이트',
        'updates-desc': '실제로 배포된 것만 적습니다.',
        'upd1-date': '11.24',
        'upd1-text': '차트 패턴 결과 옆에 미니 차트 추가. 5·20·60·120일 이동평균선도 함께 그려요.',
        'upd2-date': '11.23',
        'upd2-text': '주봉·월봉 차트 패턴 검색 (쌍바닥, 박스권 돌파 등)',
        'upd3-date': '11.23',
        'upd3-text': '한국 우선주 109개 종목 추가 (예: 삼성전자우, 현대차2우B)',
        'upd4-date': '11.20',
        'upd4-text': 'Pro 플랜 출시. 시세·차트 패턴 질문과 정밀 답변을 쓸 수 있어요.',
        'upd5-date': '11.06',
        'upd5-text': '결과 표의 행마다 출처 공시 링크 (DART · SEC EDGAR)',
        'updates-next': '다음 작업: 일본 EDINET 공시 추가',
        'cta-title': '궁금했던 숫자 하나,<br/>지금 물어보세요.',
        'cta-desc': '가입하면 바로 질문할 수 있어요.',
        'cta-note': '결제 정보 없이 가입 · 하루 100회까지 무료',
        'cta': '무료로 시작하기',
        'hero-cta': '무료로 시작하기',
        'screening-preview-tag': '실제 답변',
        'screening-query-caption': '2026년 11월 25일 <span class="ollarai-brand">Ollarai</span>에 실제로 물어본 결과입니다. 시세와 시세 기반 지표는 11월 23일 종가 기준입니다.',
        'feat1-sql-label': '생성된 SQL',
        'dialog-default': '<span class="ollarai-brand">Ollarai</span>는 현재 열심히 준비중입니다.<br/>조금만 기다려주세요!',
        'dialog-close': '확인',
        'pricing-href': '/pricing/',
        'terms-href': '/terms/',
        'refund-href': '/terms/#refund',
        'privacy-href': '/privacy/',
        'footer-pricing': '요금 안내',
        'footer-terms': '이용약관',
        'footer-refund': '환불 정책',
        'footer-privacy': '개인정보처리방침',
        'footer-disclaimer': '<span class="ollarai-brand">Ollarai</span>는 공개된 공시·재무 데이터를 조회하고 정리해 보여주는 정보 도구이며, 투자 권유나 투자 자문을 제공하지 않습니다. 투자 판단과 그 결과에 대한 책임은 이용자 본인에게 있습니다.',
        'footer-company': '상호: Nexora · 대표자: 전태호 · 사업자등록번호: 226-23-07642 <a href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=2262307642" target="_blank" rel="noopener" class="underline underline-offset-2 hover:text-primary transition">사업자정보 확인</a><br>통신판매업 신고번호: 2026-강원강릉-0425 · 주소: 강원특별자치도 강릉시 관대길 26, 203호<br>전화: <a href="tel:+821079023085" class="underline underline-offset-2 hover:text-primary transition">010-7902-3085</a> · 이메일: <a href="mailto:contact@ollarai.com" class="underline underline-offset-2 hover:text-primary transition">contact@ollarai.com</a>',
        'footer-copyright': `&copy; ${new Date().getFullYear()} Ollarai (올라라이). All rights reserved.`,
    },
    en: {
        title: 'Ollarai - Financials & Market Data, Just Ask',
        'og-title': 'Ollarai - Financials & Market Data, Just Ask',
        'og-description': 'Ask about financial statements, stock prices, or P/E and ROE. Ollarai finds the figures in filings and market data for 9,300+ Korean and US-listed companies, and every number links to its source filing.',
        'og-image': 'og/ollarai-og-2611-en.png',
        'og-locale': 'en_US',
        'nav-data': 'Data',
        'nav-sources': 'Sources',
        'nav-updates': 'Updates',
        'hero-title': 'Spend <span class="text-primary">zero minutes</span><br/>hunting for numbers.',
        'hero-subtitle': 'Ask about financial statements, stock prices, or P/E and ROE in plain words. Ollarai finds the figures in filings and market data for 9,300+ Korean and US-listed companies and puts them in a table.',
        'screening-cta': 'Ask for Free',
        'data-title': 'What you can ask about',
        'data-desc': 'Answers come from a database we build ourselves from DART and SEC EDGAR filings and exchange price data, not from summarized web search results.',
        'data-col-kr': 'Korea (KOSPI · KOSDAQ)',
        'data-col-us': 'US (NYSE · Nasdaq)',
        'data-col-plan': 'Plan',
        'data-free': 'Free',
        'data-fin-label': 'Financial statements',
        'data-fin-kr': '2,698 companies · from 2016',
        'data-fin-us': '6,680 companies · from 2016',
        'data-price-label': 'Daily prices (close · volume)',
        'data-price-kr': 'From 2020',
        'data-price-us': 'From 2016',
        'data-ratio-label': 'P/E · P/B · ROE',
        'data-ratio-kr': 'From reported results and closing prices (not estimates)',
        'data-ratio-us': 'From reported results and closing prices (not estimates)',
        'data-chart-label': 'Chart patterns · moving averages',
        'data-chart-kr': 'Double bottoms, box breakouts, golden crosses and more',
        'data-chart-us': 'Daily · weekly · monthly',
        'data-asof': 'Company counts as of Nov 25, 2026.',
        'manual-title': 'How many clicks does one operating income figure take?',
        'manual-desc': 'Comparing ten companies means doing this ten times.',
        'manual-old-title': 'By hand on SEC EDGAR',
        'manual-step1': 'Search for the company on EDGAR',
        'manual-step2': 'Filter the filings to 10-Q and open the right one',
        'manual-step3': 'Scroll to the Condensed Consolidated Statements of Operations',
        'manual-step4': 'Find the operating income line',
        'manual-step5': 'Check the units (in millions) and copy it into a spreadsheet',
        'manual-step6': 'Start over for the next quarter and the next company',
        'manual-new-title': 'On <span class="ollarai-brand">Ollarai</span>',
        'manual-new-query': 'Apple revenue and operating income for the quarter ended June 2026',
        'manual-new-desc': 'The figures come back in one table, and each row links to the filing it came from. $35,695 million shows up as $35.7B.',
        'feat1-title': 'Every number links<br/>to its source filing.',
        'feat1-desc': '<span class="ollarai-brand">Ollarai</span> collects the financial statements filed on DART and SEC EDGAR into its own database, turns your question into SQL, and pulls the numbers out. Each row in the result links to the filing it came from, so you can check it against the original.',
        'feat1-tooltip': 'Compared to Bloomberg we\'re still a tiny bug, but our data coverage grows a little every day.',
        'updates-title': 'Recent updates',
        'updates-desc': 'Only things that have actually shipped.',
        'upd1-date': 'Nov 24',
        'upd1-text': 'Mini charts next to chart pattern results, with 5/20/60/120-day moving averages',
        'upd2-date': 'Nov 23',
        'upd2-text': 'Chart pattern search on weekly and monthly charts (double bottoms, box breakouts and more)',
        'upd3-date': 'Nov 23',
        'upd3-text': 'Added 109 Korean preferred shares',
        'upd4-date': 'Nov 20',
        'upd4-text': 'Pro plan launched: price and chart pattern questions, Precise answers',
        'upd5-date': 'Nov 6',
        'upd5-text': 'Source filing links on every result row (DART · SEC EDGAR)',
        'updates-next': 'Next up: Japanese filings from EDINET',
        'cta-title': 'Got a number you\'ve been<br/>meaning to look up?',
        'cta-desc': 'Sign up and ask it right away.',
        'cta-note': 'No payment details needed · Up to 100 free questions a day',
        'cta': 'Start for Free',
        'hero-cta': 'Start for Free',
        'screening-preview-tag': 'Real answers',
        'screening-query-caption': 'Asked on <span class="ollarai-brand">Ollarai</span> on Nov 25, 2026. Prices and price-based metrics as of the Nov 23 close.',
        'feat1-sql-label': 'Generated SQL',
        'dialog-default': '<span class="ollarai-brand">Ollarai</span> is currently hard at work.<br/>Please wait a little longer!',
        'dialog-close': 'OK',
        'pricing-href': '/en/pricing/',
        'terms-href': '/en/terms/',
        'refund-href': '/en/terms/#refund',
        'privacy-href': '/en/privacy/',
        'footer-pricing': 'Pricing',
        'footer-terms': 'Terms of Service',
        'footer-refund': 'Refund Policy',
        'footer-privacy': 'Privacy Policy',
        'footer-disclaimer': '<span class="ollarai-brand">OllarAI</span> is a financial data search tool providing structured public filing information for research and informational purposes only. <span class="ollarai-brand">OllarAI</span> does not provide investment advice, trading signals, or broker-dealer services. All investment decisions are solely your responsibility.',
        'footer-company': 'Trade name: Nexora · Representative: Taeho Jeon · Business registration number: 226-23-07642 <a href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=2262307642" target="_blank" rel="noopener" class="underline underline-offset-2 hover:text-primary transition">Verify (KFTC)</a><br>Mail-order business registration number: 2026-강원강릉-0425 · Address: 26 Gwandae-gil, Room 203, Gangneung-si, Gangwon State, Republic of Korea<br>Phone: <a href="tel:+821079023085" class="underline underline-offset-2 hover:text-primary transition">+82-10-7902-3085</a> · Email: <a href="mailto:contact@ollarai.com" class="underline underline-offset-2 hover:text-primary transition">contact@ollarai.com</a>',
        'footer-copyright': `&copy; ${new Date().getFullYear()} Ollarai. All rights reserved.`,
    },
    ja: {
        title: 'Ollarai - 財務・株価データ、聞けばすぐ',
        'og-title': 'Ollarai - 財務・株価データ、聞けばすぐ',
        'og-description': '財務諸表、株価、PER・ROEを聞けば、韓国・米国の上場企業9,300社以上の開示と株価データから数字を探して表で表示します。すべての数字に開示原文へのリンク付き。',
        'og-image': 'og/ollarai-og-2611-ja.png',
        'og-locale': 'ja_JP',
        'nav-data': 'データ',
        'nav-sources': '出典',
        'nav-updates': 'アップデート',
        'hero-title': '数字を探す時間は<br/><span class="text-primary">0分</span>に。',
        'hero-subtitle': '財務諸表、株価、PER・ROEを普段の言葉で聞いてください。韓国・米国の上場企業9,300社以上の開示と株価データから数字を探し、表にしてお見せします。',
        'screening-cta': '無料で聞いてみる',
        'data-title': '質問できるデータ',
        'data-desc': 'DART・SEC EDGARの開示と取引所の株価を自ら集めて作ったデータベースから答えます。ウェブ検索結果の要約ではありません。',
        'data-col-kr': '韓国 (KOSPI・KOSDAQ)',
        'data-col-us': '米国 (NYSE・ナスダック)',
        'data-col-plan': 'プラン',
        'data-free': '無料',
        'data-fin-label': '財務諸表',
        'data-fin-kr': '2,698社 · 2016年から',
        'data-fin-us': '6,680社 · 2016年から',
        'data-price-label': '日次株価 (終値・出来高)',
        'data-price-kr': '2020年から',
        'data-price-us': '2016年から',
        'data-ratio-label': 'PER · PBR · ROE',
        'data-ratio-kr': '開示実績と終値から計算 (予想値ではない)',
        'data-ratio-us': '開示実績と終値から計算 (予想値ではない)',
        'data-chart-label': 'チャートパターン · 移動平均',
        'data-chart-kr': 'ダブルボトム、ボックス上抜け、ゴールデンクロスなど',
        'data-chart-us': '日足 · 週足 · 月足',
        'data-asof': '企業数は2026年11月25日時点です。',
        'manual-title': '営業利益ひとつ確認するのに、何回クリックしますか?',
        'manual-desc': '比較する企業が10社なら、この作業を10回繰り返すことになります。',
        'manual-old-title': 'DARTで自分で探す場合',
        'manual-step1': 'DARTで企業名を検索',
        'manual-step2': '開示一覧から四半期報告書を開く',
        'manual-step3': '目次から「III. 財務に関する事項」を探す',
        'manual-step4': '連結損益計算書で営業利益の行を探す',
        'manual-step5': '単位(百万ウォン)を確認してExcelに写す',
        'manual-step6': '別の四半期、別の企業もまた最初から',
        'manual-new-title': '<span class="ollarai-brand">Ollarai</span>なら',
        'manual-new-query': 'サムスン電子の2026年第3四半期の売上高と営業利益',
        'manual-new-desc': '数字が一つの表で返ってきて、各行にその数字の出典となる開示原文へのリンクが付きます。107,440,482百万ウォンは107兆4,405億ウォンのように読みやすく表示します。',
        'feat1-title': 'すべての数字に<br/>開示原文へのリンク。',
        'feat1-desc': '<span class="ollarai-brand">Ollarai</span>はDARTとSEC EDGARに提出された財務諸表を自ら集めてデータベースにし、質問をSQLに変換して数字を取り出します。結果表の各行に出典開示へのリンクがあるので、原文とすぐに照合できます。',
        'feat1-tooltip': 'Bloombergに比べればまだ小さな存在ですが、データの範囲は毎日少しずつ広がっています。',
        'updates-title': '最近のアップデート',
        'updates-desc': '実際にリリースしたものだけを書いています。',
        'upd1-date': '11/24',
        'upd1-text': 'チャートパターンの結果にミニチャートを追加。5・20・60・120日移動平均線も表示',
        'upd2-date': '11/23',
        'upd2-text': '週足・月足のチャートパターン検索 (ダブルボトム、ボックス上抜けなど)',
        'upd3-date': '11/23',
        'upd3-text': '韓国の優先株109銘柄を追加',
        'upd4-date': '11/20',
        'upd4-text': 'Proプラン開始。株価・チャートパターンの質問と精密回答が使えます',
        'upd5-date': '11/6',
        'upd5-text': '結果表の各行に出典開示へのリンク (DART · SEC EDGAR)',
        'updates-next': '次の作業: 日本のEDINET開示を追加',
        'cta-title': '気になっていた数字、<br/>今聞いてみてください。',
        'cta-desc': '登録すればすぐに質問できます。',
        'cta-note': 'お支払い情報は不要 · 1日100回まで無料',
        'cta': '無料で始める',
        'hero-cta': '無料で始める',
        'screening-preview-tag': '実際の回答',
        'screening-query-caption': '2026年11月25日に<span class="ollarai-brand">Ollarai</span>へ実際に質問した結果です。株価と株価ベースの指標は11月23日終値時点です。',
        'feat1-sql-label': '生成されたSQL',
        'dialog-default': '<span class="ollarai-brand">Ollarai</span>は現在準備中です。<br/>もう少しお待ちください!',
        'dialog-close': '確認',
        'pricing-href': '/ja/pricing/',
        'terms-href': '/ja/terms/',
        'refund-href': '/ja/terms/#refund',
        'privacy-href': '/ja/privacy/',
        'footer-pricing': '料金案内',
        'footer-terms': '利用規約',
        'footer-refund': '返金ポリシー',
        'footer-privacy': 'プライバシーポリシー',
        'footer-disclaimer': '<span class="ollarai-brand">Ollarai</span>は、公開された開示・財務データを照会・整理して表示する情報ツールであり、投資の勧誘や投資助言は行いません。投資の判断とその結果に対する責任は、利用者ご本人にあります。',
        'footer-company': '商号：Nexora · 代表者：Taeho Jeon · 事業者登録番号：226-23-07642 <a href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=2262307642" target="_blank" rel="noopener" class="underline underline-offset-2 hover:text-primary transition">事業者情報の確認</a><br>通信販売業申告番号：2026-강원강릉-0425 · 所在地：大韓民国 江原特別自治道 江陵市 冠大キル26、203号<br>電話：<a href="tel:+821079023085" class="underline underline-offset-2 hover:text-primary transition">+82-10-7902-3085</a> · メール：<a href="mailto:contact@ollarai.com" class="underline underline-offset-2 hover:text-primary transition">contact@ollarai.com</a>',
        'footer-copyright': `&copy; ${new Date().getFullYear()} Ollarai. All rights reserved.`,
    }
};

function getLangFromURL() {
    const path = window.location.pathname;
    if (path === '/en' || path.startsWith('/en/')) return 'en';
    if (path === '/ko' || path.startsWith('/ko/')) return 'ko';
    if (path === '/ja' || path.startsWith('/ja/')) return 'ja';
    return null;
}

// Shared with the beta pages (src/beta/i18n.js); only set when the user picks a language.
const LANG_KEY = 'ollarai-lang';
const LANGS = ['ko', 'en', 'ja'];

// At the root (no /en, /ja, /ko in the path): the remembered choice, else the browser language.
// Crawlers stay on Korean so the root page keeps being indexed as Korean.
function detectLang() {
    try {
        const stored = localStorage.getItem(LANG_KEY);
        if (LANGS.includes(stored)) return stored;
    } catch (e) {}
    if (/bot|crawl|spider|slurp|facebookexternalhit/i.test(navigator.userAgent)) return 'ko';
    const browser = (navigator.language || '').slice(0, 2).toLowerCase();
    return LANGS.includes(browser) ? browser : 'ko';
}

let currentLang = getLangFromURL() || detectLang();

window.toggleLangMenu = function() {
    document.getElementById('lang-menu').classList.toggle('hidden');
}

// "From the filing" graphic: the SQL Ollarai wrote on 2026-11-25 for "삼성전자 2025년 3분기 매출과 영업이익" /
// "Apple revenue and operating income for the quarter ended June 2026" (period filter shortened), and its answer
const simData = {
    ko: {
        system: 'dart',
        source: '출처: DART 분기보고서',
        query: `SELECT i.revenue, i.operating_profit_ebit FROM "IncomeStatement" AS i JOIN "FinancialStatements" AS f ON i.financial_statement_id = f.financial_statement_id WHERE f.company_id = 2141 AND f.period_end_date = '2026-09-30' AND f.is_consolidated`,
        result: '107조 4,405억 원 <span class="text-sm font-normal text-slate-500">영업이익 · 2026년 3분기</span>'
    },
    en: {
        system: 'edgar',
        source: 'Source: SEC EDGAR 10-Q',
        query: `SELECT i.revenue, i.operating_profit_ebit FROM "IncomeStatement" AS i JOIN "FinancialStatements" AS f ON i.financial_statement_id = f.financial_statement_id WHERE f.company_id = 2692 AND f.period_end_date = '2026-06-27' AND f.is_consolidated`,
        result: '$35.7B <span class="text-sm font-normal text-slate-500">operating income · quarter ended Jun 2026</span>'
    },
    ja: {
        system: 'dart',
        source: '出典: DART 四半期報告書',
        query: `SELECT i.revenue, i.operating_profit_ebit FROM "IncomeStatement" AS i JOIN "FinancialStatements" AS f ON i.financial_statement_id = f.financial_statement_id WHERE f.company_id = 2141 AND f.period_end_date = '2026-09-30' AND f.is_consolidated`,
        result: '107兆4,405億ウォン <span class="text-sm font-normal text-slate-500">営業利益 · 2026年第3四半期</span>'
    }
};

// Language menu: remember the choice, then apply it
window.setLang = function(lang) {
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    applyLang(lang);
}

function applyLang(lang) {
    currentLang = lang;
    try { history.replaceState(null, '', '/' + lang); } catch (e) {}
    document.documentElement.lang = lang;
    document.title = i18n[lang].title;

    // Sync OG / Twitter meta tags
    (function () {
        const img = window.location.origin + '/' + i18n[lang]['og-image'];
        const set = (sel, val) => { const el = document.querySelector(sel); if (el) el.content = val; };
        set('meta[property="og:title"]',        i18n[lang]['og-title']);
        set('meta[property="og:description"]',  i18n[lang]['og-description']);
        set('meta[property="og:image"]',        img);
        set('meta[property="og:locale"]',       i18n[lang]['og-locale']);
        set('meta[name="twitter:title"]',       i18n[lang]['og-title']);
        set('meta[name="twitter:description"]', i18n[lang]['og-description']);
        set('meta[name="twitter:image"]',       img);
    })();

    document.getElementById('lang-label').textContent = lang.toUpperCase();
    document.getElementById('lang-menu').classList.add('hidden');

    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.innerHTML = i18n[lang][el.dataset.i18n] ?? el.innerHTML;
    });

    document.querySelectorAll('[data-i18n-href]').forEach(el => {
        el.href = i18n[lang][el.dataset.i18nHref] ?? el.href;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = i18n[lang][el.dataset.i18nPlaceholder] ?? el.placeholder;
    });

    const sd = simData[lang];
    document.getElementById('sim-dart').classList.toggle('hidden', sd.system !== 'dart');
    document.getElementById('sim-edgar').classList.toggle('hidden', sd.system !== 'edgar');
    document.getElementById('sim-sql-query').textContent = sd.query;
    document.getElementById('sim-sql-result').innerHTML = sd.result;
    document.getElementById('sim-source').textContent = sd.source;
}

document.addEventListener('click', function(e) {
    const btn = document.getElementById('lang-btn');
    const menu = document.getElementById('lang-menu');
    if (!btn.contains(e.target)) menu.classList.add('hidden');
});

window.addEventListener('popstate', function() {
    applyLang(getLangFromURL() || detectLang());
});

// Initialize language immediately to prevent flash of wrong language
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        applyLang(currentLang);
    });
} else {
    applyLang(currentLang);
}

// Screening demo: types a question, then reveals the answer row by row. Every row is what Ollarai answered
// when the question was asked live on 2026-11-25 (test account, paid tier; prices as of the 2026-11-23 close),
// rounded for display - re-ask and replace them together when they go stale. Columns follow each question on
// purpose: the product isn't a fixed-column screener, it pulls whatever the question asks for.
// A row's first cell is [name, ticker] or a plain label; note is the line under the table.
(function () {
    const demoEl = document.getElementById('screener-demo');
    const queryEl = document.getElementById('screener-query-text');
    const thead = document.getElementById('screener-result-head');
    const tbody = document.getElementById('screener-result-body');
    const noteEl = document.getElementById('screener-result-note');
    const stepEl = document.getElementById('screener-step');
    if (!demoEl || !queryEl || !thead || !tbody) return;

    const demosByLang = {
        ko: [
            { query: 'PBR 1배 미만에 ROE 10% 넘는 코스피 기업 시총 순으로 5개', columns: ['기업', 'PBR', 'ROE', '시가총액'], highlight: [1, 2], rows: [
                [['기아', '000270'], '0.61', '12.4%', '37조'],
                [['한국전력', '015760'], '0.34', '17.7%', '16조'],
                [['DB손해보험', '005830'], '0.99', '16.4%', '11조'],
                [['미래에셋증권', '006800'], '0.79', '11.8%', '10조'],
                [['NH투자증권', '005940'], '0.89', '10.9%', '8.4조'],
            ], note: '5개 기업 · 시가총액 순' },
            { query: '삼성전자 최근 4개 분기 매출과 영업이익', columns: ['분기', '매출', '영업이익'], highlight: [2], rows: [
                ['2025년 4분기', '93.8조', '20.1조'],
                ['2026년 1분기', '133.9조', '57.2조'],
                ['2026년 2분기', '171.5조', '89.5조'],
                ['2026년 3분기', '195.3조', '107.4조'],
            ], note: 'DART 분기·사업보고서 · 연결 기준' },
            { query: '최근 6개월 동안 주가가 2배 이상 오른 나스닥 종목', columns: ['기업', '종가', '6개월 수익률'], highlight: [2], rows: [
                [['RF Acquisition II', 'RFAI'], '$34', '+211.2%'],
                [['Alpha Teknova', 'TKNO'], '$8', '+105.9%'],
                [['Sight Sciences', 'SGHT'], '$11', '+116.1%'],
                [['Entera Bio', 'ENTX'], '$3.5', '+178.2%'],
            ], note: '67개 기업 중 4개' },
        ],
        en: [
            { query: 'US companies with P/B under 3 and ROE above 20%: top 5 by 6-month return', columns: ['Company', 'P/B', 'ROE', '6M return'], highlight: [3], rows: [
                ['SBC Medical Group', '2.5', '20.5%', '+96.1%'],
                ['American Integrity Insurance', '1.5', '29.6%', '+75.3%'],
                ['J.Jill', '2.6', '23.0%', '+67.2%'],
                ['Q32 Bio', '2.5', '71.0%', '+49.8%'],
                ['Rigel Pharmaceuticals', '1.9', '93.8%', '+44.7%'],
            ], note: '5 companies' },
            { query: "Apple's market cap is how many times its 2025 net income?", columns: ['Company', 'Fiscal year', 'Market cap / net income'], highlight: [2], rows: [
                ['Apple', 'FY2025', '43x'],
            ], note: 'Latest market cap · FY2025 annual report' },
            { query: 'Samsung Electronics revenue and operating income for Q3 2026', columns: ['Quarter', 'Revenue', 'Operating income'], highlight: [2], rows: [
                ['Q3 2026', '₩195.3T', '₩107.4T'],
            ], note: 'DART quarterly report · consolidated' },
            { query: 'Top 5 Nasdaq stocks by 3-month return', columns: ['Company', '3M return'], highlight: [1], rows: [
                ['Netcapital', '+917.6%'],
                ['SunPower', '+860.3%'],
                ['RedCloud Holdings', '+751.3%'],
                ['Lisata Therapeutics', '+713.5%'],
                ['TJGC Group', '+584.3%'],
            ], note: '5 companies' },
        ],
        ja: [
            { query: 'PBR1倍割れでROE10%以上の韓国企業、時価総額上位5社', columns: ['企業', 'PBR', 'ROE', '時価総額'], highlight: [1, 2], rows: [
                [['起亜', '000270'], '0.61', '12.4%', '37兆ウォン'],
                [['韓国電力', '015760'], '0.34', '17.7%', '16兆ウォン'],
                [['DB損害保険', '005830'], '0.99', '16.4%', '11兆ウォン'],
                [['未来アセット証券', '006800'], '0.79', '11.8%', '10兆ウォン'],
                [['NH投資証券', '005940'], '0.89', '10.9%', '8.4兆ウォン'],
            ], note: '5社 · 時価総額順' },
            { query: '2025年の営業利益率が30%以上の米国企業、時価総額上位5社', columns: ['企業', '営業利益率 (2025年)'], highlight: [1], rows: [
                ['Apple', '32.0%'],
                ['NVIDIA', '60.4%'],
                ['Microsoft', '45.6%'],
                ['Meta Platforms', '41.4%'],
                ['Broadcom', '39.9%'],
            ], note: '5社 · 時価総額順' },
            { query: 'メタのPER、PBR、ROEを教えて', columns: ['企業', 'PER', 'PBR', 'ROE'], highlight: [1, 2, 3], rows: [
                ['Meta Platforms', '25', '6.9', '27.8%'],
            ], note: '直近の決算・株価ベース' },
        ],
    };

    const esc = (v) => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    let demoIndex = 0;
    let running = false;
    let pendingTimeout = null;

    function sleep(ms) {
        return new Promise(resolve => { pendingTimeout = setTimeout(resolve, ms); });
    }

    function renderHeader(columns) {
        const tr = document.createElement('tr');
        tr.className = 'screener-row border-b border-white/10 text-slate-500';
        tr.innerHTML = columns.map((label, i) =>
            '<th class="' + (i === 0 ? 'text-left' : 'text-right pl-3') + ' py-2 font-normal">' + esc(label) + '</th>'
        ).join('');
        thead.appendChild(tr);
        requestAnimationFrame(() => requestAnimationFrame(() => tr.classList.add('visible')));
    }

    function renderRow(cells, highlight) {
        const tr = document.createElement('tr');
        tr.className = 'screener-row border-b border-white/5';
        tr.innerHTML = cells.map((val, i) => {
            if (i === 0) {
                const [name, ticker] = Array.isArray(val) ? val : [val];
                return '<td class="py-2 text-slate-200">' + esc(name)
                    + (ticker ? ' <span class="text-slate-500 text-[10px] ml-1">' + esc(ticker) + '</span>' : '') + '</td>';
            }
            const isHighlighted = (highlight || []).includes(i);
            return '<td class="text-right pl-3' + (isHighlighted ? ' text-white font-semibold' : '') + '">' + esc(val) + '</td>';
        }).join('');
        tbody.appendChild(tr);
        requestAnimationFrame(() => requestAnimationFrame(() => tr.classList.add('visible')));
    }

    async function typeText(text) {
        queryEl.textContent = '';
        for (let i = 0; i < text.length; i++) {
            queryEl.textContent += text[i];
            await sleep(35);
        }
    }

    async function eraseText() {
        while (queryEl.textContent.length > 0) {
            queryEl.textContent = queryEl.textContent.slice(0, -1);
            await sleep(15);
        }
    }

    async function runLoop() {
        if (running) return;
        running = true;
        while (running) {
            const demos = demosByLang[currentLang] || demosByLang.ko;
            const demo = demos[demoIndex % demos.length];
            thead.innerHTML = '';
            tbody.innerHTML = '';
            if (noteEl) { noteEl.textContent = ''; noteEl.classList.remove('visible'); }
            if (stepEl) stepEl.textContent = (demoIndex % demos.length + 1) + ' / ' + demos.length;
            await typeText(demo.query);
            if (!running) break;
            await sleep(400);
            renderHeader(demo.columns);
            await sleep(200);
            for (const row of demo.rows) {
                if (!running) break;
                renderRow(row, demo.highlight);
                await sleep(220);
            }
            if (noteEl && running) { noteEl.textContent = demo.note || ''; noteEl.classList.add('visible'); }
            await sleep(3200);
            await eraseText();
            await sleep(300);
            demoIndex++;
        }
    }

    function stopLoop() {
        running = false;
        if (pendingTimeout) clearTimeout(pendingTimeout);
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                runLoop();
            } else {
                stopLoop();
            }
        });
    }, { threshold: 0.3 });

    observer.observe(demoEl);
})();
