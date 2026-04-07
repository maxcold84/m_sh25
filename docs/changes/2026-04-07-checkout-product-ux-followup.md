# 2026-04-07 Checkout / Product UX Follow-up

## 목적

- 최근 진행한 checkout UX 정리와 product detail Q&A 토글 개선 내용을 한 문서로 묶어 기록한다.
- 기존 요약 문서의 남은 작업 상태 중 이미 해결된 항목을 보완한다.

## 반영 내용

### 1. Checkout 배송지 자동 연동

- [layouts/partials/checkout/shipping-address.html](/C:/hugo/ex/shop/layouts/partials/checkout/shipping-address.html)
- [layouts/partials/checkout/scripts.html](/C:/hugo/ex/shop/layouts/partials/checkout/scripts.html)

- 배송지 섹션을 checkout 공통 카드 구조에 맞춰 정리했다.
- checkout 진입 시 PocketBase auth store의 사용자 정보를 최신 record로 다시 조회해 배송지와 연락처를 자동으로 채우도록 변경했다.
- `saved_shipping_address`는 회원 주소를 덮어쓰지 않고 비어 있는 필드만 보완하도록 조정했다.
- `회원 정보 불러오기` 버튼도 동일한 최신 사용자 record를 사용하도록 맞췄다.

### 2. Checkout 결제자 정보 / 카카오페이 UX 정리

- [layouts/partials/checkout/payment-method.html](/C:/hugo/ex/shop/layouts/partials/checkout/payment-method.html)
- [layouts/partials/checkout/scripts.html](/C:/hugo/ex/shop/layouts/partials/checkout/scripts.html)

- STEP 2에서 `inicis`/`korean_payment`별로 중복되던 결제자 입력 폼을 공통 폼 1개로 합쳤다.
- 카카오페이 선택 시에도 공통 결제자 정보가 동일하게 검증되고 `customer` payload로 전달되도록 정리했다.
- 카카오페이 패널에는 별도 CTA인 `카카오페이로 결제하기` 버튼을 추가하고 하단 `결제하기`와 같은 결제 흐름으로 연결했다.

### 3. KG 이니시스 주문명 최적화

- [layouts/partials/checkout/scripts.html](/C:/hugo/ex/shop/layouts/partials/checkout/scripts.html)

- 결제창에서 긴 주문명이 어색하게 잘리는 문제를 줄이기 위해 PG 친화적인 주문명 생성 로직을 추가했다.
- 주문명은 `대표상품명 외 N개` 형태를 기본으로 하며, 채널별 byte limit을 넘지 않도록 잘라 보낸다.
- KG 이니시스는 40 byte 제한을 기준으로 축약되도록 처리했다.

### 4. Product detail Q&A 작성 폼 접기 / 펼치기

- [layouts/partials/product-detail-qna.html](/C:/hugo/ex/shop/layouts/partials/product-detail-qna.html)
- [layouts/partials/qna-list.html](/C:/hugo/ex/shop/layouts/partials/qna-list.html)
- [assets/js/qna.js](/C:/hugo/ex/shop/assets/js/qna.js)

- `문의하기` 버튼을 단순 scroll 액션에서 compose panel 토글 버튼으로 변경했다.
- 로그인 전에는 로그인 안내 패널, 로그인 후에는 작성 폼이 같은 접힘 패널 안에서 열리도록 통합했다.
- 패널이 열린 상태에서는 버튼 라벨을 `문의 작성 접기`로 바꾸고 `aria-expanded`를 동기화한다.
- 문의 등록이 완료되면 작성 패널을 다시 닫아 목록 맥락으로 복귀하게 했다.

## 확인 사항

- `hugo --gc --minify --destination tmp_checkout_verify_20260406_step2`
- `hugo --gc --minify --destination tmp_checkout_verify_20260406_kakaopay`
- `HUGO_CACHEDIR=C:\hugo\ex\shop\.hugo_cache_local hugo --gc --minify --destination tmp_checkout_verify_20260406_inicis`
- `HUGO_CACHEDIR=C:\hugo\ex\shop\.hugo_cache_local hugo --gc --minify --destination tmp_product_qna_toggle_verify`

위 명령 기준으로 Hugo 빌드는 통과했다.

## 메모

- KG 이니시스 결제창 내부는 PG hosted UI라 same-origin 정책 때문에 브라우저 개발도구에서 세부 DOM을 자유롭게 검사할 수 없다.
- 따라서 결제창 세부 노출 품질은 우리 쪽 request payload 정리와 checkout 본문 내 주문 요약 UX를 같이 관리하는 편이 안전하다.
