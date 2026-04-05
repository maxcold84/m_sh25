# 2026-04-05 Runtime Config Regression

## 증상

- `checkout/` 진입 시 `시스템 초기화 오류: ShopConfig가 정의되지 않음` 알림이 표시됨
- 실제로는 `shop-config` 스크립트가 없는 것이 아니라, `storeId`와 `channels`를 읽지 못해 동일한 오류 분기로 들어감

## 원인

- `layouts/partials/head.html`
- `layouts/admin/baseof.html`

위 템플릿의 `<script type="application/json">` 출력이 `jsonify` 결과를 JS 문자열처럼 이스케이프하고 있었다.

그 결과 생성물에는 아래처럼 JSON 객체 대신 문자열이 들어갔다.

```html
<script id="shop-config" type="application/json">"{\"storeId\":\"...\"}"</script>
```

클라이언트에서 `JSON.parse(scriptEl.textContent)`를 한 번만 수행하면 객체가 아니라 문자열이 반환되고,
`shopConfig.storeId` 또는 `shopConfig.channels`가 `undefined`가 되어 checkout 초기화가 실패했다.

## 조치

1. 템플릿 출력 규칙을 `jsonify | safeJS`로 통일했다.
2. 런타임 reader에서 과거 이중 인코딩 산출물도 한 번 더 복원하도록 방어 로직을 추가했다.
3. `pnpm build`로 `server/` 산출물을 재생성했다.

## 확인 범위

- 런타임 config script 정의 위치 검색:
  - `layouts/partials/head.html`
  - `layouts/admin/baseof.html`
- config reader 검색:
  - `assets/js/core/runtime-config.js`
  - `layouts/partials/checkout/scripts.html`
- 생성물 점검:
  - `server/` 전체에서 `type=application/json>"{` 패턴 검색
  - 재빌드 후 이상 패턴 미검출

## 감사 결과

- 현재 소스 기준으로 `application/json` 런타임 config를 출력하는 위치는 위 두 템플릿뿐이다.
- `server/ko/checkout/index.html`, `server/ko/profile/index.html`을 포함한 재빌드 산출물에서는 `site-config`, `shop-config`가 raw JSON object로 출력되는 것을 확인했다.
- `server/` 기준으로는 동일 원인의 추가 발생 지점이 발견되지 않았다.
- 과거 `public/` 산출물에는 오래된 출력이 남아 있을 수 있으나, 이 저장소의 공식 배포 기준은 `server/`다.

## 재발 방지 포인트

- Hugo 템플릿에서 JSON script는 반드시 `jsonify | safeJS`
- 검증 대상은 항상 `server/`
- 설정을 읽는 JS는 단순 존재 여부뿐 아니라 `storeId`, `channels` 같은 필수 필드까지 확인
