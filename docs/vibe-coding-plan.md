## 🎯 목표
 **production-ready** 수준으로 리팩토링한다.
- single.html → 가장 먼저 완전 재작성 (최우선)
- cart.js → 옵션 버그 + UX 개선
- sync-products.js → 안전성 한 단계 더 업그레이드

### 1. layouts/products/single.html (3/10 → 9/10 목표)
- 이미지 갤러리 완전 버그 (Resize만 하고 렌더링 안 함)
- Add to Cart 버튼 기능 전혀 없음
- 구조, partial, i18n, 가격 표시 등 전부 정리 필요

### 2. assets/js/cart.js (7.5/10 → 9.5/10 목표)
- 가장 큰 버그: 같은 상품 다른 color/size가 하나로 합쳐짐
- alert() 제거 → Toast로 교체
- 옵션 키 제대로 만들어서 variant 구분
- N+1, realtime subscription 등 개선

### 3. scripts/sync-products.js (8.5/10 → 9.5/10 목표)
- per-product try-catch 추가
- slug validation
- 이미지 캐싱(Etag) 옵션 추가

## 바이브
- "가볍고 빠르고, Hugo + PocketBase + Vanilla JS" 철학 유지
- 코드 깔끔하고, 주석 한국어로 잘 달기
- partial 적극 활용, Alpine.js나 vanilla 이벤트 위주
- SEO, 접근성, 모바일도 신경 쓰기

## 작업 순서
1. single.html 완전 재작성 (오늘 안에 끝내기)
2. cart.js 리팩토링
3. sync-products.js 개선
4. 필요하면 새로운 partial 파일 생성

### 1: single.html
너는 Hugo + PocketBase 전문 프론트엔드 개발자야.

파일: layouts/products/single.html

현재 이 파일은 거의 깨져 있다. 
아래 코드 리뷰를 정확히 반영해서 **완전히 새로 작성**해줘.

리뷰 내용:
- 이미지 처리 완전 버그: Resize만 하고 실제 <img>나 picture 태그가 없음
- Add to Cart 버튼이 단순 텍스트일 뿐, data-attribute나 이벤트가 전혀 없음
- 구조가 거의 없음 (define main도 불확실)
- variant selector, 수량, 가격 strikethrough, 리뷰 섹션 등 전혀 없음
- partial 적극 활용 (_product-gallery.html, _product-price.html, _add-to-cart.html 등)

요구사항:
1. Hugo partials 적극 분리해서 깔끔하게
2. 이미지 → picture + srcset + lazy loading + lightbox 준비
3. Add to Cart 버튼에 data-product-id, data-variant-options 등 제대로 넣어서 cart.js와 연동
4. color / size selector (현재 product.Params.colors, sizes 사용)
5. 가격 표시 (original vs sale)
6. 한국어 i18n 제대로 사용 ({{ i18n "..." }})
7. Alpine.js나 vanilla JS로 수량 +/- 버튼
8. SEO meta (title, description, og:image)도 포함

전체 코드를 완전히 새로 작성해줘. 기존 코드는 참고만 하고, 새롭게 만들어.

### 2: cart.js
파일: assets/js/cart.js

현재 가장 큰 버그:
- addItem에서 product_id만으로 중복 체크 → 같은 상품 다른 color/size가 하나로 합쳐짐

리뷰 요구사항:
- 옵션별 variant 키 제대로 만들기 (product_id + JSON.stringify(options) 또는 variant_id)
- alert() 전부 제거하고 Toast notification으로 교체 (기존 toast 함수 있으면 활용, 없으면 간단한 하나 만들어줘)
- cart merge 로직은 그대로 유지하면서 더 깔끔하게
- N+1 문제 개선 (가능하면 cart_items에 필요한 정보 denormalize)
- realtime subscription (pb.collection('cart_items').subscribe) 추가 고려
- 코드 모듈화 (core / ui / manager 느낌으로 주석 달아주기)

기존 cart merge 로직은 최고로 평가받았으니 그 부분은 최대한 유지하면서 버그만 잡아줘.
전체 코드를 리팩토링해서 다시 작성해.

### 3: sync-products.js
파일: scripts/sync-products.js

현재는 이미 8.5점으로 잘 만들어져 있다.

추가 개선사항:
1. for loop 안에 개별 product try-catch 추가 (하나 실패해도 전체 멈추지 않게)
2. slug 필드 필수 체크 + validation (없으면 id로 fallback하면서 console.warn)
3. --force 플래그 추가 (이미 존재해도 강제 업데이트)
4. 이미지 다운로드 시 ETag나 If-Modified-Since 간단 체크 (선택사항)
5. rich text description을 frontmatter에 넣을 때 HTML 엔티티 이스케이프 안전하게

전체 스크립트를 위 개선사항 반영해서 다시 작성해줘.
dry-run, cleanup 로직은 그대로 유지하면서 더 안전하게.

