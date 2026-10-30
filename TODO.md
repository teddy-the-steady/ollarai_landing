# TODO

우선순위: **P-1** 토스·Paddle 신청 전 → **P0** 무료 버전 배포 전 필수 → **P1** 배포 전 권장 → **P2** 결제 도입 전 → **P3** 이후 개선

서버 코드는 `../ollarai_backend` (API: `service_pipeline/server.py`)에 있습니다.

## 진행 상황 (2026-10-30 기준)

- 통신판매업 신고 진행 중
- 신고가 끝나면(2026-11-02 주 예정) 토스페이먼츠·Paddle 가입 신청

## 결정 사항 (2026-10-30)

- **승인 방식**: P0·P1 배포 준비가 끝나면 수동 승인을 걷어내고 자동 승인으로 전환. 약관·처리방침도 자동 승인 기준으로 수정
- **약관·처리방침 시행일**: 결제판 2026-11-20 시행 유지. 결제가 밀려도 결제 버튼이 비활성이면 적용받는 회원이 없어 문제 되지 않고, 결제 시작 때 다시 공지할 필요가 없으며, PG 심사에도 게시본이 필요함. PG 심사에서 약관 수정을 요구하면 그때 재개정(공지 7일, 불리하면 30일)

## P-1. 토스·Paddle 신청 전 (2026-11-02 주)

- [x] **사이트 하단에 사업자 정보 표시** (전자상거래법 제10조, PG 심사 확인 항목): 상호, 대표자, 주소, 전화번호, 이메일, 사업자등록번호, 통신판매업 신고번호, 공정위 사업자정보 확인 링크 (ko/en/ja)
  - 랜딩: `src/main.js`의 `footer-company`
  - 요금 안내·약관·처리방침: 각 페이지 푸터의 `#footer-business`
- [x] **전화번호 게시**: 위 푸터와 약관 제3조 사업자 정보(3개 언어)
- [ ] **통신판매업 신고번호 게시**: 신고가 끝나면 "신고 진행 중"(en: registration in progress, ja: 申告手続中)을 번호로 바꾸기
  - 약관 제3조: `terms/index.html`, `en/terms/index.html`, `ja/terms/index.html`
  - 푸터: `src/main.js`의 `footer-company` 3개 언어, 6개 페이지(`pricing`, `terms`, `privacy` × ko/en/ja)의 `#footer-business`
  - 바꾼 뒤 푸터의 공정위 "사업자정보 확인" 링크가 신고 정보를 제대로 보여주는지 확인

## P0. 무료 버전 배포 전 필수

- [ ] **약관·처리방침 11/20판 게시: 2026-11-13까지 배포** (시행 7일 전 공지, 약관 제3조 제3항). 수정은 반영 완료 (ko/en/ja)
  - 약관: 제2조 회원·계정에 Google 계정 포함, 결과물에서 SQL 제외 / 제5조 운영자 승인 삭제(이메일 또는 Google 인증으로 성립), 승인 인원·시기 조항 삭제 / 제7조 "SQL 보기" 삭제 / 제16조 계정에 Google 계정 / 개정 이력
  - 처리방침: 한눈에 보기·제2조 Google 로그인 항목과 화면 언어 / 제1조 "베타 이용 승인" 삭제 / 제2조 이용 횟수(무료 일별, 유료 월별) / 제6조·제7조 Supabase 업무·이전 항목 / 제10조 로컬 스토리지 항목과 Google 로그인 쿠키 / 제11조 한도 문구 / 개정 이력
  - 처리방침의 토스·Paddle 기재는 계약 전이라 실제보다 앞서 있음. 결제가 많이 밀리면 해당 항목만 빼는 것도 검토
- [ ] **수동 승인 걷어내기**: P0·P1 작업이 끝난 뒤 전환. 약관상 11/20부터는 자동 승인이므로 늦어도 그때까지
  - 서버는 준비 완료: `infra/env.sh AUTO_APPROVE_USERS=true`. 새 계정은 approved, 기존 pending 계정은 다음 요청 때 approved, blocked는 그대로
  - 앱 start/pending 화면 정리 (`src/app.js` `routeByStatus`, `src/beta/i18n.js` `app.start.*`, `app.pending.*`)
  - 랜딩 CTA 문구 "베타 참여하기"(`src/main.js` `cta`, `hero-cta`)를 "무료로 시작하기"로. 버튼은 이미 `/app/?lang=…`로 연결돼 있음. 사전등록 폼을 남길지도 이때 결정
  - 자동 승인 전에 P3 가입 CAPTCHA 검토
- [ ] **서버·프론트 변경 배포**
  1. 앱 DB 마이그레이션: `python src/app_db/migrations/0005_free_daily_usage.py` (서버 코드 배포 **전에**)
  2. 내부 계정 지정: `infra/env.sh INTERNAL_USER_IDS=<run_ai_beta 테스트 계정의 Supabase user id>[,운영자 id]`. 빠지면 `run_ai_beta.py`가 SQL·trace를 못 받음
  3. 선택: `FREE_DAILY_QUERY_LIMIT`(기본 100), `QUESTION_MAX_CHARS`(기본 500), `HISTORY_RETENTION_DAYS`(기본 180). `ENABLE_API_DOCS`는 운영에서 설정하지 않기
  4. `infra/deploy.sh` (180일 삭제 타이머 `ollarai-purge-expired`도 설치) → 프론트 배포
  5. 사전등록 Lambda: `mail_backend/.env`에 `ALLOWED_ORIGIN=https://ollarai.com` 넣고 재배포
- [x] **API 응답에서 내부 정보 빼기** (서버): 내부 계정(`INTERNAL_USER_IDS`)이 아니면 `/query`·`/history` 본문을 화면이 쓰는 필드만 남김 (`server.py` `_public_body`). history에는 전체 본문 저장. `debug`/`trace`도 내부 계정만, 503 detail과 history의 error는 `message`만
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

## P2. 결제 도입 전 (통신판매업 신고 → 토스·Paddle 가입 후)

- [ ] **결제 버튼 비활성 유지**: 결제 흐름과 아래 고지가 갖춰질 때까지 "결제 준비 중" 유지 (11/20 시행판이어도 결제가 없으면 적용받는 회원이 없음)
- [ ] **결제 화면에 고지와 동의 넣기**: 약관에 "결제 화면에서 알리고 동의받는다"고 적었으므로 아래 항목이 화면에 실제로 있어야 함. 결제 버튼은 아직 "결제 준비 중"(비활성)이고, 토스페이먼츠·Paddle 결제 흐름을 붙일 때 함께 넣기
  - 요금, 결제 주기, 자동 갱신 사실, 해지 방법 (약관 제9조 제2항). 요금 안내 화면에는 있음, 결제 직전 화면에도 다시 보여 주기
  - 유료 방식을 이용하면 청약철회가 제한된다는 안내 (약관 제12조 제2항). 요금 안내·구독 관리 화면에는 있음, 결제 직전 화면에도 넣기
  - 해외 결제 시 Paddle 제공·국외 이전 동의 체크박스 (처리방침 제5조, 제7조)
  - 만 19세 미만 법정대리인 동의 안내 (약관 제13조)
- [ ] **Paddle 가입 시 확인할 것**
  - 데이터를 처리하는 국가: 처리방침에는 우선 영국으로 적어 둠
  - 환불 정책과 구매자 약관 URL(`https://www.paddle.com/legal/checkout-buyer-terms`)이 약관 제8조, 제12조와 맞는지
  - Paddle 구독 해지 연동: 서버 `billing.py`의 `_Paddle`은 아직 미구현(503)
- [ ] **운영 수치 검토**: 장애 보상(연속 4시간 이상 장애 시 이용 기간 3배 연장, 약관 제15조)과 7일 환불(약관 제12조)은 업계에서 흔히 쓰는 기준으로 넣은 값. 운영 방침에 맞게 조정하기
- [ ] **법률 전문가 검토**: 결제를 시작하기 전에 약관과 처리방침 받아보기

## P3. 이후 개선

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
