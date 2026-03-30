# 2026-03-30 Code Review Summary

## 개요

- 리뷰 대상: `codex/deployment-cleanup` vs `master`
- 방식: 멀티에이전트 코드리뷰 + 보안 리뷰
- 관점:
  - frontend/runtime
  - admin/data flow
  - deployment/output hygiene
  - security

## 핵심 Findings

### P0

#### 1. 백업 스크립트가 live PocketBase DB를 저장소에 포함함

- 파일:
  - `scripts/create-essential-backup.mjs:25`
  - `scripts/create-essential-backup.mjs:26`
- 영향:
  - `backend/data.db`, `backend/auxiliary.db` 가 백업 세트에 포함됨
  - 실제 브랜치에도 `backup/essential-runtime-2026-03-12/backend/` 아래 DB 스냅샷이 커밋됨
  - 소스 백업이 아니라 운영 데이터 유출 아카이브가 됨
- 메모:
  - 사용자, 주문, 리뷰, 인증 관련 데이터가 포함될 수 있으므로 우선순위가 가장 높음

### P1

#### 2. `server/` 배포 산출물이 dev/prod 상태로 섞여 있고 `localhost` 를 참조함

- 파일:
  - `server/index.html:4`
  - `server/index.html:5`
  - `server/index.html:7`
  - `server/ko/products/fdsfs/index.html:22`
  - `server/ko/products/fdsfs/index.html:61`
- 영향:
  - 루트 리다이렉트가 `//localhost:1313/ko/` 로 고정됨
  - 다수의 빌드 HTML 이 `localhost:1313` 자산과 `127.0.0.1:8090` 런타임 설정을 포함함
  - 현재 `server/` 트리는 그대로 배포 가능한 상태가 아님

#### 3. 상품 상세 Q&A 가 빌드 결과에서 깨질 수 있음

- 파일:
  - `layouts/partials/product-detail-qna.html:43`
  - `layouts/partials/product-detail-qna.html:47`
  - `assets/js/qna.js:1`
- 영향:
  - `qna.js` 는 ES module 인데 일반 `<script>` 로 내려감
  - footer bundle 이 전역을 세팅하기 전에 syntax error 가 발생할 수 있음
  - 상품 상세의 Q&A 초기화가 실패할 가능성이 큼

#### 4. 상품 상세 리뷰 초기화도 동일한 방식으로 깨질 수 있음

- 파일:
  - `layouts/products/single.html:525`
  - `layouts/products/single.html:529`
  - `assets/js/reviews.js:1`
- 영향:
  - `reviews.js` 역시 ES module 인데 classic script 로 삽입됨
  - `Reviews.init(...)` 호출 시점이 bundle 전이라 리뷰 UI 가 초기화되지 않을 수 있음

#### 5. 생성 산출물에 런타임 설정이 광범위하게 내장되어 추적됨

- 파일:
  - `server/en/index.html:1`
  - `layouts/partials/head.html:43`
  - `layouts/partials/head.html:50`
- 영향:
  - `window.SiteConfig`, `window.ShopConfig` 가 모든 빌드 페이지에 인라인으로 들어감
  - `server/` 전체를 Git 에 추적하면 환경 의존 설정이 생성물 전체로 확산됨

### P2

#### 6. 번들 fingerprint 뒤에 timestamp 쿼리를 다시 붙여 캐시 이점을 약화시킴

- 파일:
  - `layouts/partials/footer.html:49`
  - `layouts/partials/footer.html:51`
- 영향:
  - fingerprint 로 충분한데 `?v={{ now.Unix }}` 를 덧붙여 매 빌드마다 HTML 이 바뀜
  - 캐시 효율과 diff 안정성이 떨어짐

#### 7. 상품 상세 슬라이더가 중복 초기화됨

- 파일:
  - `layouts/products/single.html:363`
  - `assets/js/script.js:10`
- 영향:
  - `.product-image-slider` 에 대해 Slick 초기화가 두 번 일어남
  - 마크업 중복, dots/arrows 상태 꼬임, 페이지별 동작 불일치 가능성이 있음

#### 8. 닉네임 중복 확인 로직에 race condition 이 있음

- 파일:
  - `assets/js/auth.js:194`
  - `assets/js/auth.js:351`
- 영향:
  - 느린 이전 요청이 나중에 도착하면 현재 입력값과 무관하게 `nicknameChecked` 가 true 가 될 수 있음
  - submit 시 현재 닉네임과 마지막 검증값의 일치 여부를 강제하지 않음

#### 9. 생성물/임시 산출물이 Git 리뷰 표면을 과도하게 오염시킴

- 파일:
  - `.gitignore:1`
  - `package.json:11`
  - `package.json:13`
  - `scripts/clean-server.mjs:3`
- 영향:
  - `server/`, `backup/`, `tmp_vibe_verify_server_20260330/` 가 ignore 되지 않음
  - 이번 브랜치에서도 대량의 생성 파일이 함께 올라와 실제 소스 리뷰가 어려워짐
  - `server/` 를 dev/build 공용 출력으로 쓰면서 세대가 다른 번들이 섞일 수 있음

### P3

#### 10. 로그인 후 redirect 대상이 `localStorage` 값을 그대로 신뢰함

- 파일:
  - `assets/js/auth.js:168`
  - `assets/js/auth.js:171`
- 영향:
  - `auth_redirect` 값을 same-origin 검증 없이 `window.location.href` 에 대입함
  - same-origin 스크립트가 값을 주입하면 로그인 직후 오픈 리다이렉트가 가능함

## 참고 메모

- 추가 UI 이슈:
  - `layouts/partials/admin/nav.html:7` 의 active 조건 문자열 앞 공백 때문에 active 표시가 의도대로 동작하지 않음
- 범위에서 제외한 항목:
  - `docs/pb_data/*.db` 의 현재 작업트리 변경은 런타임 산출물로 보고 리뷰 핵심 범위에서 제외

## 검증 메모

- `npm run lint` 통과
- `node scripts/check-hugo-typos.js` 통과
- 프런트엔드 검토 중 빌드된 product HTML 에서 `/js/qna.js`, `/js/reviews.js` 가 bundle 보다 먼저 배치되는 점을 확인함
