# 2026-04-05 Auth/Admin Orders Follow-up

## 목적

- `login/#signup`, `signup/`, `admin/orders/` 에서 확인된 UX/스타일 회귀를 한 문서에 정리한다.
- 이번 수정의 직접 원인과 재발 방지 규칙을 명확히 남긴다.

## 증상

### 1. 인증 페이지 탭 전환이 새로고침처럼 보임

- `/ko/login/` 화면에서 회원가입 탭 또는 헤더의 회원가입 링크를 누를 때 해시 전환이 아니라 문서 이동으로 처리되는 경우가 있었다.
- `/ko/signup/` 는 별도 경로라서 결국 같은 회원가입 UI로 가더라도 페이지 이동 1회가 발생했다.

### 2. `admin/orders/` 가 무스타일 또는 부분 스타일 상태처럼 보임

- `orders` 템플릿은 Tailwind utility class 중심으로 작성돼 있었는데, admin base shell은 Tailwind CSS를 로드하지 않았다.
- 그 결과 `rounded-*`, `grid`, `bg-slate-*`, `shadow-*` 등 주문 관리 페이지 핵심 레이아웃 클래스가 적용되지 않았다.

### 3. `server/` 산출물이 stale dev 출력으로 오염될 수 있음

- `server/ko/admin/orders/index.html` 에 `livereload.js`, `//localhost:1313/...` 가 남아 있는 경우가 확인됐다.
- 이 상태에서는 소스가 정상이어도 배포 산출물을 열었을 때 CSS/JS가 깨진 것처럼 보일 수 있다.

### 4. 운송장 정보 UI가 저장 전에는 덜 명확함

- 운송장 조회 버튼은 저장된 값이 있을 때만 표시되는 흐름이어서, 택배사/운송장번호를 입력해도 바로 조회 가능 여부가 직관적으로 드러나지 않았다.
- 조회 URL 생성 시 운송장번호를 그대로 이어붙여 특수문자가 포함되면 링크 안정성이 떨어질 수 있었다.

## 원인

### 인증 페이지

- 인증 탭 링크가 `/login`, `/login/`, `/login#signup`, `/login/#signup` 처럼 혼합된 형태로 생성될 수 있었다.
- 브라우저가 현재 문서와 다른 URL로 판단하면 JS 탭 전환 전에 문서 이동이 먼저 일어났다.

### admin/orders 스타일

- [layouts/admin/orders.html](/C:/hugo/ex/shop/layouts/admin/orders.html) 와 관련 partial은 Tailwind utility 중심인데,
  [layouts/admin/baseof.html](/C:/hugo/ex/shop/layouts/admin/baseof.html) 는 shared SCSS만 로드하고 Tailwind CSS와 `admin_head` 블록을 포함하지 않았다.
- 결과적으로 posts/products와 달리 orders에서 페이지 구성은 바뀌었지만 스타일 자산 계약이 따라오지 못했다.

### stale 산출물

- 실행 중인 `hugo server` 프로세스가 `server/` 또는 관련 파일 핸들을 잡은 상태에서 검증/재빌드를 시도하면,
  최신 소스와 다른 dev 출력이 남을 수 있었다.

### 운송장 조회

- 택배사 드롭다운/운송장번호 입력 상태와 `배송조회` 버튼 표시 상태가 저장 여부 중심으로만 연결돼 있었다.
- `CARRIERS` 매핑은 있었지만 입력 중 피드백과 URL 안전성 처리가 충분하지 않았다.

## 조치

### 1. 인증 경로 정규화 및 탭 전환 최적화

- [layouts/partials/auth-links.html](/C:/hugo/ex/shop/layouts/partials/auth-links.html)
- [layouts/_default/auth.html](/C:/hugo/ex/shop/layouts/_default/auth.html)
- [layouts/_default/auth-redirect.html](/C:/hugo/ex/shop/layouts/_default/auth-redirect.html)
- [layouts/partials/footer.html](/C:/hugo/ex/shop/layouts/partials/footer.html)
- [assets/js/auth.js](/C:/hugo/ex/shop/assets/js/auth.js)

- 로그인 canonical URL을 `/login/` 형태로 정규화했다.
- 회원가입 진입 링크는 `/login/#signup` 기준으로 통일했다.
- 인증 페이지 내부 탭 클릭과 헤더 auth 링크 클릭은 `preventDefault()` 후 `history.replaceState(...)` 기반 탭 전환만 수행하게 정리했다.
- `/signup/` 는 별도 auth form을 유지하지 않고 `/login/#signup` 으로 리다이렉트하는 안내 페이지로 정리했다.

### 2. Admin base 스타일 계약 복구

- [layouts/admin/baseof.html](/C:/hugo/ex/shop/layouts/admin/baseof.html)
- [layouts/admin/orders.html](/C:/hugo/ex/shop/layouts/admin/orders.html)
- [layouts/partials/admin/orders-header.html](/C:/hugo/ex/shop/layouts/partials/admin/orders-header.html)
- [layouts/partials/admin/orders-filters.html](/C:/hugo/ex/shop/layouts/partials/admin/orders-filters.html)

- admin base에 Hugo build-time Tailwind CSS 로드를 추가했다.
- admin page별 style 삽입을 위해 `{{ block "admin_head" . }}` 를 다시 연결했다.
- orders 화면을 posts/products와 같은 `admin-shell`, `admin-surface`, `admin-toolbar`, `admin-card`, `admin-select`, `admin-btn` 흐름으로 맞췄다.
- orders header의 legacy `border-bottom`, `mb-0` 중심 마크업을 admin 공통 톤으로 교체했다.

### 3. 운송장 조회 UI 보강

- [assets/js/admin-orders.js](/C:/hugo/ex/shop/assets/js/admin-orders.js)

- `CARRIERS` 매핑은 유지하되 `syncTrackingUiState()` 를 추가해:
  - 택배사/운송장번호 입력 중에도 배송조회 가능 상태를 즉시 반영
  - 저장된 운송장과 입력 중인 운송장을 구분해 상태 메시지 표시
  - 조건이 맞을 때만 `배송조회` 버튼 노출
- 조회 URL 생성 시 `encodeURIComponent(number)` 를 적용해 링크 안정성을 높였다.

### 4. 산출물 재생성

- 실행 중이던 `hugo` dev 프로세스를 종료한 뒤 `pnpm build` 로 `server/` 를 재생성했다.
- 재빌드 후 `server/ko/admin/orders/index.html` 에서 `localhost:1313`, `livereload.js` 흔적이 제거된 것을 확인했다.

## 확인 범위

- 정적 검증
  - `node --check assets/js/auth.js`
  - `node --check assets/js/admin-orders.js`
  - `pnpm lint`
- 빌드 검증
  - `pnpm build`
- 출력 검증
  - `http://127.0.0.1:1313/ko/admin/orders/` 응답 HTML에 `admin-shell.min.css` 와 fingerprinted Tailwind CSS가 함께 포함되는지 확인
  - `server/ko/admin/orders/index.html` 에 `localhost:1313`, `livereload.js` 가 남지 않는지 확인

## 재발 방지 포인트

### 1. Admin base 계약 우선 확인

- admin 페이지가 Tailwind utility class를 사용하면, 페이지 템플릿보다 먼저 admin base가 Tailwind CSS를 반드시 로드해야 한다.
- page-local 스타일 수정만으로는 utility 기반 레이아웃이 복구되지 않는다.

### 2. 인증 URL canonical 규칙 유지

- 인증 진입점은 `/login/` 기준으로 정규화한다.
- 회원가입 탭 링크는 `/login/#signup` 를 canonical로 유지한다.
- 탭 전환은 문서 이동보다 JS 탭 전환이 우선되도록 `preventDefault()` 흐름을 유지한다.

### 3. `server/` 산출물은 dev 서버 실행 중 상태를 신뢰하지 않기

- `hugo server` 실행 중에는 `server/` 나 생성 자산 핸들이 잠겨 검증 결과가 흔들릴 수 있다.
- release/debug 검증 전에 관련 `hugo` dev 프로세스를 정리한 뒤 `pnpm build` 로 재생성한다.

### 4. CSS 회귀 점검 순서 고정

1. 소스 템플릿이 어떤 클래스 체계를 쓰는지 확인
2. base template가 필요한 공통 CSS를 읽는지 확인
3. dev 응답 HTML이 실제 어떤 CSS/JS URL을 참조하는지 확인
4. `server/` 산출물에 `localhost`, `livereload`, stale dev URL이 남았는지 확인

### 5. 택배사 추가 시 동기화 규칙 유지

- 새 택배사 추가 시:
  - `orders-modal` 의 `<select>` option
  - `admin-orders.js` 의 `CARRIERS` 매핑
  - `syncTrackingUiState()` 메시지 흐름
  를 같이 업데이트해야 한다.

## 현재 상태 요약

- `login/#signup` 전환은 새 문서 이동 없이 탭 전환 중심으로 최적화됐다.
- `/signup/` 는 동일 회원가입 화면으로 유도되는 보조 경로로 정리됐다.
- `admin/orders/` 는 admin 공통 스타일 체계와 Tailwind utility를 모두 사용하는 상태로 복구됐다.
- 운송장 정보는 저장/조회 상태가 이전보다 명확하게 드러나며, 택배사 조회 URL 생성도 더 안전해졌다.
