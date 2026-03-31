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

## 계획 보강 (2026-03-31)

### 추가 축 1. JS 완전 모듈화

- 목표:
  - 남아 있는 page-local inline script 를 모두 bundle/bootstrap 구조로 이동
  - public/admin 공용 `window.*` 의존을 최소화
  - admin plain script 구조도 단계적으로 module entry 기반으로 전환
- 주요 대상:
  - [layouts/products/single.html](/C:/hugo/ex/shop/layouts/products/single.html)
  - [assets/js/cart.js](/C:/hugo/ex/shop/assets/js/cart.js)
  - [assets/js/admin-orders.js](/C:/hugo/ex/shop/assets/js/admin-orders.js)
  - [assets/js/admin-posts.js](/C:/hugo/ex/shop/assets/js/admin-posts.js)
  - [assets/js/admin-products.js](/C:/hugo/ex/shop/assets/js/admin-products.js)
- 완료 기준:
  - 템플릿에 남은 의미 있는 inline runtime script 제거
  - `window.Cart`, `window.AdminAuth`, `window.PBClient` 등 필요한 전역만 최소 범위로 유지
  - 페이지 초기화는 `main.js` 혹은 명시적 module entry 에서만 수행

### 추가 축 2. ESLint 규칙 강화

- 목표:
  - 전역 의존과 암묵적 변수 참조를 lint 단계에서 더 빨리 차단
  - 모듈 전환과 함께 globals whitelist 를 단계적으로 축소
- 규칙 방향:
  - `no-undef` 는 현재처럼 `error` 로 유지
  - `no-global-assign` 를 `error` 로 추가
  - 필요 시 admin/public 별 overrides 로 전역 허용 범위를 분리
- 완료 기준:
  - [.eslintrc.json](/C:/hugo/ex/shop/.eslintrc.json) 의 globals 목록이 실제 필요한 런타임 전역만 남도록 축소
  - lint 통과가 전역 누수와 잘못된 할당을 잡아내는 수준으로 강화

### 추가 축 3. Tailwind 기반 통일

- 목표:
  - Bootstrap 제거 이후 남은 legacy class, inline style, page-local style block 을 줄이고 Tailwind 기준으로 통일
  - 모바일 사용성과 component consistency 를 함께 맞춘다
- 주요 대상:
  - [layouts/products/single.html](/C:/hugo/ex/shop/layouts/products/single.html)
  - [layouts/partials/cart-drawer.html](/C:/hugo/ex/shop/layouts/partials/cart-drawer.html)
  - admin modal / table shell
  - 남은 page-local `<style>` 블록
- 완료 기준:
  - public 화면은 Tailwind + theme CSS 중심으로 일관성 확보
  - admin 화면도 utility/class 기준이 정리되어 Bootstrap-era shell 흔적 최소화
  - 모바일 터치 타깃, spacing, safe-area 대응이 공통 기준으로 정리
