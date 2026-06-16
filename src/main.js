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

document.querySelectorAll('button.bg-primary:not(#dialog-close):not(#cta-register-btn)').forEach(btn => {
    btn.addEventListener('click', () => openDialog());
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

// Email registration
const API_URL = 'https://flpyq9u80g.execute-api.ap-northeast-2.amazonaws.com/prod/subscribe';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPINNER = '<span class="flex items-center justify-center"><span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span></span>';

document.getElementById('cta-register-btn').addEventListener('click', async () => {
    const input = document.getElementById('cta-email-input');
    const email = input.value.trim();

    const errorEl = document.getElementById('cta-email-error');
    const showError = (msg) => {
        input.classList.add('border-red-500');
        errorEl.textContent = msg;
        errorEl.classList.remove('hidden');
        setTimeout(() => {
            input.classList.remove('border-red-500');
            errorEl.classList.add('hidden');
        }, 2500);
    };

    if (!email) {
        showError(i18n[currentLang]['error-empty']);
        input.focus();
        return;
    }

    if (!EMAIL_RE.test(email)) {
        showError(i18n[currentLang]['error-invalid']);
        return;
    }

    const btn = document.getElementById('cta-register-btn');
    btn.disabled = true;
    btn.innerHTML = SPINNER;

    const [res] = await Promise.all([
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, lang: currentLang }),
        }).catch(() => null),
        new Promise(r => setTimeout(r, 800)),
    ]);

    if (!res) {
        openDialog(i18n[currentLang]['error-network']);
    } else {
        input.value = '';
        openDialog(res.status === 201
            ? i18n[currentLang]['success-registered']
            : i18n[currentLang]['already-registered']
        );
    }

    btn.disabled = false;
    btn.innerHTML = i18n[currentLang]['cta-register'];
});

document.querySelectorAll('a[data-i18n-dialog]').forEach(link => {
    link.addEventListener('click', function (e) {
        e.stopPropagation();
        openDialog(i18n[currentLang][this.dataset.i18nDialog]);
    });
});

// i18n data
const i18n = {
    ko: {
        title: 'OllarAI - 데이터가 투자의 해답이 되는 순간',
        'nav-roadmap': '로드맵',
        'nav-features': '주요 기능',
        'cta': '베타 참여하기',
        'hero-title': '투자의 <span class="gradient-text">본질</span>은<br/>거짓말하지 않는 숫자에 있습니다.',
        'hero-subtitle': '그럴듯한 문장에 현혹되지 마세요.<br/><span class="pretendard">올라</span> <span class="ollarai-brand-bold">AI</span>는 환각(Hallucination) 없이 공시 데이터 그대로의<br/><span class="text-primary font-semibold">진실된 숫자</span>를 인출합니다.',
        'hero-cta': '나만의 분석가 만나기',
        'problem-title': '데이터가 없는 분석은 가설일 뿐입니다.',
        'problem-desc': '시장의 소음과 AI가 지어내는 거짓 숫자들 사이에서 개인 투자자는 고립되어 있습니다.<br/>전문가들의 모델은 강력하지만, 그 모델을 지탱하는 \'정밀한 데이터\'는 너무나 비싸고 어렵습니다.',
        'problem-card1-title': 'AI의 거짓말',
        'problem-card1-desc': '범용 LLM은 확률적으로 문장을 생성합니다. 하지만 금융에서 \'확률적인 숫자\'는 곧 손실을 의미합니다.',
        'problem-card2-title': '정보의 장벽',
        'problem-card2-desc': '수천만 원짜리 터미널 없이는 접근조차 불가능했던 정교한 공시 데이터 분석, 이제는 달라져야 합니다.',
        'problem-card3-title': '파편화된 시장',
        'problem-card3-desc': '한·미·일 각기 다른 공시 체계와 언어. 데이터를 모으는 데만 하루를 다 쓰는 비효율을 끝냅니다.',
        'vision-title': '<span class="ollarai-brand">Ollarai</span>의 진화',
        'vision-desc': '우리의 목표는 단순한 툴이 아닙니다. 당신의 주머니 속 \'전담 애널리스트\'가 되는 것입니다.',
        'vision1-title': '무결점 데이터 토대',
        'vision1-desc': '가장 정직한 숫자를 가장 저렴하게. 모든 분석의 시작은 \'정확한 팩트\'입니다. 특화된 기술로 할루시네이션을 제로화한 데이터 인출 환경을 구축합니다.',
        'vision2-title': '지능형 전문 분석',
        'vision2-desc': '추출된 데이터를 넘어, 애널리스트의 관점에서 종목을 비교하고 실적을 스크리닝합니다. 단순 조회를 넘어 \'인사이트\'를 제공하는 전문 분석 모델로 진화합니다.',
        'vision3-title': '개인화 로보어드바이저',
        'vision3-desc': '모든 개별 기업의 분석 모델을 탑재합니다. 전문가들만 누리던 정교한 투자 모델을 당신의 포트폴리오에 직접 연결하여 실질적인 수익으로 전환합니다.',
        'features-title': '왜 <span class="pretendard">올라</span> <span class="ollarai-brand-bold">AI</span>여야만 하는가',
        'features-desc': '단순한 검색 엔진을 넘어, 당신의 투자 확신을 위한 정밀 공학을 제공합니다.',
        'feat1-title': '숫자의 근원,<br/>기업 공시에서 직접 인출합니다.',
        'feat1-desc': '애널리스트들이 수작업으로 엑셀에 옮겨 적던 공시 자료의 표들을 AI가 직접 읽습니다. 우리는 웹상의 떠도는 정보를 요약하지 않습니다. <span class="text-primary font-bold">전자공시시스템(DART)</span>과 같은 원천 데이터를 데이터베이스에 수집/가공하여 1원 단위까지 정확한 수치를 제공합니다.',
        'feat1-tooltip': '블룸버그에 비하면 아직은 버그에 불과하지만 <span class="pretendard">올라</span> <span class="ollarai-brand-bold">ai</span>의 데이터 커버리지는 매일 조금씩 넓어지고 있습니다.',
        'feat2-title': '질문 그 이상의 통찰,<br/>프로의 데이터를 연결합니다.',
        'feat2-desc': '"이 종목 왜 올라?"라는 단순한 질문에도 <span class="pretendard">올라</span> <span class="ollarai-brand-bold">AI</span>는 전문 투자자의 시나리오로 응답합니다. 뉴스 제목 요약이 아니라, 해당 종목의 <span class="text-primary font-bold">선행 지표와 원가 구조</span>까지 파고들어 입체적인 보고서를 즉시 구성합니다.',
        'feat2-question': '"요즘 제주반도체 주가 왜이래? 분석해줘."',
        'feat2-source1': '한국무역협회 제주지부 반도체 수출액',
        'feat2-source2': '중국 H고객사 모바일 기기 판매량 추세',
        'feat2-source3': 'DRAMExchange 실시간 DDR4 ASP (원가 추정)',
        'feat2-analysis': '"현재 주가 상승은 단순 수급이 아닌, <b>중국 고객사향 모바일 칩 수요 폭증</b>과 <b>제주 지역 반도체 수출 통계의 급등</b>이 교차 확인되고 있습니다. 원가(ASP) 대비 마진율이 24% 상향된 것으로 추정됩니다."',
        'feat3-title': '직관을 넘어선 증명,<br/>AI 애널리스트를 만나보세요.',
        'feat3-desc': '우리는 단순한 가이드를 주지 않습니다. <span class="pretendard">올라</span> <span class="ollarai-brand-bold">AI</span>는 압도적인 데이터를 무기로 스스로 가설을 세우고 <b>목표가(Target Price)</b>를 산출하는 지능형 에이전트입니다. 실제 시장에서 인간 애널리스트와 수익률로 경쟁하며, 더 높은 정확도로 당신의 곁에서 성과를 증명할 것입니다.',
        'feat3-card1-title': 'TP 산출 엔진',
        'feat3-card1-desc': '데이터 기반 적정 주가와 목표가 자동 도출',
        'feat3-card2-desc': '인간 애널리스트, 다른 AI들과의 예측 정확도 진검승부',
        'feat3-card3-title': '오토 리포트',
        'feat3-card3-desc': '상시 업데이트되는 데이터 기반 전문 보고서 발행',
        'feat3-card4-title': '수익률 증명',
        'feat3-card4-desc': '누적된 백테스팅과 실전 성과를 통한 신뢰 확보',
        'cta-title': '모든 위대한 투자는<br/>확신을 주는 데이터로부터 시작됩니다.',
        'cta-desc': '<span class="ollarai-brand">Ollarai</span>의 초기 테스터가 되어 가장 먼저 미래의 투자 환경을 경험하세요.',
        'email-placeholder': '이메일을 입력하고 알림 받기',
        'cta-register': '지금 등록하기',
        'dialog-default': '<span class="pretendard">올라</span> <span class="ollarai-brand-bold">ai</span>는 현재 열심히 준비중입니다.<br/>조금만 기다려주세요!',
        'dialog-close': '확인',
        'dialog-terms': '꼼꼼하게 작성된 이용약관 곧 보여드릴게요',
        'dialog-privacy': '안전한 개인정보처리방침으로 곧 만나요',
        'footer-terms': '이용약관',
        'footer-privacy': '개인정보처리방침',
        'footer-info': '상호명: Nexora | 대표자: 전태호 | 사업자등록번호: 226-23-07642<br>&copy; 2026 Ollarai (올라라이). All rights reserved.',
        'error-empty': '이메일을 입력해주세요.',
        'error-invalid': '올바른 이메일 형식이 아닙니다.',
        'error-network': '오류가 발생했습니다. 다시 시도해주세요.',
        'success-registered': '등록되었습니다! 새로운 소식으로 인사드릴게요.',
        'already-registered': '이미 등록된 이메일입니다.',
    },
    en: {
        title: 'OllarAI - When Data Becomes the Answer to Investment',
        'nav-roadmap': 'Roadmap',
        'nav-features': 'Features',
        'cta': 'Join Beta',
        'hero-title': 'The <span class="gradient-text">truth</span> of investing<br/>lies in numbers that don\'t lie.',
        'hero-subtitle': 'Don\'t be misled by plausible-sounding text.<br/><span class="ollarai-brand">OllarAI</span> retrieves the exact numbers from real data<br/><span class="text-primary font-semibold">without hallucination.</span>',
        'hero-cta': 'Meet My Analyst',
        'problem-title': 'Analysis without data is just a hypothesis.',
        'problem-desc': 'Individual investors are isolated amid market noise and numbers fabricated by AI.<br/>Expert models are powerful, but the "precise data" underpinning them is prohibitively expensive and inaccessible.',
        'problem-card1-title': 'AI Hallucinations',
        'problem-card1-desc': 'General-purpose LLMs generate text probabilistically. But in finance, a "probabilistic number" means losses.',
        'problem-card2-title': 'Information Barrier',
        'problem-card2-desc': 'Sophisticated public filings analysis once required terminals costing tens of millions of won. That needs to change.',
        'problem-card3-title': 'Fragmented Markets',
        'problem-card3-desc': 'Korea, the US, and Japan each have different filing systems and languages. End the inefficiency of spending a whole day just gathering data.',
        'vision-title': 'The Evolution of <span class="ollarai-brand">OllarAI</span>',
        'vision-desc': 'Our goal is not just a tool. It\'s to become the "dedicated analyst" in your pocket.',
        'vision1-title': 'Flawless Data Foundation',
        'vision1-desc': 'The most honest numbers at the lowest cost. Every analysis starts with "accurate facts." We build a data retrieval environment with zero hallucination using specialized technology.',
        'vision2-title': 'Intelligent Professional Analysis',
        'vision2-desc': 'Beyond extracted data, we compare stocks and screen earnings from an analyst\'s perspective. Evolving into a specialized analysis model that provides "insights" beyond simple queries.',
        'vision3-title': 'Personalized Robo-Advisor',
        'vision3-desc': 'Equipped with analysis models for every individual company. Connect the sophisticated investment models once exclusive to experts directly to your portfolio for real returns.',
        'features-title': 'Why <span class="ollarai-brand">OllarAI</span>?',
        'features-desc': 'Beyond a simple search engine — precision engineering for your investment conviction.',
        'feat1-title': 'The source of numbers,<br/>extracted directly from filings.',
        'feat1-desc': 'AI reads the tables in public filings that analysts used to copy manually into spreadsheets. We don\'t summarize information floating around the web. We collect and process source data from systems like <span class="text-primary font-bold">EDGAR (EDINET, DART)</span> into our database to provide figures accurate to the last cent.',
        'feat1-tooltip': 'Compared to Bloomberg we\'re still a tiny bug — but <span class="ollarai-brand">OllarAI</span>\'s data coverage grows a little wider every day.',
        'feat2-title': 'Insight beyond questions,<br/>connecting professional data.',
        'feat2-desc': 'Even for a simple question like "Why is this stock rising?", <span class="ollarai-brand">OllarAI</span> responds with a professional investor\'s scenario. Not just a summary of headlines — an instant in-depth report drilling into the stock\'s <span class="text-primary font-bold">leading indicators and cost structure.</span>',
        'feat2-question': '"Why is Jeju Semiconductor moving lately? Analyze it for me."',
        'feat2-source1': 'KITA Jeju Branch Semiconductor Export Volume',
        'feat2-source2': 'China H-client Mobile Device Sales Trend',
        'feat2-source3': 'DRAMExchange Real-time DDR4 ASP (Cost Est.)',
        'feat2-analysis': '"The rally is not simple supply-demand — <b>surging mobile chip demand from Chinese clients</b> and a <b>sharp jump in Jeju semiconductor export data</b> are cross-confirmed. Estimated margin vs. ASP cost has improved 24%."',
        'feat3-title': 'Proof beyond intuition,<br/>meet your AI analyst.',
        'feat3-desc': 'We don\'t give simple guidance. <span class="ollarai-brand">OllarAI</span> is an intelligent agent that forms its own hypotheses and calculates a <b>Target Price</b> using overwhelming data. It competes with human analysts on returns in real markets, and will prove its performance by your side with higher accuracy.',
        'feat3-card1-title': 'TP Engine',
        'feat3-card1-desc': 'Auto-derive fair value and target price from data',
        'feat3-card2-desc': 'Head-to-head accuracy contest vs. human analysts & other AIs',
        'feat3-card3-title': 'Auto Report',
        'feat3-card3-desc': 'Continuously updated data-driven professional reports',
        'feat3-card4-title': 'Proven Returns',
        'feat3-card4-desc': 'Building trust through accumulated backtesting and real-world results',
        'cta-title': 'Every great investment<br/>starts with data that gives you conviction.',
        'cta-desc': 'Be an early tester for <span class="ollarai-brand">OllarAI</span> and experience the future of investing first.',
        'email-placeholder': 'Enter your email to get notified',
        'cta-register': 'Register Now',
        'dialog-default': '<span class="ollarai-brand">OllarAI</span> is currently hard at work.<br/>Please wait a little longer!',
        'dialog-close': 'OK',
        'dialog-terms': 'Our carefully written Terms of Service are coming soon.',
        'dialog-privacy': 'Our Privacy Policy will be ready soon.',
        'footer-terms': 'Terms of Service',
        'footer-privacy': 'Privacy Policy',
        'footer-info': '&copy; 2026 Nexora Inc. All rights reserved.',
        'error-empty': 'Please enter your email.',
        'error-invalid': 'Please enter a valid email address.',
        'error-network': 'Something went wrong. Please try again.',
        'success-registered': 'Registered! Stay tuned.',
        'already-registered': 'Already registered.',
    },
    ja: {
        title: 'OllarAI - データが投資の答えになる瞬間',
        'nav-roadmap': 'ロードマップ',
        'nav-features': '主な機能',
        'cta': 'ベータに参加',
        'hero-title': '投資の<span class="gradient-text">本質</span>は<br/>嘘をつかない数字にあります。',
        'hero-subtitle': 'もっともらしい文章に惑わされないでください。<br/><span class="ollarai-brand">OllarAI</span>は開示データそのままの<br/><span class="text-primary font-semibold">真実の数字</span>をハルシネーションなしで引き出します。',
        'hero-cta': '専属アナリストに会う',
        'problem-title': 'データのない分析は、仮説に過ぎません。',
        'problem-desc': '市場のノイズとAIが作り出す虚偽の数字の中で、個人投資家は孤立しています。<br/>専門家のモデルは強力ですが、それを支える「精密なデータ」は高価で入手困難です。',
        'problem-card1-title': 'AIのハルシネーション',
        'problem-card1-desc': '汎用LLMは確率的に文章を生成します。しかし金融において「確率的な数字」は損失を意味します。',
        'problem-card2-title': '情報の障壁',
        'problem-card2-desc': '数千万円のターミナルなしではアクセスできなかった精密な開示データ分析。今こそ変わるべき時です。',
        'problem-card3-title': '断片化された市場',
        'problem-card3-desc': '韓国・米国・日本、それぞれ異なる開示制度と言語。データ収集だけで一日を費やす非効率を終わらせます。',
        'vision-title': '<span class="ollarai-brand">OllarAI</span>の進化',
        'vision-desc': '私たちの目標は単なるツールではありません。あなたのポケットの中の「専属アナリスト」になることです。',
        'vision1-title': '完璧なデータ基盤',
        'vision1-desc': '最も正直な数字を最も手頃な価格で。すべての分析の始まりは「正確な事実」です。特化した技術でハルシネーションをゼロにしたデータ抽出環境を構築します。',
        'vision2-title': 'インテリジェント専門分析',
        'vision2-desc': '抽出されたデータを超えて、アナリストの視点から銘柄を比較し業績をスクリーニングします。単純な照会を超えた「インサイト」を提供する専門分析モデルへ進化します。',
        'vision3-title': 'パーソナライズドロボアドバイザー',
        'vision3-desc': 'すべての個別企業の分析モデルを搭載します。専門家だけが享受していた精密な投資モデルをあなたのポートフォリオに直接接続し、実質的な収益に転換します。',
        'features-title': 'なぜ<span class="ollarai-brand">OllarAI</span>なのか',
        'features-desc': '単なる検索エンジンを超えて、あなたの投資確信のための精密工学を提供します。',
        'feat1-title': '数字の根源、<br/>企業開示から直接抽出します。',
        'feat1-desc': 'アナリストが手作業でExcelに写していた開示資料の表をAIが直接読み取ります。私たちはウェブ上の情報を要約しません。<span class="text-primary font-bold">電子開示システム(EDINET、DART)</span>のような原典データをデータベースに収集・加工し、1円単位まで正確な数値を提供します。',
        'feat1-tooltip': 'Bloombergに比べればまだ小さな存在ですが、<span class="ollarai-brand">OllarAI</span>のデータカバレッジは毎日少しずつ広がっています。',
        'feat2-title': '質問を超えた洞察、<br/>プロのデータを接続します。',
        'feat2-desc': '「この銘柄はなぜ上がっている?」という単純な質問にも、<span class="ollarai-brand">OllarAI</span>はプロ投資家のシナリオで応答します。ニュース見出しの要約ではなく、その銘柄の<span class="text-primary font-bold">先行指標とコスト構造</span>まで掘り下げた立体的なレポートを即座に構成します。',
        'feat2-question': '「最近、済州半導体の株価はなぜこんな動き? 分析して。」',
        'feat2-source1': '韓国貿易協会済州支部 半導体輸出額',
        'feat2-source2': '中国H顧客企業モバイル機器販売量推移',
        'feat2-source3': 'DRAMExchange リアルタイムDDR4 ASP(原価推定)',
        'feat2-analysis': '「現在の株価上昇は単純な需給ではなく、<b>中国顧客向けモバイルチップ需要の急増</b>と<b>済州地域半導体輸出統計の急騰</b>がクロス確認されています。原価(ASP)対比マージン率が24%上昇したと推定されます。」',
        'feat3-title': '直感を超えた証明、<br/>AIアナリストに会ってください。',
        'feat3-desc': '私たちは単なるガイドを提供しません。<span class="ollarai-brand">OllarAI</span>は圧倒的なデータを武器に自ら仮説を立て、<b>目標株価(Target Price)</b>を算出するインテリジェントエージェントです。実際の市場で人間のアナリストと収益率で競争し、より高い精度であなたのそばで成果を証明します。',
        'feat3-card1-title': 'TP算出エンジン',
        'feat3-card1-desc': 'データベースの適正株価と目標株価を自動導出',
        'feat3-card2-desc': '人間アナリスト、他のAIとの予測精度の真剣勝負',
        'feat3-card3-title': 'オートレポート',
        'feat3-card3-desc': '常時更新されるデータベースの専門レポート発行',
        'feat3-card4-title': '収益率証明',
        'feat3-card4-desc': '蓄積されたバックテストと実戦成果による信頼確保',
        'cta-title': 'すべての偉大な投資は<br/>確信を与えるデータから始まります。',
        'cta-desc': '<span class="ollarai-brand">OllarAI</span>の初期テスターになり、誰よりも先に未来の投資環境を体験してください。',
        'email-placeholder': 'メールアドレスを入力して通知を受け取る',
        'cta-register': '今すぐ登録',
        'dialog-default': '<span class="ollarai-brand">OllarAI</span>は現在準備中です。<br/>もう少しお待ちください!',
        'dialog-close': '確認',
        'dialog-terms': '利用規約は近日中に公開予定です。',
        'dialog-privacy': 'プライバシーポリシーは近日中に公開予定です。',
        'footer-terms': '利用規約',
        'footer-privacy': 'プライバシーポリシー',
        'footer-info': '&copy; 2026 Nexora Inc. All rights reserved.',
        'error-empty': 'メールアドレスを入力してください。',
        'error-invalid': '有効なメールアドレスを入力してください。',
        'error-network': 'エラーが発生しました。もう一度お試しください。',
        'success-registered': '登録されました! 新しいニュースでお会いしましょう。',
        'already-registered': 'すでに登録されているメールアドレスです。',
    }
};

function getLangFromURL() {
    const path = window.location.pathname;
    if (path === '/en' || path.startsWith('/en/')) return 'en';
    if (path === '/ko' || path.startsWith('/ko/')) return 'ko';
    if (path === '/ja' || path.startsWith('/ja/')) return 'ja';
    return null;
}

let currentLang = getLangFromURL() || 'ko';

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

window.setLang = function(lang) {
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
    setLang(getLangFromURL() || 'ko');
});

// Initialize language immediately to prevent flash of wrong language
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setLang(currentLang);
    });
} else {
    setLang(currentLang);
}
