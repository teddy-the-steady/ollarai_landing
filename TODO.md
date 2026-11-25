# TODO

우선순위: **P-1** PG(포트원)·Paddle 신청 전 → **P0** 무료 버전 배포 전 필수 → **P1** 배포 전 권장 → **P2** 결제 도입 전 → **P3** 이후 개선

서버 코드는 `../ollarai_backend` (API: `service_pipeline/server.py`)에 있습니다.

## 진행 상황 (2026-11-05 기준)

- 통신판매업 신고 완료: 신고번호 2026-강원강릉-0425
- 토스페이먼츠 입점 거절 (2026-11-05): 랜딩의 목표가 산출, 종목 비교·분석, 수익 전환 문구를 보고 투자정보 제공·유사투자자문 형태로 판단. 가입비·연관리비 환불은 메일 회신으로 요청
  - 대응: 랜딩에서 해당 문구·섹션 제거, 하단에 투자자문 아님 고지 추가, 약관·처리방침·요금 안내의 토스 기재를 "국내 결제대행사(PG)"로 일반화
- Paddle 사용 중단 (2026-11-25): 해외 결제는 다른 서비스로 교체 예정. 프론트의 Paddle 코드는 제거했고 en/ja 결제 버튼은 "Coming soon"/"近日公開"로 막아 둠
- Creem 승인 (2026-11-25): 해외(USD) 결제를 Creem(Armitage Labs OÜ, 에스토니아, Merchant of Record)으로 연동. 코드·약관·처리방침은 반영, 아래 P2 "해외 결제 교체"의 남은 항목(대시보드 설정·배포) 필요
- 다음: 수정분 배포 → 포트원 문의(PG 일괄 신청)

## 결정 사항 (2026-10-30)

- **승인 방식**: P0·P1 배포 준비가 끝나면 수동 승인을 걷어내고 자동 승인으로 전환. 약관·처리방침도 자동 승인 기준으로 수정
- **약관·처리방침 시행일**: 결제판 2026-11-20 시행 유지. 결제가 밀려도 결제 버튼이 비활성이면 적용받는 회원이 없어 문제 되지 않고, 결제 시작 때 다시 공지할 필요가 없으며, PG 심사에도 게시본이 필요함. PG 심사에서 약관 수정을 요구하면 그때 재개정(공지 7일, 불리하면 30일)

## P-1. PG(포트원)·Paddle 신청 전 (2026-11-02 주)

- [x] **사이트 하단에 사업자 정보 표시** (전자상거래법 제10조, PG 심사 확인 항목): 상호, 대표자, 주소, 전화번호, 이메일, 사업자등록번호, 통신판매업 신고번호, 공정위 사업자정보 확인 링크 (ko/en/ja)
  - 랜딩: `src/main.js`의 `footer-company`
  - 요금 안내·약관·처리방침: 각 페이지 푸터의 `#footer-business`
- [x] **전화번호 게시**: 위 푸터와 약관 제3조 사업자 정보(3개 언어)
- [x] **통신판매업 신고번호 게시**: "신고 진행 중"(en: registration in progress, ja: 申告手続中)을 `2026-강원강릉-0425`로 교체 (약관 제3조 ko/en/ja, 랜딩 `footer-company` 3개 언어, `pricing`·`terms`·`privacy` × ko/en/ja 푸터)
- [ ] **게시분 배포**: PG 심사는 실제 사이트를 보므로 신고번호·푸터·요금 안내·약관이 운영 사이트에 떠 있어야 함
  - 배포 후 공정위 "사업자정보 확인" 링크에 통신판매업 신고 정보가 뜨는지 확인 (반영까지 며칠 걸릴 수 있음)
- [ ] **신청 서류 준비**: 사업자등록증, 통신판매업 신고증, 대표자 신분증, 정산 계좌 사본(사업자 명의 또는 대표자 명의)
- [x] ~~토스페이먼츠 신청~~: 2026-11-05 입점 거절 (위 진행 상황)
- [ ] **포트원 문의·PG 신청**: 업종은 "SaaS, 공시 재무 데이터 조회 도구"로, 투자 자문·종목 추천이 아님을 분명히. 카드 일반결제가 아니라 **자동결제(빌링)** 사용을 명시. 토스 거절 사실과 지적받은 문구를 고쳤다는 점은 물어보면 그대로 설명. 심사용 테스트 계정 하나 준비
  - [x] 처리방침(ko/en/ja) 제6조 수탁자 표를 (주)코리아포트원·(주)케이지이니시스로 나눠 기재, 한눈에 보기·11/20 개정 이력에도 업체명 반영 (11/20판 시행 전이라 같은 판에 반영)
  - [ ] 서버 구독 `provider` 값은 `portone` 기준 (`src/beta/i18n.js` `account.provider.portone`)
  - [x] **KG이니시스 심사용 결제창 연동** (심사 요건 5번: 구매 시 이니시스 결제창, 신용카드 필수): 한국어 요금 안내 "구독하기" → 로그인 확인 → 고지·동의 + 이름·휴대폰 번호 → 포트원 V2 SDK `requestIssueBillingKey`(KG이니시스 빌링키, 모바일은 `/pricing/?billingKey=`로 복귀) → 서버 `POST /subscription/portone`이 첫 달 9,900원 결제 후 구독 생성 → `/account/`. 매월 갱신은 서버 `common/renew_portone.py`(매일 00:30 KST 타이머, 실패 3회면 만료·빌링키 삭제)
    - [x] 포트원 콘솔: KG이니시스 테스트 채널(`INIBillTst`)로 연동·심사 진행
    - [x] 서버: 마이그레이션 `0011_subscription_portone.py`, `PORTONE_API_SECRET`·`PORTONE_STORE_ID`, 배포
    - [x] **실연동 전환 (2026-11-17)**: 콘솔 실연동 채널(실제 정기결제 MID) → `VITE_PORTONE_CHANNEL_KEY` 교체·프론트 배포. 서버는 테스트 채널 빌링키를 구독 시작·갱신에서 거부(개발 서버만 `PORTONE_ALLOW_TEST=true`), 주문명 "올라AI Pro 1개월"
    - [ ] 테스트 구독 정리: EC2에서 `python -m common.purge_test_portone --apply` (dry run 결과 subscription 16 한 건) → 다시 dry run해 `0 from the test channel` 확인
    - [ ] 카드사 심사 완료 후 이니시스에 카드사별 개통 여부 확인
    - [ ] 본인 카드로 PC·모바일 실결제 9,900원 → 포트원 콘솔·이니시스 상점관리자 승인 확인 → 콘솔에서 결제 취소, `/account/` 해지·빌링키 삭제 확인
    - [ ] 첫 실결제 한 달 뒤 00:30 KST 갱신 로그(CloudWatch, `[portone] renewed=1`) 확인
    - [x] 처리방침(ko/en/ja) 제2조 국내 결제 항목·수집 방법, 안내 문단(운영자 미저장, 결제 요청 시 포트원에서 불러옴), 제3조 보유 기간, 11/20 개정 이력에 구매자 이름·휴대폰 번호 추가 (11/20판에 포함 - 공지 기간 3일)
- [x] ~~**Paddle 신청**~~ (Paddle 중단, 2026-11-25 Creem 승인): 도메인 심사에서 요금·약관·환불·처리방침 페이지(en)를 확인함. 서비스 설명은 "공시 데이터 조회·분석 도구"로 쓰고 투자 자문이 아님을 분명히 (금융 관련 업종은 추가 확인 대상)

## P0. 무료 버전 배포 전 필수

- [ ] **약관·처리방침 11/20판 게시: 2026-11-13까지 배포** (시행 7일 전 공지, 약관 제3조 제3항). 수정은 반영 완료 (ko/en/ja)
  - 약관: 제2조 회원·계정에 Google 계정 포함, 결과물에서 SQL 제외 / 제5조 운영자 승인 삭제(이메일 또는 Google 인증으로 성립), 승인 인원·시기 조항 삭제 / 제7조 "SQL 보기" 삭제 / 제16조 계정에 Google 계정 / 개정 이력
  - 처리방침: 한눈에 보기·제2조 Google 로그인 항목과 화면 언어 / 제1조 "베타 이용 승인" 삭제 / 제2조 이용 횟수(무료 일별, 유료 월별) / 제6조·제7조 Supabase 업무·이전 항목 / 제10조 로컬 스토리지 항목과 Google 로그인 쿠키 / 제11조 한도 문구 / 개정 이력
  - 처리방침의 국내 결제대행사·Paddle 기재는 계약 전이라 실제보다 앞서 있음. 결제가 많이 밀리면 해당 항목만 빼는 것도 검토
- [ ] **수동 승인 걷어내기**: P0·P1 작업이 끝난 뒤 전환. 약관상 11/20부터는 자동 승인이므로 늦어도 그때까지
  - 서버는 준비 완료: `infra/env.sh AUTO_APPROVE_USERS=true`. 새 계정은 approved, 기존 pending 계정은 다음 요청 때 approved, blocked는 그대로
  - 앱 start/pending 화면 정리 (`src/app.js` `routeByStatus`, `src/beta/i18n.js` `app.start.*`, `app.pending.*`)
  - [x] 랜딩 CTA 전부 "무료로 시작하기"/"지금 무료로 써보기" → `/app/`, 하단 사전등록 이메일 폼 제거, 로그인·가입 부제에서 "베타 신청" 문구 제거 (ko/en/ja)
  - 앱 start/pending 화면은 자동 승인이면 새 유저에게 보이지 않아 그대로 둠
  - 가입 CAPTCHA는 배포 후 가입 추이를 보고 결정 (P3)
- [ ] **배포 후: 사전등록자 처리** (처리방침 제3조 "출시 안내 완료 시까지")
  - DynamoDB `ollarai-email-subscribers-prod`의 사전등록자에게 출시 안내 메일 발송(`lang`별)
  - 발송 후 테이블 데이터 삭제, 사전등록 Lambda(`mail_backend`, `serverless remove`) 내리기
  - 다음 처리방침 개정 때 사전등록 항목(제1조, 제2조, 제3조, 제6조 AWS 업무) 삭제
- [ ] **서버·프론트 변경 배포**
  1. 앱 DB 마이그레이션: `0005_free_daily_usage.py`, `0006_users_is_internal.py`, `0007_event_credits.py` (`python src/app_db/migrations/<파일>`, 서버 코드 배포 **전에**)
  2. 내부 계정 지정: 앱 DB에서 `UPDATE users SET is_internal = true WHERE email IN ('<run_ai_beta 테스트 계정>', '<운영자>');`. 빠지면 `run_ai_beta.py`가 SQL·trace를 못 받고 무료 일일 한도에 걸림
  3. 자동 승인과 출시 이벤트: `infra/env.sh --no-apply AUTO_APPROVE_USERS=true EVENT_CREDITS=100 EVENT_CREDIT_DAYS=30` (4번 deploy에서 적용)
     - 이벤트 숫자를 바꾸면 요금 안내 배너(ko/en/ja `pricing/index.html`의 "출시 기념 이벤트")도 같이 고치기
     선택: `FREE_DAILY_QUERY_LIMIT`(기본 100), `QUESTION_MAX_CHARS`(기본 500), `HISTORY_RETENTION_DAYS`(기본 180). `ENABLE_API_DOCS`는 운영에서 설정하지 않기
  4. `infra/deploy.sh` (180일 삭제 타이머 `ollarai-purge-expired`도 설치) → 프론트 배포
  5. ~~사전등록 Lambda `ALLOWED_ORIGIN`~~: 폼을 없앴으므로 대신 배포 후 Lambda를 내림 (아래 "사전등록자 처리")
- [x] **API 응답에서 내부 정보 빼기** (서버): 내부 계정(`users.is_internal`)이 아니면 `/query`·`/history` 본문을 화면이 쓰는 필드만 남김 (`server.py` `_public_body`). history에는 전체 본문 저장. `debug`/`trace`도 내부 계정만, 503 detail과 history의 error는 `message`만
- [x] **화면에서 SQL 보기·요청 ID 제거** (프론트): `src/app.js`, 관련 문구·CSS, 요금 안내 무료 플랜의 "생성된 SQL 보기"(ko/en/ja), 약관 제7조
- [x] **500 에러에 예외 원문 노출** (서버): 응답은 "Internal server error", 원문은 로그와 history에만
- [x] ~~**랜딩에서 앱으로 가는 진입점 만들기**~~: 점검 오류. 상단·히어로 버튼이 JS로 `/app/`에 연결돼 있었음. 문구 변경은 "수동 승인 걷어내기"로 옮김
- [x] **무료 이용 한도와 질문 길이 제한** (서버+프론트)
  - 무료 계정 하루 100회(한국 시간 0시 초기화, `FREE_DAILY_QUERY_LIMIT`, 테이블 `free_query_usage`). 유료 계정의 무료 방식과 내부 계정은 제외, 결과가 없으면 환불. 초과 시 429 + 안내 문구(ko/en/ja)
  - 질문 1~500자(`QUESTION_MAX_CHARS`), textarea `maxlength="500"`
  - 요금 안내(ko/en/ja): 무료 플랜 "하루 100회까지 질문", 이용 한도 섹션에 무료 일일 한도 설명

## P1. 배포 전 권장

- [x] **FastAPI 문서 끄기** (서버): `/docs`, `/redoc`, `/openapi.json`은 `ENABLE_API_DOCS`를 설정했을 때만 열림
- [x] **생성 SQL의 시스템 카탈로그 접근 막기** (서버): `check_statement_is_safe`가 `pg_catalog`·`information_schema`·`pg_` 이름 테이블과 `current_setting`·`version` 등 서버 정보 함수를 거부 (허용 목록 대신 거부 방식: 새 테이블이 생겨도 유지할 목록이 없음)
- [x] **질문 기록 180일 삭제 구현** (서버): `common/purge_expired_records.py` + `infra/purge_expired.sh` + systemd 타이머(매일 03:00 KST). 지난 무료 일일 카운트도 함께 삭제
- [x] **처리방침에 Google 로그인 반영** (ko/en/ja): P0 약관·처리방침 11/20판 항목에 포함
- [x] **처리방침 세부를 실제와 맞추기** (ko/en/ja): P0 약관·처리방침 11/20판 항목에 포함
- [ ] **무료 결과의 잠금 안내 문구**: 20행 초과분 "유료 플랜에서 볼 수 있어요"를 누르면 `/pricing/`으로 가는데 버튼이 "결제 준비 중". 결제 전까지 문구를 바꾸거나 CTA 숨기기

## P2. 결제 도입 전 (통신판매업 신고 → PG·Paddle 가입 후)

- [ ] **출시 이벤트 종료** (결제 시작할 때): `infra/env.sh EVENT_CREDITS=0`으로 새 지급 중단(이미 받은 크레딧은 기간까지 유지), 요금 안내의 이벤트 배너 제거 (ko/en/ja)
- [ ] **결제 버튼 비활성 유지**: 결제 흐름과 아래 고지가 갖춰질 때까지 "결제 준비 중" 유지 (11/20 시행판이어도 결제가 없으면 적용받는 회원이 없음)
- [ ] **결제 화면에 고지와 동의 넣기**: 약관에 "결제 화면에서 알리고 동의받는다"고 적었으므로 아래 항목이 화면에 실제로 있어야 함. 결제 버튼은 아직 "결제 준비 중"(비활성)이고, 국내 PG·Paddle 결제 흐름을 붙일 때 함께 넣기
  - 요금, 결제 주기, 자동 갱신 사실, 해지 방법 (약관 제9조 제2항). 요금 안내 화면에는 있음, 결제 직전 화면에도 다시 보여 주기
  - 유료 방식을 이용하면 청약철회가 제한된다는 안내 (약관 제12조 제2항). 요금 안내·구독 관리 화면에는 있음, 결제 직전 화면에도 넣기
  - 해외 결제 시 Creem 제공·국외 이전 동의 체크박스 (처리방침 제5조, 제7조) - en/ja 대화상자에 넣음
  - 만 19세 미만 법정대리인 동의 안내 (약관 제13조)
- [ ] **해외 결제 교체** (Paddle → Creem): 흐름은 en/ja "Subscribe" → 로그인·구독 여부 확인 → 고지·동의 3개(결제, Creem 제3자 제공, 국외 이전) → 서버 `POST /subscription/creem`이 Creem 결제창 생성(`metadata.user_id`, `request_id` = 회원 id) → Creem 결제 → `/thanks/`. 구독 반영은 웹훅 `POST /webhooks/creem`(`creem-signature` HMAC), 해지·해지 취소는 Creem API(`mode: scheduled` / `resume`), `/account/` "결제 수단 변경"은 Creem 고객 포털
  - [x] 프론트: `src/pricing.js` 해외 결제 분기, en/ja 버튼 활성화, 대화상자 MoR 안내와 Creem 동의 2개, `/account/` 결제 수단 변경 버튼·`account.provider.creem` 문구
  - [x] 서버: `service_pipeline/creem.py`(API·웹훅), `billing.py` `_Creem`, `app_db.apply_creem_subscription`, 마이그레이션 `0014_subscription_creem.py`, Caddy 허용 목록 예외 `/webhooks/creem`, Paddle 코드·테스트 삭제 (`tests/test_creem.py`)
  - [x] 약관·처리방침(ko/en/ja) 2026-11-25 개정을 "Paddle → Creem 변경"으로 (회원이 없어 공지 기간 없이 당일 시행): 약관 제8조·제9조·제12조, 처리방침 한눈에 보기·제2조·제5조·제7조·제10조의 Paddle을 Creem(Armitage Labs OÜ, 에스토니아, https://creem.io/privacy, 구매자 약관 https://creem.io/buyer-terms)으로, 한국어 요금 안내도. 11/20본은 `/terms/2026-11-20/`, `/privacy/2026-11-20/`에 보관
  - [ ] Creem 대시보드(테스트 모드 먼저): Pro 상품(USD 7.99, 매월) → `CREEM_PRODUCT_ID`, API 키 → `CREEM_API_KEY`(`creem_test_`면 테스트 API), 웹훅 `https://<API_DOMAIN>/webhooks/creem` → `CREEM_WEBHOOK_SECRET`. 서버 반영 `infra/env.sh --no-apply CREEM_API_KEY CREEM_WEBHOOK_SECRET CREEM_PRODUCT_ID`, SSM의 옛 키는 `infra/env.sh --delete PADDLE_API_KEY PADDLE_WEBHOOK_SECRET`
  - [ ] 배포: 마이그레이션 `0014_subscription_creem.py` → `infra/deploy.sh`(Caddyfile 포함) → 테스트 카드로 결제 → 웹훅 로그 `[creem] ... -> subscription=` 확인, `/account/`에서 해지·해지 취소·결제 수단 변경 확인
  - [ ] 테스트 결제로 확인할 것(문서에 명시 없음): `subscription.*` 이벤트에 체크아웃 `metadata`가 복사되는지(없어도 `checkout.completed`로 회원을 찾음), 해지 취소 후 오는 이벤트가 `status: active`인지
  - [ ] 로그인 후 요금 안내로 돌아오기: 지금은 로그인하면 `/app/`으로 감
- [ ] **운영 수치 검토**: 장애 보상(연속 4시간 이상 장애 시 이용 기간 3배 연장, 약관 제15조)과 7일 환불(약관 제12조)은 업계에서 흔히 쓰는 기준으로 넣은 값. 운영 방침에 맞게 조정하기
- [ ] **법률 전문가 검토**: 결제를 시작하기 전에 약관과 처리방침 받아보기

## P3. 이후 개선

- [ ] **Pro 기획(스크리닝 중심)**: 방향, 구현 계획, 단계별 TODO는 [PRO_PLAN.md](PRO_PLAN.md)

- [ ] **회원 탈퇴 버튼**: 지금은 이메일 요청으로만 탈퇴 가능(약관 제18조, 처리방침 제9조). `/account/`에 셀프 탈퇴 추가
- [ ] **로그인 상태에서 비밀번호 변경**: `/account/`에 추가. Google 전용 계정 처리와 Supabase "Secure password change"(재인증) 여부 정하기
- [ ] **Supabase 설정 점검**
  - public 스키마에 테이블이 있다면 RLS 켜져 있는지 (anon key는 번들에 공개됨)
  - 가입 CAPTCHA(Turnstile): 자동 승인으로 가면 우선순위 올리기
  - 이메일 발송 rate limit
- [x] **사전등록 Lambda**: `lang`은 ko/en/ja만 저장(그 외는 ko), 이메일 254자 제한. `ALLOWED_ORIGIN` 설정은 P0 배포 단계 5번
- [ ] **API 도메인 확인**: 프로덕션 빌드가 `api-dev.ollarai.com`을 사용 중. 의도한 것인지 확인
- [ ] **결과 표 컬럼명**: `net_income` 같은 DB 컬럼명이 그대로 보임. 사용자용 이름으로 바꾸기 (UX)

## 완료

- [x] ~~**기존 회원에게 개정 이메일 통지**~~: 개정 시점에 기존 회원이 없어 보내지 않아도 됨
- [x] **구독 관리 화면 만들기**: `/account/`(ko/en/ja)에서 요금제·결제 수단·다음 결제일 확인, 한 번에 해지·해지 취소, 환불 안내 (약관 제11조)
- [x] **요금 안내 화면 만들기**: `/pricing/`, `/en/pricing/`, `/ja/pricing/`에 요금제, 요금, 이용 한도, 결제·해지 요약 게시 (약관 제7조, 제8조). 랜딩 푸터에 링크
- [x] **비밀번호 찾기**: `/login/`에서 재설정 메일 요청 → 새 비밀번호 설정, Reset Password 메일 템플릿(`supabase/templates/reset-password.html`, ko/en/ja)
