# 2026-03-31 Review Findings Summary

## 개요

- 대상 브랜치: `codex/deployment-cleanup`
- 기준 비교: `master`
- 범위:
  - auth/security
  - backup/repository hygiene
  - build/deployment output
  - product detail runtime

## Findings Summary

### 1. [P3] Login redirect trusts localStorage

- 파일: `assets/js/auth.js:168-171`
- 요약:
  - 로그인 이후 redirect 대상을 `localStorage.auth_redirect` 에서 그대로 읽어 `window.location.href` 로 이동시키고 있었다.
  - same-origin 검증이 없어, 같은 origin 에서 실행되는 스크립트가 값을 심으면 open redirect 로 이어질 수 있었다.
- 영향:
  - 인증 직후 의도하지 않은 경로 또는 외부 목적지로 이동할 수 있는 리스크
- 권장 조치:
  - redirect 저장 위치를 `sessionStorage` 로 제한
  - same-origin 상대경로만 허용
  - 공통 consume 함수로 redirect 처리 일원화
- 상태:
  - 작업트리에서 대응 반영

### 2. [P0] Backup includes live DB

- 파일: `scripts/create-essential-backup.mjs:25-26`
- 요약:
  - backup 생성 스크립트가 `backend/data.db`, `backend/auxiliary.db` 를 포함하고 있었고,
    실제 브랜치에도 `backup/essential-runtime-2026-03-12/backend/` 아래 DB 스냅샷이 커밋되어 있었다.
- 영향:
  - 저장소가 live PocketBase 데이터 배포 채널이 되는 심각한 정보 유출 리스크
- 권장 조치:
  - backup 대상에서 DB 파일 제거
  - 이미 커밋된 DB 스냅샷은 유출로 간주하고 정리
  - release 전 DB 포함 여부를 검사하는 preflight 추가
- 상태:
  - 작업트리에서 DB 백업 대상 제거 및 스냅샷 삭제 반영

### 3. [P1] server output points at localhost

- 파일: `server/index.html:4-7`
- 요약:
  - 커밋된 `server/` 산출물이 `localhost:1313` 로 리다이렉트하거나,
    `127.0.0.1:8090` 같은 로컬 런타임 설정을 포함하고 있었다.
- 영향:
  - 산출물을 그대로 배포하면 공개 트래픽이 로컬 주소를 참조하게 되어 실제 서비스가 깨질 수 있음
- 권장 조치:
  - clean build 기준으로만 `server/` 생성
  - dev/build 출력 디렉터리 분리
  - release preflight 에서 `localhost`, `livereload`, DB 스냅샷 검사
- 상태:
  - clean build 및 release preflight 도입
  - PocketBase URL 정책은 후속 정리 필요

### 4. [P1] QnA module loaded as classic script

- 파일: `layouts/partials/product-detail-qna.html:43-47`
- 요약:
  - `assets/js/qna.js` 가 ES module 인데, 템플릿에서 일반 `<script src>` 로 삽입되고 있었다.
  - product detail 페이지에서 bundle 보다 먼저 syntax error 가 발생할 수 있는 구조였다.
- 영향:
  - 상품 상세 Q&A 초기화 실패
- 권장 조치:
  - raw script 삽입 제거
  - bundle 내부 bootstrap 에서 `QnA.init(...)` 수행
  - 템플릿은 product id 같은 초기화 데이터만 전달
- 상태:
  - 작업트리에서 bundle 기반 bootstrap 으로 전환 완료

### 5. [P1] Reviews init runs before module exists

- 파일: `layouts/products/single.html:525-530`
- 요약:
  - `assets/js/reviews.js` 도 ES module 인데 classic script 로 삽입되고,
    바로 아래에서 `Reviews.init(...)` 를 호출하고 있었다.
- 영향:
  - product detail 페이지에서 리뷰 UI 초기화 실패 가능
- 권장 조치:
  - raw script 삽입 제거
  - bundle 내부 bootstrap 에서 `Reviews.init(...)` 수행
  - product id 는 DOM data attribute 로 전달
- 상태:
  - 작업트리에서 bundle 기반 bootstrap 으로 전환 완료

## 종합 우선순위

1. `P0` 라이브 DB 백업/커밋 차단
2. `P1` 잘못된 배포 산출물 및 로컬 주소 참조 차단
3. `P1` product detail 의 Q&A / Reviews 런타임 초기화 복구
4. `P3` auth redirect 검증 강화

## 후속 작업

- `server/` 추적 정책 재정의
- PocketBase public URL 정책 정리
- checkout / admin 영역의 남은 inline handler 및 Bootstrap 의존 제거
- CSP 현실화

## Current Status (2026-03-31)

### Finding Status Snapshot

1. `[P3] Login redirect trusts localStorage`
- 현재 상태: 대응 완료
- 반영 내용:
  - redirect 저장 위치를 `sessionStorage` 로 전환
  - same-origin 상대경로만 허용하도록 검증 추가
  - auth redirect 처리 공통화

2. `[P0] Backup includes live DB`
- 현재 상태: 대응 완료
- 반영 내용:
  - backup 대상에서 DB 파일 제거
  - 커밋된 DB 스냅샷 삭제
  - release preflight 에 DB 스냅샷 검사 추가

3. `[P1] server output points at localhost`
- 현재 상태: clean build / preflight 기준으로는 대응 완료
- 반영 내용:
  - build 전에 `server/` clean 수행
  - dev/build 출력 분리
  - `localhost:1313`, `livereload.js` 검출 가드 추가
- 메모:
  - PocketBase public URL 정책 자체는 별도 운영 정책 정리 여지 있음

4. `[P1] QnA module loaded as classic script`
- 현재 상태: 대응 완료
- 반영 내용:
  - raw script 삽입 제거
  - bundle 기반 bootstrap 으로 전환

5. `[P1] Reviews init runs before module exists`
- 현재 상태: 대응 완료
- 반영 내용:
  - raw script 삽입 제거
  - bundle 기반 bootstrap 으로 전환

### Residual Follow-up

- [layouts/products/single.html](/C:/hugo/ex/shop/layouts/products/single.html) 의 큰 inline script 분리
- admin JS 의 `alert/confirm/prompt` 흐름 치환
- `window.*` 전역 노출 추가 축소
