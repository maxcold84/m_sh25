# 2026-03-31 Overall Summary

## 목적

- 2026-03-30 코드리뷰 이후 수행한 보안, 배포, 런타임, UI 구조개편 작업을 한 문서로 요약한다.
- 현재 기준으로 무엇이 해결됐고, 무엇이 남았는지 빠르게 파악할 수 있게 정리한다.

## 기준 문서

- [code review summary](/C:/hugo/ex/shop/docs/changes/2026-03-30-code-review-summary.md)
- [remediation plan](/C:/hugo/ex/shop/docs/changes/2026-03-30-remediation-plan.md)
- [progress summary](/C:/hugo/ex/shop/docs/changes/2026-03-31-progress-summary.md)
- [review findings summary](/C:/hugo/ex/shop/docs/changes/2026-03-31-review-findings-summary.md)

## 핵심 결과

### 1. Review Finding 대응 상태

- `[P3] auth redirect open redirect`
  - 해결됨
  - `localStorage` 대신 `sessionStorage` 사용
  - same-origin 상대경로만 허용

- `[P0] backup includes live DB`
  - 해결됨
  - backup 대상에서 DB 파일 제거
  - 커밋된 DB snapshot 삭제
  - release preflight에 DB snapshot 검사 추가

- `[P1] server output points at localhost`
  - clean build / preflight 기준 해결됨
  - `server/` clean 후 build
  - dev/build 출력 분리
  - `localhost:1313`, `livereload.js` 가드 추가

- `[P1] qna module loaded as classic script`
  - 해결됨
  - raw script 제거
  - bundle bootstrap으로 전환

- `[P1] reviews init runs before module exists`
  - 해결됨
  - raw script 제거
  - bundle bootstrap으로 전환

### 2. 보안 / 배포 / 빌드 안정화

- auth redirect 검증 강화
- nickname race condition 완화
- live DB 백업/커밋 경로 차단
- `pnpm build` / `pnpm preflight:release` 기준선 확립
- `server/` 산출물의 dev contamination 방지 장치 도입

### 3. JS 구조 개선

- page-local inline script를 점진적으로 module/bootstrap 구조로 이동
- product detail / homepage products / product list / blog reading progress / related products 정리
- admin scripts를 ES module import 기반으로 전환
- 프로젝트가 만든 `window.*` 전역 제거
  - `window.SiteConfig`, `window.ShopConfig`
  - `window.PBClient`, `window.AdminAuth`, `window.AdminFeedback`
  - `window.Cart`
  - 기타 public compatibility globals

### 4. UI / Frontend 정리

- public 기준 Bootstrap runtime 제거
- Tailwind 중심 public 레이아웃 확장
- checkout / cart / auth / profile / product detail 모바일 사용성 개선
- admin feedback를 browser 기본 dialog 대신 custom UI로 전환
- jQuery/slick 의존 제거, native scroll/scroll-snap 기반으로 단순화

## 단계별 요약

### Phase 1. Review Hotfix

- `auth.js` redirect 및 signup validation 수정
- `qna.js`, `reviews.js`, `profile.js` raw script 제거
- backup script와 release preflight 정리

### Phase 2. Public / Admin 경계 정리

- admin base 분리
- public Bootstrap CSS/JS 제거
- Tailwind 중심 public layout 확장

### Phase 3. Inline Handler / Module 전환

- cart / header / auth links / profile / checkout / qna inline handler 제거
- homepage products, product list, blog progress, related products bundle화
- product detail cart 로직 module화

### Phase 4. Global / Runtime Cleanup

- runtime config를 JSON script + reader 구조로 전환
- admin auth / feedback / login / orders / posts / products 모듈화
- app-owned `window.*` 전역 제거
- admin pages를 bundle 로드로 전환

### Phase 5. External Global 축소

- `jQuery/$` 와 slick 제거
- native scroller / scroll-snap 기반으로 전환
- 현재 남은 외부 전역은 `daum`, `globalThis.tailwind`, `Mailcheck`, `PortOne` 범주

## 현재 기준 완료된 것

- review findings 5건 대응
- app-owned `window.*` 제거
- admin 목록/상품 관리 스크립트 번들화
- `pnpm` 기준 package manager 통일
- `pnpm lint` 통과
- `pnpm build` 통과
- `pnpm preflight:release` 통과
- `rg "window\\." assets/js layouts --glob '!assets/js/pocketbase.umd.js'` 결과 없음
- `rg "\\bjQuery\\b|\\$\\(|slick\\(" assets/js layouts config --glob '!assets/js/pocketbase.umd.js'` 결과 없음

## 현재 남은 것

### 1. External Globals

- `daum`
  - [profile.js](/C:/hugo/ex/shop/assets/js/profile.js)
  - [checkout/scripts.html](/C:/hugo/ex/shop/layouts/partials/checkout/scripts.html)
- `globalThis.tailwind`
  - [head.html](/C:/hugo/ex/shop/layouts/partials/head.html)
- `Mailcheck`
  - auth / checkout email suggestion 보조 스크립트
- `PortOne`
  - checkout payment SDK

### 2. Tailwind 기준 통일 마무리

- [products/single.html](/C:/hugo/ex/shop/layouts/products/single.html) 의 large local style block 축소
- cart / admin modal / table shell 의 utility/class 기준 재정리

### 3. ESLint 강화

- `no-global-assign` 추가
- globals whitelist 축소
- 필요 시 admin/public 별 overrides 도입

## 다음 추천 순서

1. `daum` 주소검색 helper/module 래핑
2. Tailwind CDN config 제거 및 build-time Tailwind 전환 검토
3. `no-global-assign` 추가와 globals whitelist 재정리
4. product detail / admin shell 남은 local style block 축소

## 최신 검증

- `pnpm lint` 통과
- `pnpm build` 통과
- `pnpm preflight:release` 통과

## 메모

- `hugo` dev 프로세스가 살아 있으면 `server/` 산출물을 덮어써서 release preflight를 흔들 수 있다.
- 현재 문서 기준 상태는 코드/빌드/산출물 검증을 다시 통과한 시점의 스냅샷이다.

## Latest Update (2026-03-31 Hugo-centered Tailwind)

### Additional Completed Work

- [layouts/partials/head.html](/C:/hugo/ex/shop/layouts/partials/head.html) 의 `globalThis.tailwind` + CDN 주입 제거
- [assets/css/tailwind.css](/C:/hugo/ex/shop/assets/css/tailwind.css) 추가
- [config/_default/hugo.toml](/C:/hugo/ex/shop/config/_default/hugo.toml) 에 Hugo build stats / module mounts / cachebusters 추가
- Hugo `css.TailwindCSS` 파이프를 통해 build-time Tailwind CSS 생성
- [assets/js/core/daum-postcode.js](/C:/hugo/ex/shop/assets/js/core/daum-postcode.js) 로 `daum` 접근 격리
- [.eslintrc.json](/C:/hugo/ex/shop/.eslintrc.json) 에 `no-global-assign` 추가 및 globals 정리

### Current Remaining Scope

- external SDKs
  - `Mailcheck`
  - `PortOne`
- Tailwind utility/class 기준으로 남은 local style block 축소
- ESLint globals whitelist 추가 축소 및 override 세분화

### Current Verification

- `pnpm lint` 통과
- `pnpm build` 통과
- `pnpm preflight:release` 통과
- build output 에서 Tailwind CDN / `globalThis.tailwind` 흔적 없음

## Latest Update (2026-03-31 Mailcheck Removal)

### Additional Completed Work

- [assets/js/core/email-suggestion.js](/C:/hugo/ex/shop/assets/js/core/email-suggestion.js) 로 email typo suggestion helper 추가
- auth / checkout 에서 Mailcheck 외부 스크립트 제거
- ESLint globals 에서 `Mailcheck` 제거

### Current Remaining Scope

- external SDKs
  - `daum` (helper로 격리됨)
  - `PortOne`
- Tailwind utility/class 기준으로 남은 local style block 축소
- ESLint globals whitelist 추가 축소 및 override 세분화
