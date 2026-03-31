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

- `pnpm lint` 통과
- `node --check assets/js/auth.js` 통과
- `node --check assets/js/main.js` 통과
- `node --check assets/js/profile.js` 통과
- `node --check assets/js/qna.js` 통과
- `node --check assets/js/reviews.js` 통과
- `node --check assets/js/admin-orders.js` 통과
- `node --check assets/js/admin-products.js` 통과
- `node --check assets/js/admin-posts.js` 통과

### 빌드 검증

- `pnpm build` 성공
- `pnpm preflight:release` 성공

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


## 추가 진행 (2026-03-31 오후)

### 8. Admin Base 분리

- 파일:
  - [layouts/admin/baseof.html](/C:/hugo/ex/shop/layouts/admin/baseof.html)
  - [layouts/admin/orders.html](/C:/hugo/ex/shop/layouts/admin/orders.html)
  - [layouts/admin/posts.html](/C:/hugo/ex/shop/layouts/admin/posts.html)
  - [layouts/admin/single.html](/C:/hugo/ex/shop/layouts/admin/single.html)
- 반영 사항:
  - admin 전용 base shell 추가
  - admin 페이지가 public `header/footer/cart-drawer` 에 의존하지 않도록 분리
  - admin 쪽은 자체적으로 `pocketbase.umd.js`, `admin-auth.js`, jQuery, Bootstrap bundle 을 받도록 구성
- 효과:
  - public shell 과 admin shell 책임이 분리됨
  - public 쪽 Bootstrap JS 제거를 진행해도 admin modal 동작은 유지 가능해짐

### 9. Product Single / Cart Drawer 정리

- 파일:
  - [layouts/products/single.html](/C:/hugo/ex/shop/layouts/products/single.html)
  - [layouts/partials/cart-drawer.html](/C:/hugo/ex/shop/layouts/partials/cart-drawer.html)
  - [assets/scss/cart-styles.scss](/C:/hugo/ex/shop/assets/scss/cart-styles.scss)
  - [assets/js/cart.js](/C:/hugo/ex/shop/assets/js/cart.js)
- 반영 사항:
  - product single 레이아웃을 Tailwind-first responsive card/grid 쪽으로 추가 정리
  - cart drawer 쉘과 시각 스타일을 모바일 친화적으로 조정
  - cart open 시 body scroll lock 추가
- 효과:
  - 상품 상세와 장바구니의 모바일 사용성이 더 개선됨

### 10. pnpm 기준선 강화

- 파일:
  - [package.json](/C:/hugo/ex/shop/package.json)
  - [pnpm-lock.yaml](/C:/hugo/ex/shop/pnpm-lock.yaml)
  - [.gitignore](/C:/hugo/ex/shop/.gitignore)
  - [themes/vex-hugo-main/package.json](/C:/hugo/ex/shop/themes/vex-hugo-main/package.json)
  - [themes/vex-hugo-main/vercel-build.sh](/C:/hugo/ex/shop/themes/vex-hugo-main/vercel-build.sh)
  - [themes/vex-hugo-main/README.md](/C:/hugo/ex/shop/themes/vex-hugo-main/README.md)
- 반영 사항:
  - root 및 theme package metadata 에 `pnpm` 기준 추가
  - `pnpm-lock.yaml` 생성
  - `package-lock.json` 제거
  - build/deploy/theme docs 를 `pnpm` 기준으로 조정
- 효과:
  - 저장소 기준 package manager 가 명확해짐
  - 로컬과 배포 스크립트가 같은 기준을 따르기 쉬워짐

### 추가 검증

- `pnpm lint` 통과
- `pnpm build` 통과
- `pnpm preflight:release` 통과

### 최신 남은 작업

1. public/global Bootstrap CSS 로드 제거 여부 판단 및 분리
2. [layouts/products/single.html](/C:/hugo/ex/shop/layouts/products/single.html) 의 남은 legacy style/class 정리
3. [layouts/partials/cart-drawer.html](/C:/hugo/ex/shop/layouts/partials/cart-drawer.html) 와 관련 SCSS 의 추가 축소
4. [layouts/admin/login.html](/C:/hugo/ex/shop/layouts/admin/login.html), [layouts/partials/admin/category-modal.html](/C:/hugo/ex/shop/layouts/partials/admin/category-modal.html) 의 Bootstrap-free 전환

## 추가 진행 (2026-03-31 저녁)

### 11. Public Bootstrap CSS 제거 및 Admin 분리 강화

- 파일:
  - [layouts/partials/head.html](/C:/hugo/ex/shop/layouts/partials/head.html)
  - [layouts/admin/baseof.html](/C:/hugo/ex/shop/layouts/admin/baseof.html)
  - [layouts/admin/orders.html](/C:/hugo/ex/shop/layouts/admin/orders.html)
  - [layouts/admin/posts.html](/C:/hugo/ex/shop/layouts/admin/posts.html)
  - [layouts/admin/single.html](/C:/hugo/ex/shop/layouts/admin/single.html)
  - [config/_default/hugo.toml](/C:/hugo/ex/shop/config/_default/hugo.toml)
- 반영 사항:
  - public `head` 에서 Bootstrap CSS를 제외
  - public `footer` 에서 Bootstrap JS를 제외
  - admin 전용 base를 통해 admin은 자체 Bootstrap/runtime 로드를 갖도록 분리
  - config 에서 공용 Bootstrap JS 플러그인 정의 제거
- 효과:
  - public 은 Tailwind + theme CSS 중심으로 동작
  - admin 은 독립적으로 Bootstrap modal/table 흐름 유지
  - public/admin 자산 경계가 이전보다 훨씬 명확해짐

### 12. Public Single / Policy / Detail 추가 정리

- 파일:
  - [layouts/blog/single.html](/C:/hugo/ex/shop/layouts/blog/single.html)
  - [layouts/_default/single.html](/C:/hugo/ex/shop/layouts/_default/single.html)
  - [layouts/privacy-policy/list.html](/C:/hugo/ex/shop/layouts/privacy-policy/list.html)
  - [layouts/terms-conditions/list.html](/C:/hugo/ex/shop/layouts/terms-conditions/list.html)
  - [layouts/products/single.html](/C:/hugo/ex/shop/layouts/products/single.html)
  - [assets/js/reviews.js](/C:/hugo/ex/shop/assets/js/reviews.js)
  - [layouts/partials/image.html](/C:/hugo/ex/shop/layouts/partials/image.html)
- 반영 사항:
  - blog/default single 및 policy pages 를 Tailwind 기반으로 전환
  - product single/detail/reviews 를 Tailwind-first 레이아웃으로 추가 정리
  - `img-fluid` 를 Tailwind-friendly 이미지 출력으로 교체
- 효과:
  - 퍼블릭 상세 페이지군의 Bootstrap 의존이 더 줄어듦
  - 모바일 읽기/상세/리뷰 경험이 더 일관됨

### 최신 검증

- `pnpm lint` 통과
- `pnpm build` 통과
- `pnpm preflight:release` 통과

### 현재 가장 큰 남은 작업

1. [layouts/partials/cart-drawer.html](/C:/hugo/ex/shop/layouts/partials/cart-drawer.html) 와 [assets/scss/cart-styles.scss](/C:/hugo/ex/shop/assets/scss/cart-styles.scss) 의 추가 슬림화
2. [layouts/partials/products.html](/C:/hugo/ex/shop/layouts/partials/products.html) 의 slider/legacy theme 패턴 정리
3. [layouts/admin/login.html](/C:/hugo/ex/shop/layouts/admin/login.html), [layouts/partials/admin/category-modal.html](/C:/hugo/ex/shop/layouts/partials/admin/category-modal.html) 를 포함한 admin Bootstrap-free 전환 마감

## 추가 진행 (2026-03-31 야간)

### 13. Public / Admin Bootstrap 경계 재정의

- 파일:
  - [layouts/partials/head.html](/C:/hugo/ex/shop/layouts/partials/head.html)
  - [layouts/partials/footer.html](/C:/hugo/ex/shop/layouts/partials/footer.html)
  - [config/_default/hugo.toml](/C:/hugo/ex/shop/config/_default/hugo.toml)
  - [layouts/admin/baseof.html](/C:/hugo/ex/shop/layouts/admin/baseof.html)
- 반영 사항:
  - public `head` 에서 Bootstrap CSS를 제외
  - public `footer` 에서 Bootstrap JS를 제외
  - admin은 전용 base에서 Bootstrap bundle 을 별도로 받도록 유지
- 효과:
  - public 은 Tailwind + theme CSS 중심
  - Bootstrap 의존은 사실상 admin shell 쪽으로 격리됨

### 14. Public Single / Detail / Policy 추가 정리

- 파일:
  - [layouts/blog/single.html](/C:/hugo/ex/shop/layouts/blog/single.html)
  - [layouts/_default/single.html](/C:/hugo/ex/shop/layouts/_default/single.html)
  - [layouts/privacy-policy/list.html](/C:/hugo/ex/shop/layouts/privacy-policy/list.html)
  - [layouts/terms-conditions/list.html](/C:/hugo/ex/shop/layouts/terms-conditions/list.html)
  - [layouts/products/single.html](/C:/hugo/ex/shop/layouts/products/single.html)
  - [assets/js/reviews.js](/C:/hugo/ex/shop/assets/js/reviews.js)
  - [layouts/partials/image.html](/C:/hugo/ex/shop/layouts/partials/image.html)
- 반영 사항:
  - single/policy/detail/review 영역을 Tailwind-first 레이아웃과 컴포넌트 클래스로 정리
  - review alert/confirm 흐름은 오버레이/토스트 기반으로 교체
  - 이미지 출력도 `img-fluid` 기반에서 Tailwind-friendly 출력으로 변경
- 효과:
  - public 상세 페이지군에서 Bootstrap 의존이 더 줄어듦
  - 모바일 읽기/리뷰 경험이 더 일관됨

### 15. 현재 기준선

- `pnpm lint` 통과
- `pnpm build` 통과
- `pnpm preflight:release` 통과

### 지금 남은 가장 큰 작업

1. [layouts/partials/products.html](/C:/hugo/ex/shop/layouts/partials/products.html) 의 slider legacy 패턴 단순화
2. [layouts/partials/cart-drawer.html](/C:/hugo/ex/shop/layouts/partials/cart-drawer.html) + [assets/scss/cart-styles.scss](/C:/hugo/ex/shop/assets/scss/cart-styles.scss) 추가 슬림화
3. admin modal/table shell 의 Bootstrap 의존 추가 축소
4. 필요 시 public `config/_default/hugo.toml` 의 plugin 목록을 public/admin 분리 구조로 더 명시화

## 추가 진행 (2026-03-31 심야)

### 16. Admin Bootstrap runtime 제거 및 release output 재검증

- 파일:
  - [layouts/admin/baseof.html](/C:/hugo/ex/shop/layouts/admin/baseof.html)
  - [config/_default/hugo.toml](/C:/hugo/ex/shop/config/_default/hugo.toml)
- 반영 사항:
  - admin base 에서 `jQuery` 와 `bootstrap.bundle.min.js` 로드를 제거
  - 전역 plugin CSS 목록에서 `bootstrap.min.css` 를 제거
  - admin base 는 Bootstrap CSS를 더 이상 받지 않고 `style.scss` + page-local admin styles만 사용
- 검증:
  - `pnpm build` 통과
  - `pnpm preflight:release` 통과
  - `rg "localhost:1313|livereload.js" server` 결과 없음
  - `rg "bootstrap.min.css|bootstrap.bundle.min.js|jquery-3.6.0.min.js" server` 결과 없음
- 효과:
  - admin runtime 기준으로도 Bootstrap 의존이 제거됨
  - 이전에 남아 있던 dev-style `server/` 산출물은 clean build 후 사라졌고, release preflight 와 실제 산출물이 다시 일치함

### 17. 현재 남은 큰 작업 재정리

1. [layouts/partials/products.html](/C:/hugo/ex/shop/layouts/partials/products.html) 의 slider legacy 패턴 단순화
2. [layouts/partials/cart-drawer.html](/C:/hugo/ex/shop/layouts/partials/cart-drawer.html) 와 [assets/scss/cart-styles.scss](/C:/hugo/ex/shop/assets/scss/cart-styles.scss) 의 구조 슬림화
3. admin UI 안의 `alert/confirm/prompt` 흐름을 custom dialog 또는 inline feedback 으로 정리

## 추가 진행 (2026-03-31 심야 후반)

### 18. Homepage Products 모듈 분리 및 Cart Bootstrap 정리

- 파일:
  - [assets/js/home-products.js](/C:/hugo/ex/shop/assets/js/home-products.js)
  - [assets/js/main.js](/C:/hugo/ex/shop/assets/js/main.js)
  - [layouts/partials/products.html](/C:/hugo/ex/shop/layouts/partials/products.html)
  - [layouts/partials/cart-drawer.html](/C:/hugo/ex/shop/layouts/partials/cart-drawer.html)
  - [layouts/partials/cart-template.html](/C:/hugo/ex/shop/layouts/partials/cart-template.html)
  - [assets/scss/cart-styles.scss](/C:/hugo/ex/shop/assets/scss/cart-styles.scss)
- 반영 사항:
  - homepage products 의 대형 inline script 를 [home-products.js](/C:/hugo/ex/shop/assets/js/home-products.js) 모듈로 분리
  - [main.js](/C:/hugo/ex/shop/assets/js/main.js) 에서 homepage products 와 cart drawer 를 bundle 기준으로 bootstrap
  - `products.html` 은 markup 중심 partial 로 단순화
  - 상품 카드의 장바구니 버튼은 `data-cart-action="add-item"` 기반으로 연결
  - 상품 상세 링크는 현재 언어 기준 경로로 생성하고, 외부 placeholder 서비스와 `alert()` 의존을 제거
  - coarse pointer / reduced motion 환경에서는 자동 회전 대신 스크롤 중심 동작으로 완화
  - cart template 의 inline style 제거, cart partial 의 inline init 제거
  - cart 의 수량/삭제 버튼 터치 타깃 확대, checkout 영역 safe-area padding 추가
- 효과:
  - homepage/products/cart 흐름이 bundle-first 구조로 더 정리됨
  - 모바일에서 자동 회전 간섭과 작은 터치 타깃 문제가 줄어듦
  - cart partial/template 가 마크업 중심에 가까워짐

### 19. 최신 검증

- `node --check assets/js/home-products.js` 통과
- `node --check assets/js/main.js` 통과
- `pnpm lint` 통과
- `pnpm build` 통과
- `pnpm preflight:release` 통과
- `rg "localhost:1313|livereload.js" server` 결과 없음
- `rg "bootstrap.min.css|bootstrap.bundle.min.js|jquery-3.6.0.min.js" server` 결과 없음

### 20. 지금 남은 큰 작업

1. [layouts/products/list.html](/C:/hugo/ex/shop/layouts/products/list.html) 를 포함한 남은 page-local inline script 정리
2. [assets/js/cart.js](/C:/hugo/ex/shop/assets/js/cart.js) 및 admin JS 안의 `window.*`, `alert/confirm/prompt` 흐름 축소
3. product single/detail 의 남은 legacy style block 추가 정리

## 추가 진행 (2026-03-31 심야 마감 전)

### 21. Public Inline Script 추가 정리

- 파일:
  - [assets/js/product-list-page.js](/C:/hugo/ex/shop/assets/js/product-list-page.js)
  - [assets/js/blog-reading-progress.js](/C:/hugo/ex/shop/assets/js/blog-reading-progress.js)
  - [assets/js/main.js](/C:/hugo/ex/shop/assets/js/main.js)
  - [layouts/products/list.html](/C:/hugo/ex/shop/layouts/products/list.html)
  - [layouts/blog/single.html](/C:/hugo/ex/shop/layouts/blog/single.html)
  - [layouts/partials/related-products.html](/C:/hugo/ex/shop/layouts/partials/related-products.html)
- 반영 사항:
  - `products/list` 의 inline fetch/render/cart script 를 `product-list-page.js` 로 이동
  - `blog/single` 의 reading progress inline script 를 `blog-reading-progress.js` 로 이동
  - 두 페이지 모두 template 내 `type="module"` 직접 로드 대신 [main.js](/C:/hugo/ex/shop/assets/js/main.js) bootstrap 경로로 수렴
  - `related-products` 의 slick 초기화도 partial inline script 대신 bundle bootstrap 으로 이동
  - product list 카드도 language-aware URL, placeholder 제거, `data-cart-action="add-item"` 기반으로 정리
- 효과:
  - public page-local inline script 범위가 더 줄어듦
  - bundle 기준 초기화 경로가 homepage/list/blog/related-products 까지 확대됨
  - 모바일에서 blog reading progress 업데이트가 더 가볍게 동작함

### 22. 최신 검증

- `node --check assets/js/product-list-page.js` 통과
- `node --check assets/js/blog-reading-progress.js` 통과
- `node --check assets/js/main.js` 통과
- `pnpm lint` 통과
- `pnpm build` 통과
- `pnpm preflight:release` 통과
- `rg "localhost:1313|livereload.js" server` 결과 없음

### 23. 지금 남은 큰 작업

1. [layouts/products/single.html](/C:/hugo/ex/shop/layouts/products/single.html) 의 큰 inline script를 module/bootstrap 으로 분리
2. [assets/js/admin-orders.js](/C:/hugo/ex/shop/assets/js/admin-orders.js), [assets/js/admin-posts.js](/C:/hugo/ex/shop/assets/js/admin-posts.js), [assets/js/admin-products.js](/C:/hugo/ex/shop/assets/js/admin-products.js) 의 `alert/confirm/prompt` 흐름을 custom dialog 또는 toast 로 치환
3. [assets/js/cart.js](/C:/hugo/ex/shop/assets/js/cart.js) 와 admin JS 안의 `window.*` 노출 축소

## 최신 스냅샷 (2026-03-31 마감 기준)

### 현재 상태 요약

- auth redirect open redirect 대응은 반영 완료
  - `localStorage` 대신 `sessionStorage`
  - same-origin 상대경로만 허용
- live DB 백업/커밋 문제는 차단 완료
  - backup 대상에서 DB 제거
  - 커밋돼 있던 DB 스냅샷 삭제
  - release preflight 추가
- public/admin Bootstrap runtime 제거와 clean build 정합성은 확보
- public 쪽은 homepage/list/blog/related-products/cart 기준으로 bundle-first 구조가 더 정리됨
- 남은 큰 작업은 `product single inline script`, `admin alert/confirm/prompt`, `window.*` 노출 축소

### 최신 검증 묶음

- `pnpm lint` 통과
- `pnpm build` 통과
- `pnpm preflight:release` 통과
- `rg "localhost:1313|livereload.js" server` 결과 없음
- `rg "bootstrap.min.css|bootstrap.bundle.min.js|jquery-3.6.0.min.js" server` 결과 없음

### 현재 추천 다음 순서

1. [layouts/products/single.html](/C:/hugo/ex/shop/layouts/products/single.html)의 큰 inline script를 module/bootstrap 으로 분리
2. [assets/js/admin-orders.js](/C:/hugo/ex/shop/assets/js/admin-orders.js), [assets/js/admin-posts.js](/C:/hugo/ex/shop/assets/js/admin-posts.js), [assets/js/admin-products.js](/C:/hugo/ex/shop/assets/js/admin-products.js)의 `alert/confirm/prompt` 를 custom dialog 또는 toast 로 치환
3. [assets/js/cart.js](/C:/hugo/ex/shop/assets/js/cart.js) 와 admin JS 안의 `window.*` 노출 축소

## 추가 진행 (2026-03-31 심야 admin feedback)

### 24. Admin 기본 다이얼로그 치환

- 파일:
  - [assets/js/admin-feedback.js](/C:/hugo/ex/shop/assets/js/admin-feedback.js)
  - [layouts/admin/baseof.html](/C:/hugo/ex/shop/layouts/admin/baseof.html)
  - [assets/js/admin-orders.js](/C:/hugo/ex/shop/assets/js/admin-orders.js)
  - [assets/js/admin-posts.js](/C:/hugo/ex/shop/assets/js/admin-posts.js)
  - [assets/js/admin-products.js](/C:/hugo/ex/shop/assets/js/admin-products.js)
- 반영 사항:
  - admin 공용 toast / confirm / prompt UI 레이어 추가
  - 주문 관리의 archive/delete 경고를 browser dialog 대신 custom feedback 으로 전환
  - 게시글 관리의 저장/삭제 오류와 동영상 삽입 `prompt` 를 custom feedback 으로 전환
  - 상품/카테고리 관리의 confirm / error feedback 도 browser dialog 대신 custom feedback 으로 전환
- 효과:
  - admin UX가 browser 기본 다이얼로그에서 벗어나 일관된 UI로 정리됨
  - 남은 큰 작업에서 `window.*` 축소와 product single module 분리에 집중하기 쉬워짐

### 25. 최신 검증

- `pnpm lint` 통과
- `pnpm build` 통과
- `pnpm preflight:release` 통과

## 계획 추가 메모 (2026-03-31)

### JS 완전 모듈화

- 남은 inline script 와 `window.*` 의존을 모두 추적해 bundle/bootstrap 구조로 수렴
- 특히 [layouts/products/single.html](/C:/hugo/ex/shop/layouts/products/single.html), [assets/js/cart.js](/C:/hugo/ex/shop/assets/js/cart.js), admin plain scripts 를 우선 대상으로 본다

### ESLint 규칙 강화

- 현재 `no-undef` 는 이미 `error` 로 활성화되어 있으므로 유지
- 다음 단계에서 `no-global-assign` 를 `error` 로 추가
- globals whitelist 를 public/admin 실제 런타임 기준으로 축소

### Tailwind 기반 통일

- 남은 legacy style block, inline style, mixed class 패턴을 Tailwind 기준으로 정리
- 공용 spacing, touch target, safe-area 대응을 mobile-first 기준으로 맞춘다

## 추가 진행 (2026-03-31 window 제거)

### 26. 프로젝트가 만든 `window.*` 전역 제거

- 파일:
  - [assets/js/core/runtime-config.js](/C:/hugo/ex/shop/assets/js/core/runtime-config.js)
  - [layouts/partials/head.html](/C:/hugo/ex/shop/layouts/partials/head.html)
  - [layouts/admin/baseof.html](/C:/hugo/ex/shop/layouts/admin/baseof.html)
  - [assets/js/core/pb-client.js](/C:/hugo/ex/shop/assets/js/core/pb-client.js)
  - [assets/js/admin-auth.js](/C:/hugo/ex/shop/assets/js/admin-auth.js)
  - [assets/js/admin-feedback.js](/C:/hugo/ex/shop/assets/js/admin-feedback.js)
  - [assets/js/admin-login.js](/C:/hugo/ex/shop/assets/js/admin-login.js)
  - [assets/js/admin-orders.js](/C:/hugo/ex/shop/assets/js/admin-orders.js)
  - [assets/js/admin-posts.js](/C:/hugo/ex/shop/assets/js/admin-posts.js)
  - [assets/js/admin-products.js](/C:/hugo/ex/shop/assets/js/admin-products.js)
  - [assets/js/product-detail-page.js](/C:/hugo/ex/shop/assets/js/product-detail-page.js)
  - [assets/js/cart.js](/C:/hugo/ex/shop/assets/js/cart.js)
  - [layouts/products/single.html](/C:/hugo/ex/shop/layouts/products/single.html)
  - [layouts/partials/checkout/scripts.html](/C:/hugo/ex/shop/layouts/partials/checkout/scripts.html)
  - [layouts/admin/login.html](/C:/hugo/ex/shop/layouts/admin/login.html)
  - [layouts/admin/orders.html](/C:/hugo/ex/shop/layouts/admin/orders.html)
  - [layouts/admin/posts.html](/C:/hugo/ex/shop/layouts/admin/posts.html)
  - [layouts/admin/single.html](/C:/hugo/ex/shop/layouts/admin/single.html)
  - [.eslintrc.json](/C:/hugo/ex/shop/.eslintrc.json)
- 반영 사항:
  - `window.SiteConfig`, `window.ShopConfig` 를 JSON script config + runtime-config reader 로 교체
  - admin shared state(`PBClient`, `AdminAuth`, `AdminFeedback`)를 global 대신 ES module import 구조로 전환
  - admin pages 는 `type="module"` 로 스크립트를 로드하도록 변경
  - product detail inline cart script 를 [product-detail-page.js](/C:/hugo/ex/shop/assets/js/product-detail-page.js) 로 이동해 `window.Cart` 제거
  - checkout inline script 도 `window.SiteConfig/ShopConfig` 대신 로컬 config reader 로 변경
  - 남은 브라우저 API 접근은 `location`, `history`, `matchMedia`, `open`, `scrollTo` 등으로 정리해 `window.` prefix 자체도 제거
- 효과:
  - 프로젝트가 만든 `window.*` 전역 의존이 제거됨
  - config 주입, admin auth/feedback, product detail/cart 가 module/bootstrap 구조로 더 정리됨

### 27. 최신 검증

- `rg "window\." assets/js layouts --glob '!assets/js/pocketbase.umd.js'` 결과 없음
- `pnpm lint` 통과
- `pnpm build` 통과
- `pnpm preflight:release` 통과

## 추가 진행 (2026-03-31 외부 전역 축소)

### 28. jQuery / slick 제거

- 파일:
  - [assets/js/script.js](/C:/hugo/ex/shop/assets/js/script.js)
  - [assets/js/main.js](/C:/hugo/ex/shop/assets/js/main.js)
  - [assets/js/product-detail-page.js](/C:/hugo/ex/shop/assets/js/product-detail-page.js)
  - [layouts/partials/related-products.html](/C:/hugo/ex/shop/layouts/partials/related-products.html)
  - [layouts/products/single.html](/C:/hugo/ex/shop/layouts/products/single.html)
  - [assets/scss/style.scss](/C:/hugo/ex/shop/assets/scss/style.scss)
  - [config/_default/hugo.toml](/C:/hugo/ex/shop/config/_default/hugo.toml)
- 반영 사항:
  - stale jQuery 기반 `script.js` slider 초기화 제거, preloader만 vanilla 처리
  - related-products 는 slick 대신 native horizontal scroller + scroll-snap 구조로 전환
  - product detail image slider도 slick 대신 native scroll container 구조로 전환
  - plugin 설정에서 slick 자산 의존 제거
- 효과:
  - 프로젝트 코드 기준 `jQuery/$` 및 slick 의존 제거
  - 모바일 스와이프/가로 스크롤 사용성이 더 단순하고 예측 가능해짐

### 29. 현재 남은 외부 전역

- `daum`
  - [assets/js/profile.js](/C:/hugo/ex/shop/assets/js/profile.js)
  - [layouts/partials/checkout/scripts.html](/C:/hugo/ex/shop/layouts/partials/checkout/scripts.html)
- `globalThis.tailwind`
  - [layouts/partials/head.html](/C:/hugo/ex/shop/layouts/partials/head.html)
- 메모:
  - 이 둘은 프로젝트가 만든 전역이 아니라 외부 라이브러리/CDN 전역이라, 완전 제거하려면 래핑 또는 라이브러리 교체/build-time 전환이 필요함

### 30. 최신 검증

- `pnpm lint` 통과
- `pnpm build` 통과
- `pnpm preflight:release` 통과

## 종합 요약 문서

- [overall summary](/C:/hugo/ex/shop/docs/changes/2026-03-31-overall-summary.md)
- 목적:
  - review 대응, build/release 안정화, module 전환, Tailwind 확장, admin/runtime 정리를 한 문서에서 확인할 수 있도록 최신 상태를 정리

## 추가 진행 (2026-03-31 외부 전역 격리와 ESLint 강화)

### 31. daum 주소검색 의존 격리

- 파일:
  - [assets/js/core/daum-postcode.js](/C:/hugo/ex/shop/assets/js/core/daum-postcode.js)
  - [assets/js/profile.js](/C:/hugo/ex/shop/assets/js/profile.js)
  - [layouts/partials/checkout/scripts.html](/C:/hugo/ex/shop/layouts/partials/checkout/scripts.html)
- 반영 사항:
  - `daum.Postcode` 접근을 공용 helper로 래핑
  - profile은 helper module import 구조로 전환
  - checkout은 helper import를 사용하는 module script로 격리
- 효과:
  - 외부 전역 `daum` 접근이 한 helper에 집중됨
  - 추후 주소검색 교체/래핑 시 영향 범위가 줄어듦

### 32. ESLint 강화

- 파일:
  - [.eslintrc.json](/C:/hugo/ex/shop/.eslintrc.json)
- 반영 사항:
  - app-owned globals whitelist 제거
  - `no-global-assign` 규칙 추가
- 효과:
  - 전역 누수 회귀를 lint 단계에서 더 빨리 잡을 수 있음

### 33. 현재 남은 외부 전역

- `globalThis.tailwind`
- `Mailcheck`
- `PortOne`
- `daum` 자체는 helper로 격리됐지만 외부 SDK 전역이라는 점은 유지

### 34. 최신 검증

- `pnpm lint` 통과
- `pnpm build` 통과
- `pnpm preflight:release` 통과

## 추가 진행 (2026-03-31 Hugo 중심 Tailwind 전환)

### 35. Hugo build-time Tailwind 전환

- 파일:
  - [assets/css/tailwind.css](/C:/hugo/ex/shop/assets/css/tailwind.css)
  - [layouts/partials/head.html](/C:/hugo/ex/shop/layouts/partials/head.html)
  - [config/_default/hugo.toml](/C:/hugo/ex/shop/config/_default/hugo.toml)
- 반영 사항:
  - Tailwind CDN + `globalThis.tailwind` config 제거
  - Hugo `css.TailwindCSS` 파이프로 utility CSS 생성
  - build stats / module mounts / cachebusters 추가
- 효과:
  - Tailwind 사용이 CDN runtime이 아니라 Hugo build-time 자산 파이프라인으로 이동
  - `globalThis.tailwind` 외부 전역 제거

### 36. 외부 전역 현재 상태

- `daum`
  - helper로 격리 완료
- 남은 외부 SDK
  - `Mailcheck`
  - `PortOne`

### 37. 최신 검증

- `pnpm lint` 통과
- `pnpm build` 통과
- `pnpm preflight:release` 통과

## 추가 진행 (2026-03-31 Mailcheck 제거)

### 38. Mailcheck 외부 의존 제거

- 파일:
  - [assets/js/core/email-suggestion.js](/C:/hugo/ex/shop/assets/js/core/email-suggestion.js)
  - [assets/js/auth.js](/C:/hugo/ex/shop/assets/js/auth.js)
  - [layouts/_default/auth.html](/C:/hugo/ex/shop/layouts/_default/auth.html)
  - [layouts/partials/checkout/scripts.html](/C:/hugo/ex/shop/layouts/partials/checkout/scripts.html)
  - [.eslintrc.json](/C:/hugo/ex/shop/.eslintrc.json)
- 반영 사항:
  - Mailcheck CDN script 제거
  - 공용 email suggestion helper로 auth / checkout 오타 보정 로직 대체
  - ESLint globals에서 `Mailcheck` 제거
- 효과:
  - 외부 전역/SDK 의존이 한 단계 더 줄어듦
  - 이메일 도메인 보정 로직을 프로젝트 코드 안에서 제어 가능

### 39. 현재 남은 외부 SDK

- `daum`
  - helper로 격리됨
- `PortOne`
  - checkout 결제 SDK

### 40. 최신 검증

- `pnpm lint` 통과
- `pnpm build` 통과
- `pnpm preflight:release` 통과

## 추가 진행 (2026-03-31 product single Tailwind 정리)

### 41. Product single local style block 축소

- 파일:
  - [layouts/products/single.html](/C:/hugo/ex/shop/layouts/products/single.html)
- 반영 사항:
  - 구매 영역과 리뷰 작성 폼의 시각 스타일을 Tailwind utility class 중심으로 markup에 이동
  - local style block에서는 리뷰 카드/모달 등 JS 생성 마크업에 가까운 규칙 위주로 축소
- 효과:
  - `products/single` 의 큰 local style block이 줄어듦
  - Tailwind 기준 통일이 product detail 구매/작성 흐름까지 확장됨

### 42. 최신 검증

- `pnpm lint` 통과
- `pnpm build` 통과
- `pnpm preflight:release` 는 실행 중인 `hugo` dev 프로세스가 `server/` 산출물을 덮는 경우 흔들릴 수 있음
