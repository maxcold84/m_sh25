# Essential Runtime Backup

Created: 2026-03-12T07:28:11.714Z

## Included
- archetypes
- assets
- config
- content/english
- content/korean
- data
- i18n
- layouts
- scripts
- static
- themes/vex-hugo-main/archetypes
- themes/vex-hugo-main/assets
- themes/vex-hugo-main/layouts
- themes/vex-hugo-main/static
- themes/vex-hugo-main/theme.toml
- themes/vex-hugo-main/package.json
- backend/data.db
- backend/auxiliary.db
- backend/pb_schema.json
- backend/types.d.ts
- .gitignore
- .eslintrc.json
- go.mod
- go.sum
- package.json
- PROJECT_OVERVIEW.md
- docs/deployment.md
- docs/troubleshooting-blog-sync.md

## Excluded
- server/ (배포 산출물)
- public/ (과거 산출물)
- resources/ (Hugo 캐시/리소스)
- node_modules/ (재설치 가능)
- content/*_backup (구백업)
- sqlite-test/ (실험용)
- themes/vex-hugo-main/exampleSite (테마 예제)
- themes/vex-hugo-main/.forestry, .sitepins (메타 설정)
- backend/pb_data (중복 백업본)
- backend/*.db-shm, backend/*.db-wal (임시 런타임 파일)
- .env (민감/환경별 파일이라 제외)

## Notes
- 이 백업은 현재 프로젝트를 다시 빌드/수정하는 데 필요한 원본 중심으로 구성됨.
- 실행 전에는 환경에 맞는 .env 파일을 별도로 준비해야 함.
- 배포 산출물이 필요하면 이 백업을 복원한 뒤 npm run build 로 server/를 재생성하면 됨.