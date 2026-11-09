import './style.css';

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
        title: 'Ollarai - 공시 재무 데이터, 물어보면 바로',
        // OG / Twitter meta, kept in sync with index.html (ko) and build-locale-pages.js (en, ja)
        'og-title': 'Ollarai - 공시 재무 데이터, 물어보면 바로',
        'og-description': '공시 뒤지는 시간은 0분으로. 궁금한 재무 숫자를 물어보면 공시 원문에서 그대로 꺼내 드리는 AI 공시 데이터 검색.',
        'og-image': 'og/ollarai-og-image-ko.png',
        'og-locale': 'ko_KR',
        'nav-roadmap': '로드맵',
        'nav-screening': 'AI 스크리닝',
        'nav-features': '주요 기능',
        'cta': '무료로 시작하기',
        'hero-kicker': '공시 재무 데이터 AI 검색',
        'hero-title': '공시 뒤지는 시간은<br/><span class="gradient-text">0분</span>으로.',
        'hero-subtitle': '궁금한 재무 숫자를 물어보세요.<br/><span class="ollarai-brand">Ollarai</span>가 공시 원문에서<br/><span class="text-primary font-semibold">정확한 숫자를 찾아</span> 한눈에 보기 쉽게 정리해 드립니다.',
        'hero-cta': '무료로 시작하기',
        'problem-title': '데이터가 없는 분석은 가설일 뿐입니다.',
        'problem-desc': '시장의 소음 속에서 개인 투자자가 믿을 만한 숫자를 직접 확인하기는 여전히 어렵습니다.<br/>전문가들의 모델은 강력하지만, 그 모델을 지탱하는 \'정밀한 데이터\'는 너무나 비싸고 어렵습니다.',
        'problem-card1-title': '숫자 하나의 수고',
        'problem-card1-desc': '수백 페이지 보고서에서 표를 찾고, 엑셀에 옮기고, 단위를 맞추는 일. 숫자 하나 확인하는 데 너무 많은 시간이 듭니다.',
        'problem-card2-title': '정보의 장벽',
        'problem-card2-desc': '수천만 원짜리 터미널 없이는 접근조차 불가능했던 정교한 공시 데이터 분석, 이제는 달라져야 합니다.',
        'problem-card3-title': '파편화된 시장',
        'problem-card3-desc': '나라마다 다른 공시 체계와 언어. 한국 공시부터 시작해 미국으로 범위를 넓히며, 데이터를 모으는 데만 하루를 다 쓰는 비효율을 끝냅니다.',
        'screening-title': '재무 조건으로 기업을 걸러보는 AI 스크리닝',
        'screening-desc': '내가 정한 재무 조건에 맞는 기업을 공시 숫자로 걸러보는 스크리닝을 준비하고 있습니다. 지금은 공시 재무제표의 숫자를 인출하고, 다음으로 종가와 거래량 데이터를 더한 뒤, 이를 바탕으로 PER, PBR 같은 주가 기반 지표 스크리닝을 <span class="ollarai-brand">Ollarai</span>에서 선보일 예정입니다.',
        'screening-point1': '<b>지금 이용 가능</b> · 공시 재무제표 숫자 인출 (매출, 영업이익, 부채, ROE 등)',
        'screening-point2': '<b>다음 단계</b> · 종가, 거래량 데이터 추가',
        'screening-point3': '<b>그다음</b> · PER, PBR 등 주가 기반 지표로 필터링',
        'screening-ribbon': '공사중',
        'screening-badge': '스크리닝 화면 준비 중입니다',
        'screening-badge-desc': '정확한 데이터 위에 세워질 다음 기능을 곧 만나보세요.',
        'screening-launch-badge': '출시 예정',
        'screening-cta': '지금 무료로 써보기',
        'screening-preview-tag': '미리보기',
        'screening-query-caption': '예시 화면입니다 · 표의 수치는 실제 데이터가 아닙니다',
        'vision-title': '<span class="ollarai-brand">Ollarai</span>의 진화',
        'vision-desc': '판단은 당신의 몫입니다. 우리는 그 판단에 필요한 숫자를 가장 빠르고 정확하게 찾아 드립니다.',
        'vision1-title': '무결점 데이터 토대',
        'vision1-desc': '가장 정직한 숫자를 가장 저렴하게. 공시 원천 데이터를 직접 수집·정리해, 숫자 하나하나의 출처가 분명한 데이터 토대를 쌓습니다.',
        'vision2-title': '시세 데이터와 조건 검색',
        'vision2-desc': '공시 재무 숫자에 종가·거래량 데이터를 더하고, PER·PBR처럼 공개 데이터로 계산되는 지표를 원하는 조건으로 걸러볼 수 있게 합니다.',
        'vision3-title': '한·미·일 공시 통합',
        'vision3-desc': '한국 DART에서 시작해 미국 EDGAR, 일본 EDINET까지. 나라마다 다른 공시를 하나의 질문으로 찾아볼 수 있게 데이터 범위를 넓혀 갑니다.',
        'features-title': '왜 <span class="ollarai-brand">Ollarai</span>여야만 하는가',
        'features-desc': '웹에 떠도는 요약이 아니라, 공시 원문에 있는 숫자 그대로를 드립니다.',
        'feat1-title': '숫자의 근원,<br/>기업 공시에서 직접 인출합니다.',
        'feat1-desc': '애널리스트들이 수작업으로 엑셀에 옮겨 적던 공시 자료의 표들을 AI가 직접 읽습니다. 우리는 웹상의 떠도는 정보를 요약하지 않습니다. <span class="text-primary font-bold">전자공시시스템(DART)</span>과 같은 원천 데이터를 데이터베이스에 수집/가공하여 공시 원문과 일치하는 정확한 수치를 제공합니다.',
        'feat1-tooltip': '블룸버그에 비하면 아직은 버그에 불과하지만 <span class="ollarai-brand">Ollarai</span>의 데이터 커버리지는 매일 조금씩 넓어지고 있습니다.',
        'cta-title': '좋은 판단은<br/>정확한 숫자에서 시작됩니다.',
        'cta-desc': '지금 가입하고 공시 데이터에 바로 질문해 보세요.',
        'cta-note': '결제 정보 없이 가입만 하면 돼요 · 하루 100회까지 무료',
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
        title: 'Ollarai - Financial Filing Data, Just Ask',
        'og-title': 'Ollarai - Financial Filing Data, Just Ask',
        'og-description': 'Spend zero minutes digging through filings. Ask for any financial figure and get it straight from the original filings. AI search for filing data.',
        'og-image': 'og/ollarai-og-image.png',
        'og-locale': 'en_US',
        'nav-roadmap': 'Roadmap',
        'nav-screening': 'AI Screening',
        'nav-features': 'Features',
        'cta': 'Start for Free',
        'hero-kicker': '',
        'hero-title': 'Spend <span class="gradient-text">zero minutes</span><br/>digging through filings.',
        'hero-subtitle': 'Just ask for the financial figures you need.<br/><span class="ollarai-brand">Ollarai</span> finds the <span class="text-primary font-semibold">exact figures</span> in the original filings<br/>and lays them out in an easy-to-read format.',
        'hero-cta': 'Start for Free',
        'problem-title': 'Analysis without data is just a hypothesis.',
        'problem-desc': 'Amid the market noise, checking reliable numbers for yourself is still hard for individual investors.<br/>Expert models are powerful, but the "precise data" underpinning them is prohibitively expensive and inaccessible.',
        'problem-card1-title': 'The Cost of One Number',
        'problem-card1-desc': 'Finding a table in a report hundreds of pages long, copying it into a spreadsheet, matching the units. Checking a single number takes far too long.',
        'problem-card2-title': 'Information Barrier',
        'problem-card2-desc': 'Sophisticated public filings analysis once required terminals costing tens of millions of won. That needs to change.',
        'problem-card3-title': 'Fragmented Markets',
        'problem-card3-desc': 'Every country has its own filing system and language. Starting with Korean filings and expanding to the US, we end the inefficiency of spending a whole day just gathering data.',
        'screening-title': 'AI Screening by Financial Criteria',
        'screening-desc': 'We\'re building screening that filters companies by the financial criteria you set, using figures from filings. Today, <span class="ollarai-brand">Ollarai</span> extracts the figures in companies\' financial statements. Next we\'ll add closing prices and trading volume, and on top of that, screening by price-based metrics like PER and PBR.',
        'screening-point1': '<b>Available now</b> · Financial statement figures from filings (revenue, operating income, liabilities, ROE, and more)',
        'screening-point2': '<b>Next</b> · Closing price and trading volume data',
        'screening-point3': '<b>After that</b> · Filtering by price-based metrics like PER and PBR',
        'screening-ribbon': 'Under Construction',
        'screening-badge': 'Screening Dashboard Coming Soon',
        'screening-badge-desc': 'The next feature, built on accurate data, is on its way.',
        'screening-launch-badge': 'Coming Soon',
        'screening-cta': 'Try It Free Now',
        'screening-preview-tag': 'Preview',
        'screening-query-caption': 'Example screen · the figures are not real data',
        'vision-title': 'The Evolution of <span class="ollarai-brand">Ollarai</span>',
        'vision-desc': 'The decisions are yours. We find the numbers you need for them, quickly and accurately.',
        'vision1-title': 'Flawless Data Foundation',
        'vision1-desc': 'The most honest numbers at the lowest cost. We collect and organize source filing data ourselves, building a foundation where every number has a clear source.',
        'vision2-title': 'Market Data & Criteria Search',
        'vision2-desc': 'We\'ll add closing prices and trading volume to filing figures, so you can filter metrics computed from public data, like PER and PBR, by your own criteria.',
        'vision3-title': 'Korea · US · Japan Filings in One Place',
        'vision3-desc': 'Starting with Korea\'s DART and expanding to the US EDGAR and Japan\'s EDINET, we\'re widening our data so you can search each country\'s filings with a single question.',
        'features-title': 'Why <span class="ollarai-brand">Ollarai</span>?',
        'features-desc': 'Not summaries floating around the web, but the exact figures from the original filings.',
        'feat1-title': 'The source of numbers,<br/>extracted directly from filings.',
        'feat1-desc': 'AI reads the tables in public filings that analysts used to copy manually into spreadsheets. We don\'t summarize information floating around the web. We collect and process source data from systems like <span class="text-primary font-bold">DART and EDGAR</span> into our database to provide accurate figures that match the original filings.',
        'feat1-tooltip': 'Compared to Bloomberg we\'re still a tiny bug — but <span class="ollarai-brand">Ollarai</span>\'s data coverage grows a little wider every day.',
        'cta-title': 'Good decisions<br/>start with accurate numbers.',
        'cta-desc': 'Sign up and start asking questions about filing data right away.',
        'cta-note': 'No payment details needed · Up to 100 free questions a day',
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
        title: 'Ollarai - 開示財務データ、聞けばすぐ',
        'og-title': 'Ollarai - 開示財務データ、聞けばすぐ',
        'og-description': '開示資料を探す時間は0分に。知りたい財務数値を質問すれば、開示原文からそのまま取り出すAI開示データ検索。',
        'og-image': 'og/ollarai-og-image-ja.png',
        'og-locale': 'ja_JP',
        'nav-roadmap': 'ロードマップ',
        'nav-screening': 'AIスクリーニング',
        'nav-features': '主な機能',
        'cta': '無料で始める',
        'hero-kicker': '',
        'hero-title': '開示資料を探す時間は<br/><span class="gradient-text">0分</span>に。',
        'hero-subtitle': '知りたい財務数値を質問してください。<br/><span class="ollarai-brand">Ollarai</span>が開示原文から<br/><span class="text-primary font-semibold">正確な数値を見つけ</span>、ひと目でわかるように整理します。',
        'hero-cta': '無料で始める',
        'problem-title': 'データのない分析は、仮説に過ぎません。',
        'problem-desc': '市場のノイズの中で、個人投資家が信頼できる数字を自分で確かめるのは今も簡単ではありません。<br/>専門家のモデルは強力ですが、それを支える「精密なデータ」は高価で入手困難です。',
        'problem-card1-title': '数字ひとつの手間',
        'problem-card1-desc': '数百ページの報告書から表を探し、Excelに写し、単位を揃える。数字をひとつ確かめるだけで、あまりにも時間がかかります。',
        'problem-card2-title': '情報の障壁',
        'problem-card2-desc': '数千万円のターミナルなしではアクセスできなかった精密な開示データ分析。今こそ変わるべき時です。',
        'problem-card3-title': '断片化された市場',
        'problem-card3-desc': '国ごとに異なる開示制度と言語。韓国の開示から始めて米国へと範囲を広げ、データ収集だけで一日を費やす非効率を終わらせます。',
        'screening-title': '財務条件で企業を絞り込むAIスクリーニング',
        'screening-desc': '自分で決めた財務条件に合う企業を、開示の数字で絞り込むスクリーニングを準備しています。現在は開示された財務諸表の数字を抽出しており、次に終値と出来高のデータを加え、それをもとにPER、PBRなどの株価に基づく指標によるスクリーニングを<span class="ollarai-brand">Ollarai</span>で提供する予定です。',
        'screening-point1': '<b>現在利用可能</b> ・ 開示財務諸表の数字の抽出(売上高、営業利益、負債、ROEなど)',
        'screening-point2': '<b>次のステップ</b> ・ 終値・出来高データの追加',
        'screening-point3': '<b>その次</b> ・ PER、PBRなどの株価に基づく指標によるフィルタリング',
        'screening-ribbon': '工事中',
        'screening-badge': 'スクリーニング画面、準備中です',
        'screening-badge-desc': '正確なデータの上に築かれる次の機能に、もうすぐ出会えます。',
        'screening-launch-badge': '公開予定',
        'screening-cta': '今すぐ無料で試す',
        'screening-preview-tag': 'プレビュー',
        'screening-query-caption': '例示画面です ・ 表の数値は実際のデータではありません',
        'vision-title': '<span class="ollarai-brand">Ollarai</span>の進化',
        'vision-desc': '判断するのはあなたです。私たちは、その判断に必要な数字を最も速く正確に見つけます。',
        'vision1-title': '完璧なデータ基盤',
        'vision1-desc': '最も正直な数字を最も手頃な価格で。開示の原典データを自ら収集・整理し、すべての数字の出所が明確なデータ基盤を築きます。',
        'vision2-title': '株価データと条件検索',
        'vision2-desc': '開示の財務数値に終値・出来高データを加え、PER・PBRなど公開データから計算される指標を、自分で決めた条件で絞り込めるようにします。',
        'vision3-title': '韓・米・日の開示を一つに',
        'vision3-desc': '韓国のDARTから始めて、米国のEDGAR、日本のEDINETへ。国ごとに異なる開示を一つの質問で探せるよう、データの範囲を広げていきます。',
        'features-title': 'なぜ<span class="ollarai-brand">Ollarai</span>なのか',
        'features-desc': 'ウェブ上の要約ではなく、開示原文にある数字をそのままお届けします。',
        'feat1-title': '数字の根源、<br/>企業開示から直接抽出します。',
        'feat1-desc': 'アナリストが手作業でExcelに写していた開示資料の表をAIが直接読み取ります。私たちはウェブ上の情報を要約しません。<span class="text-primary font-bold">電子開示システム(DART、EDGAR)</span>のような原典データをデータベースに収集・加工し、開示原文と一致する正確な数値を提供します。',
        'feat1-tooltip': 'Bloombergに比べればまだ小さな存在ですが、<span class="ollarai-brand">Ollarai</span>のデータカバレッジは毎日少しずつ広がっています。',
        'cta-title': '良い判断は<br/>正確な数字から始まります。',
        'cta-desc': '今すぐ登録して、開示データにそのまま質問してみてください。',
        'cta-note': 'お支払い情報は不要 · 1日100回まで無料',
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

const simData = {
    ko: {
        system: 'dart',
        query: "SELECT op_profit FROM dart_financials WHERE ticker='005930' AND period='2026Q1'",
        result: "890,200,000,000 <span class=\"text-sm font-normal text-slate-500\">KRW</span>"
    },
    en: {
        system: 'edgar',
        query: "SELECT operating_income FROM edgar_financials WHERE ticker='NVDA' AND period='2026Q1'",
        result: "$890,200,000 <span class=\"text-sm font-normal text-slate-500\">USD</span>"
    },
    ja: {
        system: 'edinet',
        query: "SELECT operating_income FROM edinet_financials WHERE ticker='6758' AND period='2026Q1'",
        result: "890,200,000,000 <span class=\"text-sm font-normal text-slate-500\">JPY</span>"
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
    document.getElementById('sim-edinet').classList.toggle('hidden', sd.system !== 'edinet');
    document.getElementById('sim-sql-query').textContent = sd.query;
    document.getElementById('sim-sql-result').innerHTML = sd.result;
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

// Screening demo: types a sample query, then reveals results row by row (illustrative sample data).
// Columns are rendered per-query on purpose — the real product isn't a fixed-column screener,
// it extracts whatever data the query asks for, and scoring itself happens server-side (no
// client-side "Score" column here).
(function () {
    const demoEl = document.getElementById('screener-demo');
    const queryEl = document.getElementById('screener-query-text');
    const thead = document.getElementById('screener-result-head');
    const tbody = document.getElementById('screener-result-body');
    if (!demoEl || !queryEl || !thead || !tbody) return;

    const demosByLang = {
        ko: [
            { query: 'PER 10 이하 · ROE 15% 이상 반도체주', columns: ['Ticker', 'PER', 'ROE', '영업이익률'], highlight: [1, 2], rows: [
                ['005930', '8.2', '17.4%', '21.3%'],
                ['000660', '9.1', '19.8%', '24.6%'],
                ['042700', '7.6', '16.2%', '18.9%'],
            ] },
            { query: '영업이익률 20%↑ · 부채비율 60%↓ (한·미·일)', columns: ['Ticker', 'PER', '영업이익률', '부채비율'], highlight: [2], rows: [
                ['035420', '9.1', '21.4%', '42%'],
                ['AAPL', '7.6', '28.4%', '35%'],
                ['6758.T', '9.8', '22.9%', '58%'],
            ] },
            { query: '삼성전자 최근 4개 분기 실적 추이', columns: ['분기', '매출 YoY', '영업이익 YoY', '영업이익률'], highlight: [1, 2, 3], rows: [
                ['2025.Q2', '+9.4%', '+21.3%', '13.2%'],
                ['2025.Q3', '+11.8%', '+26.7%', '14.4%'],
                ['2025.Q4', '+14.2%', '+31.5%', '15.8%'],
                ['2026.Q1', '+16.6%', '+38.9%', '16.8%'],
            ] },
        ],
        en: [
            { query: 'PER under 10 · ROE above 15% (semiconductors)', columns: ['Ticker', 'PER', 'ROE', 'Op Margin'], highlight: [1, 2], rows: [
                ['005930', '8.2', '17.4%', '21.3%'],
                ['000660', '9.1', '19.8%', '24.6%'],
                ['042700', '7.6', '16.2%', '18.9%'],
            ] },
            { query: 'Op. margin 20%+ · Debt/Equity under 60% (KR/US/JP)', columns: ['Ticker', 'PER', 'Op Margin', 'Debt/Equity'], highlight: [2], rows: [
                ['035420', '9.1', '21.4%', '42%'],
                ['AAPL', '7.6', '28.4%', '35%'],
                ['6758.T', '9.8', '22.9%', '58%'],
            ] },
            { query: 'Samsung Electronics — last 4 quarters trend', columns: ['Quarter', 'Revenue YoY', 'Op. Income YoY', 'Op Margin'], highlight: [1, 2, 3], rows: [
                ['2025.Q2', '+9.4%', '+21.3%', '13.2%'],
                ['2025.Q3', '+11.8%', '+26.7%', '14.4%'],
                ['2025.Q4', '+14.2%', '+31.5%', '15.8%'],
                ['2026.Q1', '+16.6%', '+38.9%', '16.8%'],
            ] },
        ],
        ja: [
            { query: 'PER10倍以下・ROE15%以上の半導体株', columns: ['Ticker', 'PER', 'ROE', '営業利益率'], highlight: [1, 2], rows: [
                ['005930', '8.2', '17.4%', '21.3%'],
                ['000660', '9.1', '19.8%', '24.6%'],
                ['042700', '7.6', '16.2%', '18.9%'],
            ] },
            { query: '営業利益率20%以上・負債比率60%以下(韓・米・日)', columns: ['Ticker', 'PER', '営業利益率', '負債比率'], highlight: [2], rows: [
                ['035420', '9.1', '21.4%', '42%'],
                ['AAPL', '7.6', '28.4%', '35%'],
                ['6758.T', '9.8', '22.9%', '58%'],
            ] },
            { query: 'サムスン電子、直近4四半期の業績推移', columns: ['四半期', '売上高YoY', '営業利益YoY', '営業利益率'], highlight: [1, 2, 3], rows: [
                ['2025.Q2', '+9.4%', '+21.3%', '13.2%'],
                ['2025.Q3', '+11.8%', '+26.7%', '14.4%'],
                ['2025.Q4', '+14.2%', '+31.5%', '15.8%'],
                ['2026.Q1', '+16.6%', '+38.9%', '16.8%'],
            ] },
        ],
    };

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
            '<th class="' + (i === 0 ? 'text-left' : 'text-right') + ' py-2 font-normal">' + label + '</th>'
        ).join('');
        thead.appendChild(tr);
        requestAnimationFrame(() => requestAnimationFrame(() => tr.classList.add('visible')));
    }

    function renderRow(cells, highlight) {
        const tr = document.createElement('tr');
        tr.className = 'screener-row border-b border-white/5';
        tr.innerHTML = cells.map((val, i) => {
            if (i === 0) return '<td class="py-2">' + val + '</td>';
            const isHighlighted = (highlight || []).includes(i);
            return '<td class="text-right' + (isHighlighted ? ' text-primary font-bold' : '') + '">' + val + '</td>';
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
