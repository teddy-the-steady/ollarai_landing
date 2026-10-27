// UI language of the beta pages (/login/, /app/). The landing page passes ?lang=; after that the choice
// is remembered, falling back to the browser language. Questions themselves can be in any language
// (/query sends language 'auto').

export const LANGS = ['ko', 'en', 'ja'];
const LANG_KEY = 'ollarai-lang';
const LOCALES = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP' };

function storageGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
}

function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch { /* storage blocked */ }
}

function detectLang() {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (LANGS.includes(fromUrl)) {
        storageSet(LANG_KEY, fromUrl);
        return fromUrl;
    }
    const stored = storageGet(LANG_KEY);
    if (LANGS.includes(stored)) return stored;
    const browser = (navigator.language || '').slice(0, 2).toLowerCase();
    return LANGS.includes(browser) ? browser : 'ko';
}

export const lang = detectLang();
export const locale = LOCALES[lang];
document.documentElement.lang = lang;

// Site paths per language (Korean pages live at the root)
export const sitePath = (path) => (lang === 'ko' ? path : `/${lang}${path}`);

export function setLang(next) {
    storageSet(LANG_KEY, next);
    const url = new URL(window.location.href);
    url.searchParams.delete('lang');
    window.location.replace(url);
}

const STRINGS = {
    ko: {
        // login
        'login.page-title': '로그인 - Ollarai',
        'login.title': '로그인',
        'login.subtitle': '베타 테스트에 참여하려면 로그인해 주세요.',
        'login.submit': '로그인',
        'signup.title': '회원가입',
        'signup.subtitle': '이메일로 가입하고 베타 테스트를 신청하세요.',
        'signup.submit': '가입하기',
        'auth.email': '이메일',
        'auth.password': '비밀번호',
        'auth.password-placeholder': '8자 이상',
        'auth.password-confirm': '비밀번호 확인',
        'auth.consent': '만 14세 이상이며, <a href="{terms}" target="_blank" class="text-primary underline underline-offset-2">이용약관</a>과 <a href="{privacy}" target="_blank" class="text-primary underline underline-offset-2">개인정보처리방침</a>에 동의합니다.',
        'auth.error.invalid-credentials': '이메일 또는 비밀번호가 올바르지 않아요.',
        'auth.error.email-not-confirmed': '이메일 인증이 아직 완료되지 않았어요. 받은 메일함을 확인해 주세요.',
        'auth.error.exists': '이미 가입된 이메일이에요. 로그인해 주세요.',
        'auth.error.weak-password': '비밀번호가 너무 단순해요. 8자 이상으로 더 복잡하게 만들어 주세요.',
        'auth.error.rate-limit': '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.',
        'auth.error.generic': '문제가 발생했어요. 잠시 후 다시 시도해 주세요.',
        'auth.invalid.email': '올바른 이메일 주소를 입력해 주세요.',
        'auth.invalid.password': '비밀번호는 8자 이상이어야 해요.',
        'auth.invalid.mismatch': '비밀번호가 서로 달라요.',
        'auth.invalid.consent': '이용약관과 개인정보처리방침에 동의해 주세요.',
        'auth.confirm-sent': '{email}로 인증 메일을 보냈어요. 메일의 링크를 누르면 가입이 완료돼요.',

        // app: account and views
        'app.logout': '로그아웃',
        'app.usage': '이번 달 유료 {used} / {limit}',
        'app.start.title': '베타 테스트에 오신 걸 환영해요',
        'app.start.desc': '공시 원본 데이터에 자연어로 질문하고,<br>SQL로 조회한 결과를 표로 바로 확인해 보세요.',
        'app.start.button': '베타 테스트 시작',
        'app.pending.title': '승인을 기다리고 있어요',
        'app.pending.desc': '베타 참여 신청이 접수됐어요.<br>승인이 완료되면 바로 이용하실 수 있어요.',
        'app.pending.refresh': '승인 상태 확인',
        'app.pending.hint': '아직 승인 대기 중이에요.',
        'app.blocked.title': '이용이 제한된 계정이에요',
        'app.contact': '문의',
        'app.error.title': '서비스에 연결하지 못했어요',
        'app.retry': '다시 시도',
        'app.query.title': '무엇이 궁금하세요?',
        'app.query.placeholder': '예: 삼성전자 최근 4개 분기 영업이익 추이',
        'app.query.hint': 'Enter로 전송 · Shift+Enter로 줄바꿈',
        'app.query.submit': '질문 보내기',
        'app.tier.label': '답변 방식',
        'app.tier.free': '무료',
        'app.tier.paid': '유료',
        'app.history.more': '이전 질문 더 보기',
        'app.history.failed': '이전 질문을 불러오지 못했어요 · 다시 시도',

        // app: errors
        'app.err.generic': '문제가 발생했어요. 잠시 후 다시 시도해 주세요.',
        'app.err.network': '네트워크 연결을 확인해 주세요.',
        'app.err.paid-unavailable': '이 계정에서는 유료 방식을 사용할 수 없어요.',
        'app.err.monthly-limit': '이번 달 유료 질문 한도({limit}회)를 모두 사용했어요. 무료로 바꾸면 계속 질문할 수 있고, 유료 한도는 매월 1일 0시(한국 시간)에 초기화돼요.',
        'app.err.rate-limit': '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.',
        'app.err.unavailable': '서비스가 잠시 불안정해요. 잠시 후 다시 시도해 주세요.',
        'app.err.answer': '답변을 생성하지 못했어요. 잠시 후 다시 시도해 주세요.',

        // app: result cards
        'result.loading.analyzing': '질문을 분석하고 있어요…',
        'result.loading.querying': '데이터를 조회하고 있어요… {s}초',
        'result.loading.waiting': '조금만 기다려 주세요… {s}초',
        'result.request-id.copy': '요청 ID 복사',
        'result.copied': '복사됨',
        'result.copy-failed': '복사 실패',
        'result.not-found': '결과를 찾지 못했어요. 질문을 조금 바꿔서 다시 시도해 주세요.',
        'result.currency': '금액 통화',
        'result.unconverted.mixed': '여러 통화가 섞인 값이라 환산하지 않았어요',
        'result.unconverted.unknown': '통화를 확인하지 못해 환산하지 않았어요',
        'result.unconverted.no-rate': '{currency} 환율이 없어 환산하지 않았어요',
        'result.rows': '{n}행',
        'result.rows.top': '상위 {n}행',
        'result.rows.of': '{total}행 중 {n}행',
        'result.csv': 'CSV 복사',
        'result.sql.show': 'SQL 보기',
        'result.sql.hide': 'SQL 숨기기',
        'result.empty': '조건에 맞는 데이터가 없어요.',
        'result.locked': '나머지 {n}행은 유료 플랜에서 볼 수 있어요.',
        'result.more': '{n}행 더 보기',
        'result.load-all': '전체 불러오기',
        'result.load-all.hint': '결과가 {n}행보다 많아요. 전체를 불러오면 시간이 걸리고 화면이 느려질 수 있어요.',
        'result.load-all.loading': '불러오는 중…',
        'result.load-all.failed': '전체 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
        'result.truncated': '결과가 많아 상위 {n}행만 표시했어요. 조건을 더 좁히면 전체 결과를 볼 수 있어요.',
    },
    en: {
        'login.page-title': 'Log in - Ollarai',
        'login.title': 'Log in',
        'login.subtitle': 'Log in to join the beta.',
        'login.submit': 'Log in',
        'signup.title': 'Sign up',
        'signup.subtitle': 'Sign up with your email to apply for the beta.',
        'signup.submit': 'Sign up',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.password-placeholder': 'At least 8 characters',
        'auth.password-confirm': 'Confirm password',
        'auth.consent': 'I am 14 or older and agree to the <a href="{terms}" target="_blank" class="text-primary underline underline-offset-2">Terms of Service</a> and <a href="{privacy}" target="_blank" class="text-primary underline underline-offset-2">Privacy Policy</a>.',
        'auth.error.invalid-credentials': 'Incorrect email or password.',
        'auth.error.email-not-confirmed': 'Your email isn\'t verified yet. Please check your inbox.',
        'auth.error.exists': 'This email is already registered. Please log in.',
        'auth.error.weak-password': 'This password is too simple. Use at least 8 characters and make it harder to guess.',
        'auth.error.rate-limit': 'Too many requests. Please try again shortly.',
        'auth.error.generic': 'Something went wrong. Please try again shortly.',
        'auth.invalid.email': 'Please enter a valid email address.',
        'auth.invalid.password': 'Your password must be at least 8 characters.',
        'auth.invalid.mismatch': 'The passwords don\'t match.',
        'auth.invalid.consent': 'Please agree to the Terms of Service and Privacy Policy.',
        'auth.confirm-sent': 'We sent a verification email to {email}. Click the link in it to finish signing up.',

        'app.logout': 'Log out',
        'app.usage': 'Paid this month {used} / {limit}',
        'app.start.title': 'Welcome to the beta',
        'app.start.desc': 'Ask questions about original filing data in plain language,<br>and see the results of the SQL query as a table.',
        'app.start.button': 'Start the beta',
        'app.pending.title': 'Waiting for approval',
        'app.pending.desc': 'We\'ve received your request to join the beta.<br>You can start as soon as it\'s approved.',
        'app.pending.refresh': 'Check approval status',
        'app.pending.hint': 'Still waiting for approval.',
        'app.blocked.title': 'This account is restricted',
        'app.contact': 'Contact',
        'app.error.title': 'Couldn\'t connect to the service',
        'app.retry': 'Try again',
        'app.query.title': 'What would you like to know?',
        'app.query.placeholder': 'e.g. Samsung Electronics operating income over the last 4 quarters',
        'app.query.hint': 'Enter to send · Shift+Enter for a new line',
        'app.query.submit': 'Send question',
        'app.tier.label': 'Answer mode',
        'app.tier.free': 'Free',
        'app.tier.paid': 'Paid',
        'app.history.more': 'Show earlier questions',
        'app.history.failed': 'Couldn\'t load earlier questions · Try again',

        'app.err.generic': 'Something went wrong. Please try again shortly.',
        'app.err.network': 'Please check your network connection.',
        'app.err.paid-unavailable': 'The paid mode isn\'t available for this account.',
        'app.err.monthly-limit': 'You\'ve used all of this month\'s paid questions ({limit}). You can keep asking in the free mode; the paid limit resets on the 1st of each month at midnight Korea time.',
        'app.err.rate-limit': 'Too many requests. Please try again shortly.',
        'app.err.unavailable': 'The service is temporarily unstable. Please try again shortly.',
        'app.err.answer': 'Couldn\'t generate an answer. Please try again shortly.',

        'result.loading.analyzing': 'Analyzing your question…',
        'result.loading.querying': 'Querying the data… {s}s',
        'result.loading.waiting': 'Almost there… {s}s',
        'result.request-id.copy': 'Copy request ID',
        'result.copied': 'Copied',
        'result.copy-failed': 'Copy failed',
        'result.not-found': 'No results found. Try rephrasing your question a little.',
        'result.currency': 'Currency for amounts',
        'result.unconverted.mixed': 'Not converted: this value mixes several currencies',
        'result.unconverted.unknown': 'Not converted: the currency couldn\'t be determined',
        'result.unconverted.no-rate': 'Not converted: no {currency} exchange rate',
        'result.rows': '{n} rows',
        'result.rows.top': 'Top {n} rows',
        'result.rows.of': '{n} of {total} rows',
        'result.csv': 'Copy CSV',
        'result.sql.show': 'Show SQL',
        'result.sql.hide': 'Hide SQL',
        'result.empty': 'No data matches these conditions.',
        'result.locked': 'The other {n} rows are available on the paid plan.',
        'result.more': 'Show {n} more rows',
        'result.load-all': 'Load all',
        'result.load-all.hint': 'There are more than {n} rows. Loading them all may take a while and slow down the page.',
        'result.load-all.loading': 'Loading…',
        'result.load-all.failed': 'Couldn\'t load the full result. Please try again shortly.',
        'result.truncated': 'There are many results, so only the top {n} rows are shown. Narrow the conditions to see the full result.',
    },
    ja: {
        'login.page-title': 'ログイン - Ollarai',
        'login.title': 'ログイン',
        'login.subtitle': 'ベータテストに参加するにはログインしてください。',
        'login.submit': 'ログイン',
        'signup.title': '新規登録',
        'signup.subtitle': 'メールアドレスで登録して、ベータテストに申し込みましょう。',
        'signup.submit': '登録する',
        'auth.email': 'メールアドレス',
        'auth.password': 'パスワード',
        'auth.password-placeholder': '8文字以上',
        'auth.password-confirm': 'パスワード（確認）',
        'auth.consent': '14歳以上であり、<a href="{terms}" target="_blank" class="text-primary underline underline-offset-2">利用規約</a>および<a href="{privacy}" target="_blank" class="text-primary underline underline-offset-2">プライバシーポリシー</a>に同意します。',
        'auth.error.invalid-credentials': 'メールアドレスまたはパスワードが正しくありません。',
        'auth.error.email-not-confirmed': 'メール認証がまだ完了していません。受信トレイをご確認ください。',
        'auth.error.exists': 'このメールアドレスはすでに登録されています。ログインしてください。',
        'auth.error.weak-password': 'パスワードが単純すぎます。8文字以上で、より複雑なものにしてください。',
        'auth.error.rate-limit': 'リクエストが多すぎます。しばらくしてからもう一度お試しください。',
        'auth.error.generic': '問題が発生しました。しばらくしてからもう一度お試しください。',
        'auth.invalid.email': '有効なメールアドレスを入力してください。',
        'auth.invalid.password': 'パスワードは8文字以上にしてください。',
        'auth.invalid.mismatch': 'パスワードが一致しません。',
        'auth.invalid.consent': '利用規約とプライバシーポリシーに同意してください。',
        'auth.confirm-sent': '{email} に認証メールを送信しました。メール内のリンクをクリックすると登録が完了します。',

        'app.logout': 'ログアウト',
        'app.usage': '今月の有料 {used} / {limit}',
        'app.start.title': 'ベータテストへようこそ',
        'app.start.desc': '開示データの原本に自然な言葉で質問し、<br>SQLで取得した結果を表ですぐに確認できます。',
        'app.start.button': 'ベータテストを始める',
        'app.pending.title': '承認をお待ちください',
        'app.pending.desc': 'ベータ参加の申し込みを受け付けました。<br>承認され次第、すぐにご利用いただけます。',
        'app.pending.refresh': '承認状況を確認',
        'app.pending.hint': 'まだ承認待ちです。',
        'app.blocked.title': '利用が制限されているアカウントです',
        'app.contact': 'お問い合わせ',
        'app.error.title': 'サービスに接続できませんでした',
        'app.retry': 'もう一度試す',
        'app.query.title': '何を知りたいですか？',
        'app.query.placeholder': '例：サムスン電子の直近4四半期の営業利益の推移',
        'app.query.hint': 'Enterで送信 · Shift+Enterで改行',
        'app.query.submit': '質問を送信',
        'app.tier.label': '回答方式',
        'app.tier.free': '無料',
        'app.tier.paid': '有料',
        'app.history.more': '以前の質問をもっと見る',
        'app.history.failed': '以前の質問を読み込めませんでした · もう一度試す',

        'app.err.generic': '問題が発生しました。しばらくしてからもう一度お試しください。',
        'app.err.network': 'ネットワーク接続をご確認ください。',
        'app.err.paid-unavailable': 'このアカウントでは有料方式を利用できません。',
        'app.err.monthly-limit': '今月の有料質問の上限（{limit}回）に達しました。無料方式に切り替えると引き続き質問でき、有料の上限は毎月1日午前0時（韓国時間）にリセットされます。',
        'app.err.rate-limit': 'リクエストが多すぎます。しばらくしてからもう一度お試しください。',
        'app.err.unavailable': 'サービスが一時的に不安定です。しばらくしてからもう一度お試しください。',
        'app.err.answer': '回答を生成できませんでした。しばらくしてからもう一度お試しください。',

        'result.loading.analyzing': '質問を分析しています…',
        'result.loading.querying': 'データを取得しています… {s}秒',
        'result.loading.waiting': 'もう少々お待ちください… {s}秒',
        'result.request-id.copy': 'リクエストIDをコピー',
        'result.copied': 'コピーしました',
        'result.copy-failed': 'コピーに失敗しました',
        'result.not-found': '結果が見つかりませんでした。質問を少し変えてもう一度お試しください。',
        'result.currency': '金額の通貨',
        'result.unconverted.mixed': '複数の通貨が混在する値のため換算していません',
        'result.unconverted.unknown': '通貨を特定できなかったため換算していません',
        'result.unconverted.no-rate': '{currency} の為替レートがないため換算していません',
        'result.rows': '{n}行',
        'result.rows.top': '上位{n}行',
        'result.rows.of': '{total}行中{n}行',
        'result.csv': 'CSVをコピー',
        'result.sql.show': 'SQLを表示',
        'result.sql.hide': 'SQLを隠す',
        'result.empty': '条件に合うデータがありません。',
        'result.locked': '残りの{n}行は有料プランでご覧いただけます。',
        'result.more': 'さらに{n}行を表示',
        'result.load-all': 'すべて読み込む',
        'result.load-all.hint': '結果が{n}行を超えています。すべて読み込むと時間がかかり、画面が重くなることがあります。',
        'result.load-all.loading': '読み込み中…',
        'result.load-all.failed': 'すべての結果を読み込めませんでした。しばらくしてからもう一度お試しください。',
        'result.truncated': '結果が多いため上位{n}行のみ表示しています。条件を絞り込むとすべての結果を確認できます。',
    },
};

export function t(key, vars = {}) {
    const text = STRINGS[lang][key] ?? STRINGS.ko[key] ?? key;
    return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? vars[name] : match));
}

// Static markup: data-i18n (text), data-i18n-html (trusted markup from STRINGS),
// data-i18n-placeholder, data-i18n-aria-label
export function applyI18n(root = document, vars = {}) {
    root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n, vars); });
    root.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml, vars); });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder, vars); });
    root.querySelectorAll('[data-i18n-aria-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel, vars)); });
}

// KO / EN / JA buttons; picking one reloads the page in that language
export function langSwitch(container) {
    container.replaceChildren(...LANGS.map(code => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = code.toUpperCase();
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', String(code === lang));
        btn.addEventListener('click', () => { if (code !== lang) setLang(code); });
        return btn;
    }));
}
