# 배포 정리

## 기준 디렉터리

- 원본: `content/`, `layouts/`, `assets/`, `static/`, `scripts/`
- 배포 산출물: `server/`
- 비사용 기본 산출물: `public/`

Hugo 설정은 `config/_default/hugo.toml`의 `publishDir = "server"`를 기준으로 한다.

## 작업 순서

- 패키지 매니저는 `pnpm`을 우선 사용한다.
- PocketBase 데이터를 반영해야 하면 `pnpm sync`
- 정적 사이트 생성은 `pnpm build`
- 미리보기 서버는 `pnpm dev`
- 배포 전 생성물 정리는 `pnpm clean:server`

## 규칙

- 애플리케이션 수정은 `assets/`, `layouts/`, `content/`, `static/`에서 한다.
- `server/` 내부 파일은 직접 수정하지 않는다.
- `server/`는 Hugo 빌드 결과이므로 변경이 필요하면 원본 수정 후 다시 빌드한다.

## Runtime Config 규칙

- `site-config`, `shop-config` 같은 런타임 설정은 `<script type="application/json">`로 주입한다.
- Hugo 템플릿에서 JSON script를 출력할 때는 `jsonify | safeJS`를 사용한다.
- `jsonify` 결과를 그대로 출력하거나 `safeHTML`로만 처리하면 JSON 객체가 문자열로 한 번 더 감싸질 수 있다.
- 클라이언트에서는 `textContent`를 `JSON.parse(...)`로 읽고, 필요하면 과거 이중 인코딩 산출물까지 복원할 수 있게 방어 로직을 둔다.
- 증상이 `ShopConfig is not defined`, `storeId/channels가 undefined`, `PocketBase URL이 비어 보임` 형태로 나타나면 먼저 config script 출력 형식을 확인한다.

## 점검 체크리스트

- 원본 템플릿에서 `type="application/json"` 스크립트가 `jsonify | safeJS`로 출력되는지 확인한다.
- `pnpm build` 후 `server/` 산출물의 config script 안에 JSON이 따옴표 없이 raw object로 들어갔는지 확인한다.
- `public/`는 현재 공식 배포 산출물이 아니므로 문제 재현과 검증은 `server/` 기준으로 한다.
