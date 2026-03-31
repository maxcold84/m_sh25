# 2026-03-31 Progress Summary

## 개요

- 기준 리뷰: [2026-03-30-code-review-summary.md](/C:/hugo/ex/shop/docs/changes/2026-03-30-code-review-summary.md)
- 기준 계획: [2026-03-30-remediation-plan.md](/C:/hugo/ex/shop/docs/changes/2026-03-30-remediation-plan.md)
- 이번 진행 목적:
  - 리뷰 finding 중 즉시 위험도가 높은 항목부터 실제 수정
  - storefront/profile/checkout/public pages 를 `완전 module 전환 + Tailwind 확장` 방향으로 한 단계 더 이동
  - build/release 검증 루프를 실제로 통과시키기

## 이번에 반영한 내용

### 1. Auth / Security

- 파일: [assets/js/auth.js](/C:/hugo/ex/shop/assets/js/auth.js)
- 반영 사항:
  - `auth_redirect` 저장 위치를 `localStorage` 에서 `sessionStorage` 로 이동
  - redirect 대상은 same-origin 상대경로만 허용하도록 검증 추가
  - 로그인 및 OAuth 완료 후 redirect 소비 로직을 공통화
  - 닉네임 중복 확인에 request id 기반 stale response 방어 추가
  - 회원가입 submit 시 `nickname === checkedNickname` 조건을 강제
  - Bootstrap tab/jQuery 의존을 제거하고 data-driven 탭 전환으로 재구성
- 효과:
  - 리뷰 finding인 open redirect 리스크를 차단
  - 닉네임 검증 race condition 완화
  - auth 페이지가 Tailwind 기반 모바일 우선 UI로 전환됨

### 2. Runtime Bootstrap 정리

- 파일:
  - [assets/js/main.js](/C:/hugo/ex/shop/assets/js/main.js)
  - [layouts/partials/product-detail-qna.html](/C:/hugo/ex/shop/layouts/partials/product-detail-qna.html)
  - [layouts/partials/qna-list.html](/C:/hugo/ex/shop/layouts/partials/qna-list.html)
  - [layouts/products/single.html](/C:/hugo/ex/shop/layouts/products/single.html)
  - [layouts/profile/single.html](/C:/hugo/ex/shop/layouts/profile/single.html)
  - [assets/js/profile.js](/C:/hugo/ex/shop/assets/js/profile.js)
  - [assets/js/script.js](/C:/hugo/ex/shop/assets/js/script.js)
- 반영 사항:
  - raw `qna.js`, `reviews.js`, `profile.js` classic script 삽입 제거
  - bundle 내부 `main.js` 에서 product/profile bootstrap 수행
  - product detail 의 Q&A/리뷰 초기화 시점을 bundle 기준으로 통일
  - profile module 의 auto-init 제거
  - 상품 상세 슬라이더 중복 초기화 제거
- 효과:
  - ES module 파일을 classic script 로 로드하던 구조 제거
  - 상품 상세와 프로필의 초기화 흐름이 하나의 bundle 엔트리로 수렴

### 3. Build / Repository Hygiene

- 파일:
  - [scripts/create-essential-backup.mjs](/C:/hugo/ex/shop/scripts/create-essential-backup.mjs)
  - [.gitignore](/C:/hugo/ex/shop/.gitignore)
  - [package.json](/C:/hugo/ex/shop/package.json)
  - [scripts/check-release-safety.mjs](/C:/hugo/ex/shop/scripts/check-release-safety.mjs)
- 반영 사항:
  - backup 생성 대상에서 `backend/data.db`, `backend/auxiliary.db` 제거
  - `server/`, `backup/`, temp verify 디렉터리, `docs/pb_data/` 를 ignore 대상에 추가
  - `build`, `build:drafts` 에 clean step 연결
  - `dev` 출력 디렉터리를 `.hugo-dev` 로 분리
  - `preflight:release` 추가
  - 기존 backup DB 스냅샷 제거
- 효과:
  - live DB가 백업 경로를 통해 저장소에 다시 들어오는 문제 차단
  - dev/build 출력 혼용 리스크 축소
  - release 전 검출 가능한 가드레일 확보

### 4. Storefront / Profile / Checkout 인라인 핸들러 제거

- 파일:
  - [layouts/partials/cart-drawer.html](/C:/hugo/ex/shop/layouts/partials/cart-drawer.html)
  - [layouts/partials/cart-template.html](/C:/hugo/ex/shop/layouts/partials/cart-template.html)
  - [layouts/partials/header.html](/C:/hugo/ex/shop/layouts/partials/header.html)
  - [layouts/partials/auth-links.html](/C:/hugo/ex/shop/layouts/partials/auth-links.html)
  - [assets/js/cart.js](/C:/hugo/ex/shop/assets/js/cart.js)
  - [layouts/profile/single.html](/C:/hugo/ex/shop/layouts/profile/single.html)
  - [assets/js/profile.js](/C:/hugo/ex/shop/assets/js/profile.js)
  - [assets/js/qna.js](/C:/hugo/ex/shop/assets/js/qna.js)
  - [layouts/checkout/baseof.html](/C:/hugo/ex/shop/layouts/checkout/baseof.html)
  - [layouts/checkout/single.html](/C:/hugo/ex/shop/layouts/checkout/single.html)
  - [layouts/partials/checkout/shipping-address.html](/C:/hugo/ex/shop/layouts/partials/checkout/shipping-address.html)
  - [layouts/partials/checkout/modals.html](/C:/hugo/ex/shop/layouts/partials/checkout/modals.html)
  - [layouts/partials/checkout/floating-button.html](/C:/hugo/ex/shop/layouts/partials/checkout/floating-button.html)
  - [layouts/partials/checkout/scripts.html](/C:/hugo/ex/shop/layouts/partials/checkout/scripts.html)
- 반영 사항:
  - cart overlay, close, checkout, quantity, remove, retry 를 `data-cart-action` 기반 delegated listener 로 전환
  - header 언어 선택과 모바일 메뉴를 `data-nav-action` 기반으로 전환
  - auth logout 링크의 inline 호출 제거
  - profile 주소 검색, 뒤로가기, tracking modal, 주문취소를 `data-profile-action` 기반으로 전환
  - Q&A 섹션의 문의하기 버튼을 `data-qna-action` 기반으로 전환
  - checkout 주소 검색/닫기/뒤로가기를 `data-checkout-action` 기반으로 전환
- 효과:
  - 주요 사용자 흐름에서 inline handler 의존도를 크게 낮춤
  - module-first 구조로 옮기기 위한 기반 확보
  - checkout 모바일 사용성이 개선됨

### 5. 퍼블릭 Tailwind 전환 확장

- 파일:
  - [layouts/partials/head.html](/C:/hugo/ex/shop/layouts/partials/head.html)
  - [layouts/profile/baseof.html](/C:/hugo/ex/shop/layouts/profile/baseof.html)
  - [layouts/partials/about-product.html](/C:/hugo/ex/shop/layouts/partials/about-product.html)
  - [layouts/partials/footer.html](/C:/hugo/ex/shop/layouts/partials/footer.html)
  - [layouts/contact/list.html](/C:/hugo/ex/shop/layouts/contact/list.html)
  - [layouts/blog/list.html](/C:/hugo/ex/shop/layouts/blog/list.html)
  - [layouts/products/list.html](/C:/hugo/ex/shop/layouts/products/list.html)
  - [layouts/partials/header.html](/C:/hugo/ex/shop/layouts/partials/header.html)
  - [layouts/partials/auth-links.html](/C:/hugo/ex/shop/layouts/partials/auth-links.html)
  - [layouts/partials/banner.html](/C:/hugo/ex/shop/layouts/partials/banner.html)
  - [layouts/partials/features.html](/C:/hugo/ex/shop/layouts/partials/features.html)
  - [layouts/partials/promo.html](/C:/hugo/ex/shop/layouts/partials/promo.html)
  - [layouts/partials/subscription.html](/C:/hugo/ex/shop/layouts/partials/subscription.html)
  - [layouts/partials/testimonials.html](/C:/hugo/ex/shop/layouts/partials/testimonials.html)
  - [layouts/partials/products.html](/C:/hugo/ex/shop/layouts/partials/products.html)
  - [layouts/partials/related-products.html](/C:/hugo/ex/shop/layouts/partials/related-products.html)
  - [layouts/partials/product-detail-qna.html](/C:/hugo/ex/shop/layouts/partials/product-detail-qna.html)
  - [layouts/partials/qna-list.html](/C:/hugo/ex/shop/layouts/partials/qna-list.html)
  - [layouts/_default/auth.html](/C:/hugo/ex/shop/layouts/_default/auth.html)
  - [layouts/products/single.html](/C:/hugo/ex/shop/layouts/products/single.html)
  - [assets/js/reviews.js](/C:/hugo/ex/shop/assets/js/reviews.js)
- 반영 사항:
  - 퍼블릭 공용 head 에 Tailwind utility 공급 추가
  - `header/nav`, hero, features, promo, subscription, testimonials, footer, contact, blog list, products list 를 Tailwind 중심으로 전환
  - homepage/product slider 및 related-products 의 카드/spacing 을 Tailwind 기준으로 재정리
  - product-detail Q&A 와 reviews 영역도 Tailwind 기반 카드 레이아웃으로 정리
  - auth 페이지도 Tailwind 기반 모바일 우선 UI로 전환
- 효과:
  - 모바일 퍼블릭 화면에서 Bootstrap grid 의존이 크게 줄어듦
  - 퍼블릭 첫 화면, 목록, CTA, Q&A, 리뷰, auth 의 시각적 일관성이 높아짐

### 6. Admin 인터랙션 정리

- 파일:
  - [layouts/admin/single.html](/C:/hugo/ex/shop/layouts/admin/single.html)
  - [layouts/admin/posts.html](/C:/hugo/ex/shop/layouts/admin/posts.html)
  - [layouts/admin/orders.html](/C:/hugo/ex/shop/layouts/admin/orders.html)
  - [layouts/partials/admin/orders-header.html](/C:/hugo/ex/shop/layouts/partials/admin/orders-header.html)
  - [layouts/partials/admin/orders-filters.html](/C:/hugo/ex/shop/layouts/partials/admin/orders-filters.html)
  - [layouts/partials/admin/orders-table.html](/C:/hugo/ex/shop/layouts/partials/admin/orders-table.html)
  - [layouts/partials/admin/orders-modal.html](/C:/hugo/ex/shop/layouts/partials/admin/orders-modal.html)
  - [assets/js/admin-products.js](/C:/hugo/ex/shop/assets/js/admin-products.js)
  - [assets/js/admin-posts.js](/C:/hugo/ex/shop/assets/js/admin-posts.js)
  - [assets/js/admin-orders.js](/C:/hugo/ex/shop/assets/js/admin-orders.js)
- 반영 사항:
  - admin products/posts/orders 에서 inline `onclick` / `onchange` 제거
  - delegated listener 및 DOM event binding 으로 전환
  - orders modal/table 영역은 모바일에서 스크롤과 wrapping 이 더 낫도록 정리
- 효과:
  - admin 도 module-first 구조로 이동할 수 있는 기반 확보
  - 템플릿과 스크립트의 책임 분리가 이전보다 명확해짐

## 검증 결과

### 정적 검증

- `npm run lint` 통과
- `node --check assets/js/auth.js` 통과
- `node --check assets/js/main.js` 통과
- `node --check assets/js/profile.js` 통과
- `node --check assets/js/qna.js` 통과
- `node --check assets/js/reviews.js` 통과
- `node --check assets/js/admin-orders.js` 통과
- `node --check assets/js/admin-products.js` 통과
- `node --check assets/js/admin-posts.js` 통과

### 빌드 검증

- `npm run build` 성공
- `npm run preflight:release` 성공

### 산출물 확인

- 빌드 산출물 기준으로 아래 문자열이 검색되지 않음을 확인:
  - raw `js/qna.js`
  - raw `js/reviews.js`
  - raw `js/profile.js`
  - `localhost:1313`
  - `livereload.js`

## 현재 남은 작업

### 퍼블릭 Bootstrap 잔여 범위

- [layouts/partials/head.html](/C:/hugo/ex/shop/layouts/partials/head.html)
  - Bootstrap CSS/JS 가 여전히 전역 로드됨
- [layouts/products/single.html](/C:/hugo/ex/shop/layouts/products/single.html)
  - 상품 상세 전체 레이아웃은 여전히 legacy grid 구조가 남아 있음
- [layouts/partials/cart-drawer.html](/C:/hugo/ex/shop/layouts/partials/cart-drawer.html)
  - cart SCSS 와 legacy 마크업이 남아 있음
- [layouts/partials/products.html](/C:/hugo/ex/shop/layouts/partials/products.html)
  - slider 동작은 유지되지만 legacy theme 패턴과 cart 직접 호출이 섞여 있음

### Admin Bootstrap 잔여 범위

- [layouts/admin/login.html](/C:/hugo/ex/shop/layouts/admin/login.html)
- [layouts/partials/admin/category-modal.html](/C:/hugo/ex/shop/layouts/partials/admin/category-modal.html)
- orders/posts/single 템플릿은 inline handler 는 제거했지만 modal/table 구조 자체는 여전히 Bootstrap 의존도가 남아 있음
- admin 은 아직 별도 base/assets path 로 분리되지 않아 전역 Bootstrap 로드 구조를 공유 중

## 다음 권장 순서

1. public/global Bootstrap 로드를 admin 전용 로드로 분리
2. `products single`, `cart-drawer`, `products.html` 의 legacy theme 마크업 추가 정리
3. admin login / category modal / modal shell 을 Bootstrap-free 또는 admin-isolated 방식으로 재구성
4. 마지막으로 `window.*` 전역 노출 축소 및 제거

## 참고 메모

- `server/` 는 clean build 검증 때문에 재생성되며, 현재 작업트리에 생성물 변경이 함께 보일 수 있다.
- `docs/changes/2026-03-31-review-findings-summary.md` 에 리뷰 finding 원본 요약을 별도로 정리했다.
