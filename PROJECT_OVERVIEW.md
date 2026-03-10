# 프로젝트 전체 정리

## 1. 프로젝트 개요

이 저장소는 **Hugo 기반 다국어 쇼핑몰 프런트엔드**에 **PocketBase 백엔드**를 결합한 프로젝트다.

핵심 목적은 아래 3가지를 한 번에 처리하는 것이다.

1. Hugo로 공개용 정적 쇼핑몰 페이지를 생성한다.
2. PocketBase로 상품, 주문, 리뷰, 문의, 회원 데이터를 관리한다.
3. PocketBase 데이터를 Hugo 콘텐츠로 동기화해 상품 상세/블로그 페이지를 정적으로 배포한다.

현재 구조상 이 프로젝트는 단순 정적 사이트가 아니라,
`정적 페이지 + 클라이언트 JS + PocketBase API + 관리자 화면 + 동기화 스크립트`
가 함께 묶인 형태다.

## 2. 기술 스택

- 정적 사이트: Hugo
- 테마 기반: `themes/vex-hugo-main`
- 프런트엔드 JS: ES Modules + 브라우저 전역 노출 혼합
- 스타일: SCSS, Bootstrap, 일부 Tailwind 유틸리티 클래스 혼용
- 백엔드/DB: PocketBase
- 데이터 동기화 스크립트: Node.js
- 주요 외부 연동:
  - PortOne 결제 설정
  - PocketBase OAuth (Google, Kakao)
  - Daum 우편번호 검색

## 3. 최상위 디렉터리 역할

- `assets/`
  - Hugo가 번들링하는 JS/SCSS/이미지 원본
  - 실제 클라이언트 기능 코드가 가장 많이 들어 있음
- `layouts/`
  - Hugo 템플릿
  - 상품 상세, 체크아웃, 프로필, 관리자 페이지 등 커스텀 화면 정의
- `content/`
  - Hugo 콘텐츠 원본
  - `english`, `korean` 아래에 페이지/상품/블로그 데이터 저장
- `config/_default/hugo.toml`
  - 다국어, 메뉴, PocketBase URL, PortOne 설정 등 핵심 설정
- `backend/`
  - PocketBase 관련 스키마/DB 파일 보관
- `scripts/`
  - PocketBase 데이터를 Hugo 콘텐츠로 변환하는 동기화 스크립트
- `static/`
  - 정적 파일 원본
- `public/`
  - Hugo 기본 빌드 산출물
- `server/`
  - 별도로 커밋된 배포 산출물 성격의 정적 결과물
- `themes/vex-hugo-main/`
  - 베이스 테마

## 4. 다국어 구조

`config/_default/hugo.toml` 기준으로:

- 기본 언어: `ko`
- 한국어 콘텐츠: `content/korean`
- 영어 콘텐츠: `content/english`
- `defaultContentLanguageInSubdir = true` 이므로 기본 언어도 `/ko/` 경로를 사용

즉 URL 구조는 대체로 아래 형태다.

- 한국어: `/ko/...`
- 영어: `/en/...`

## 5. 핵심 기능 요약

### 5.1 사용자 기능

- 회원가입/로그인/로그아웃
- OAuth 로그인
- 프로필 수정
- 배송지 저장
- 장바구니
- 주문/결제
- 주문 내역 조회
- 상품 리뷰 작성
- 상품 문의 작성

### 5.2 관리자 기능

- 상품 CRUD
- 카테고리 CRUD
- 상품 이미지 순서 정렬
- 상품 활성화/비활성화
- 게시글 관리
- 주문 관리

관리자 페이지는 Hugo 템플릿으로 제공되지만 실제 데이터 처리는 PocketBase API를 직접 호출하는 방식이다.

## 6. 프런트엔드 구조

### 6.1 JS 진입 구조

`assets/js/main.js`가 ES 모듈 기준 메인 엔트리 포인트다.

여기서 아래 모듈들을 불러오고, 동시에 `window.*`에 다시 노출해 기존 인라인 스크립트와도 호환되게 구성되어 있다.

- `Cart`
- `Auth`
- `ProductsApi`
- `Reviews`
- `QnA`
- `Profile`
- `PBClient`

즉 현재 코드는 완전한 모듈 방식으로만 동작하는 구조가 아니라,
**모듈화 진행 중이지만 전역 객체 호환을 유지하는 과도기 구조**로 보는 게 맞다.

### 6.2 PocketBase 클라이언트

`assets/js/core/pb-client.js`

- PocketBase 인스턴스를 싱글톤으로 생성
- 기본 URL은 `window.SiteConfig?.pocketbaseUrl`
- 없으면 `http://127.0.0.1:8090`

즉 클라이언트 코드 대부분은 PocketBase를 직접 호출한다.

### 6.3 주요 프런트 모듈

- `assets/js/auth.js`
  - 로그인/회원가입/OAuth
  - 이메일 기억, 닉네임 중복 확인
- `assets/js/cart.js`
  - 비회원 장바구니와 로그인 장바구니 병합
  - PocketBase `carts`, `cart_items` 사용
- `assets/js/profile.js`
  - 사용자 정보 수정
  - 주문 내역 조회/취소
  - 배송조회 링크 처리
- `assets/js/reviews.js`
  - 상품 리뷰 작성/조회
- `assets/js/qna.js`
  - 상품 문의 작성/조회
- `assets/js/admin-products.js`
  - 관리자 상품/카테고리 관리
  - 이미지 업로드 및 순서 정렬

## 7. Hugo 템플릿 구조

### 7.1 상품 상세

`layouts/products/single.html`

- 프런트매터의 `images` 배열을 기준으로 Hugo 이미지 리사이징 수행
- 장바구니 버튼 제공
- 리뷰 섹션 포함
- Q&A 파셜 포함

즉 상품 상세 페이지는 정적 콘텐츠 기반이지만,
리뷰/Q&A/장바구니는 런타임 API 호출로 동작한다.

### 7.2 체크아웃

`layouts/checkout/single.html`

- 배송지
- 주문 요약
- 결제 수단
- 총액
- 하단 고정 버튼

모바일 중심 UI 비중이 높다.

### 7.3 프로필

`layouts/profile/single.html`

- 기본 정보
- 연락처/주소
- 비밀번호 변경
- 주문 내역
- 배송조회 모달

### 7.4 관리자 화면

`layouts/admin/*.html`

- PocketBase 데이터 직접 조작용 관리 화면
- 특히 상품 페이지는 `npm run sync`를 별도로 안내하고 있어,
  관리자 수정 후 정적 콘텐츠 재생성이 수동 단계로 남아 있다.

## 8. PocketBase 데이터 모델

`backend/pb_schema.json` 기준 주요 컬렉션:

- `users`
  - 이메일, username, name, avatar, phone, 주소 정보
- `products`
  - title, description, price, discount_price, images, colors, sizes, slug, language, enabled, stock, category, admin_memo
- `categories`
  - 상품 카테고리
- `posts`
  - 블로그 게시글
- `reviews`
  - 상품 리뷰
- `product_inquiries`
  - 상품 문의
- `orders`
  - 주문 정보, 구매자 정보, 상태
- `carts`
  - 장바구니 헤더
- `cart_items`
  - 장바구니 아이템

이 프로젝트의 실질적 운영 데이터 원본은 PocketBase라고 보면 된다.

## 9. 데이터 동기화 방식

### 9.1 상품 동기화

`scripts/sync-products.js`

- PocketBase `products` 컬렉션 조회
- 이미지 다운로드 후 `assets/images/products`에 저장
- 각 상품을 `content/korean/products/*.md`로 생성

### 9.2 블로그 동기화

`scripts/sync-posts.js`

- PocketBase `posts` 컬렉션 조회
- 대표 이미지 다운로드
- `content/korean/blog/*.md` 생성
- PocketBase에 없는 게시글은 로컬 파일 정리

### 9.3 실행 명령

`package.json` 기준:

- `npm run sync`
  - 상품 + 블로그 동기화
- `npm run lint`
  - `assets/js` ESLint 검사
- `npm run lint:fix`
  - 자동 수정

주의:

- 현재 동기화 스크립트는 **한국어 콘텐츠 디렉터리 중심**으로 작성되어 있다.
- 영어 콘텐츠 동기화는 자동화가 충분히 연결되어 있지 않아 보인다.

## 10. 실제 운영 흐름

가장 자연스러운 운영 흐름은 아래와 같다.

1. 관리자 화면 또는 PocketBase에서 상품/게시글 데이터 수정
2. `npm run sync` 실행
3. Hugo가 `content/`와 `assets/images/`를 사용해 정적 페이지 생성
4. 생성 결과가 `public/` 또는 `server/`로 반영
5. 생성물 포함 시 Git에 커밋 후 배포

즉 이 프로젝트는 CMS 수정만으로 끝나는 구조가 아니라,
**동기화와 정적 생성 단계가 함께 필요한 하이브리드 운영 모델**이다.

## 11. 현재 확인된 특징과 주의사항

### 11.1 생성물이 저장소에 함께 들어감

- `public/`는 `.gitignore`에 있지만 현재 워크스페이스에는 존재
- `server/`는 생성 산출물 성격인데 Git 추적 중

즉 이 저장소는 원본만 관리하는 방식과 생성물까지 같이 관리하는 방식이 섞여 있다.

### 11.2 스타일 시스템이 혼합되어 있음

- Bootstrap 클래스 사용
- Tailwind 스타일 유틸리티 형태 클래스도 사용

일관된 디자인 시스템보다는 화면별로 점진 확장된 흔적이 있다.

### 11.3 모듈화 전환 중

- ES 모듈 구조가 도입되어 있음
- 동시에 `window.Cart`, `window.Auth` 같은 전역 노출 유지

완전한 현대식 번들 구조로 정리되지는 않았다.

### 11.4 콘텐츠 소스가 중복 보관됨

- `content/*`
- `*_backup`
- 생성된 `server/*`

운영 중 데이터 복구를 염두에 둔 흔적이지만,
장기적으로는 어느 디렉터리가 기준 원본인지 헷갈릴 수 있다.

### 11.5 주문 스키마와 프런트 사용 필드 차이 가능성

`profile.js`는 주문 내역에서 `tracking_number`, `carrier` 같은 필드를 사용한다.
하지만 `pb_schema.json`에 보이는 `orders` 필드 목록에는 이 값들이 명시적으로 보이지 않는다.

즉 아래 중 하나일 가능성이 있다.

- 스키마 파일이 최신이 아님
- 실제 DB와 스키마 export가 어긋남
- 프런트가 미래 필드를 가정하고 있음

이 부분은 운영 전에 재확인이 필요하다.

## 12. 개발자가 빠르게 이해해야 할 파일

우선순위 기준 추천 순서:

1. `config/_default/hugo.toml`
2. `package.json`
3. `backend/pb_schema.json`
4. `assets/js/main.js`
5. `assets/js/core/pb-client.js`
6. `assets/js/cart.js`
7. `assets/js/auth.js`
8. `assets/js/profile.js`
9. `assets/js/admin-products.js`
10. `layouts/products/single.html`
11. `layouts/profile/single.html`
12. `layouts/admin/single.html`
13. `scripts/sync-products.js`
14. `scripts/sync-posts.js`

## 13. 추천 정리 방향

향후 유지보수를 위해 우선 추천하는 정리 순서는 아래와 같다.

1. `public/`, `server/`, `content/`, `*_backup` 중 무엇이 배포 원본인지 명확히 정리
2. 관리자 수정 후 `npm run sync`가 꼭 필요한 이유를 문서화
3. 영어 콘텐츠 동기화 범위를 명확히 정의
4. 주문 스키마와 프런트 사용 필드 일치 여부 점검
5. 전역 스크립트 의존성과 ES 모듈 구조를 단계적으로 통합
6. 배포 절차를 `빌드 -> 산출물 위치 -> 커밋 대상` 기준으로 명문화

## 14. 한 줄 결론

이 프로젝트는 **Hugo 정적 쇼핑몰을 기반으로 PocketBase를 CMS/회원/주문/리뷰 백엔드로 활용하는 하이브리드 커머스 프로젝트**이며,
운영의 핵심은 **PocketBase 데이터와 Hugo 콘텐츠/산출물을 어떻게 동기화하고 배포하느냐**에 있다.
