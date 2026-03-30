# 2026-03-30 Remediation Plan

## 목표

- 리뷰에서 확인된 보안, 배포, 런타임 로딩 문제를 실제 수정 가능한 단위로 정리한다.
- 1차 실행 범위는 `auth/security`, `product runtime bootstrap`, `build/backup hygiene` 로 제한한다.
- 이후 단계에서 CSP 강화와 생성물 정리 PR로 확장한다.

## 우선순위

1. 라이브 DB가 저장소에 포함되는 경로 차단
2. 상품 상세와 프로필의 raw ES module 로딩 제거
3. 로그인 redirect 검증과 닉네임 race condition 수정
4. build/dev 출력 경로 분리 및 release preflight 도입

## 1차 실행 범위

### Auth / Security

- `assets/js/auth.js`
  - `auth_redirect` 를 `sessionStorage` 로 이동
  - same-origin 상대경로만 허용
  - 닉네임 검증 stale response 무시
  - submit 시 `nickname === checkedNickname` 강제

### Frontend Runtime

- `assets/js/main.js`
  - bundle 내부에서 product/profile bootstrap 수행
- `layouts/partials/product-detail-qna.html`
  - raw `qna.js` classic script 제거
- `layouts/products/single.html`
  - raw `reviews.js` classic script 제거
- `layouts/profile/single.html`
  - raw `profile.js` classic script 제거
- `assets/js/profile.js`
  - auto-init 제거
- `assets/js/script.js`
  - 중복 product slider 초기화 제거

### Build / Repository Hygiene

- `scripts/create-essential-backup.mjs`
  - live DB 파일 백업 대상 제외
- `.gitignore`
  - `server/`, `backup/`, temp verify 디렉터리, `docs/pb_data/` 제외
- `package.json`
  - clean build를 기본화
  - `dev` 출력 디렉터리를 `.hugo-dev` 로 분리
  - `preflight:release` 추가
- `scripts/check-release-safety.mjs`
  - `localhost`, `127.0.0.1`, `livereload.js`, DB 스냅샷 검출

## 후속 단계

### 2차

- `server/` 추적 정책 재정의
- 기존 커밋 생성물 정리
- clean build 산출물만 남도록 브랜치 정리

### 3차

- CSP 현실화
- `window.SiteConfig`, `window.ShopConfig` 노출 범위 재검토
- admin/data flow 검증 강화
