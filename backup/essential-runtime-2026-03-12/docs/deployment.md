# 배포 정리

## 기준 디렉터리

- 원본: `content/`, `layouts/`, `assets/`, `static/`, `scripts/`
- 배포 산출물: `server/`
- 비사용 기본 산출물: `public/`

Hugo 설정은 `config/_default/hugo.toml`의 `publishDir = "server"`를 기준으로 한다.

## 작업 순서

1. PocketBase 데이터를 반영해야 하면 `npm run sync`
2. 정적 사이트 생성은 `npm run build`
3. 미리보기 서버는 `npm run dev`
4. 배포 전 생성물 정리는 `npm run clean:server`

## 규칙

- 애플리케이션 수정은 `assets/`, `layouts/`, `content/`, `static/`에서 한다.
- `server/` 내부 파일은 직접 수정하지 않는다.
- `server/`는 Hugo 빌드 결과이므로 변경이 필요하면 원본 수정 후 다시 빌드한다.
