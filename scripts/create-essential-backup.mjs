import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const backupName = process.argv[2] ?? "essential-runtime-2026-03-10";
const root = process.cwd();
const backupRoot = path.join(root, "backup", backupName);

const includePaths = [
  "archetypes",
  "assets",
  "config",
  "content/english",
  "content/korean",
  "data",
  "i18n",
  "layouts",
  "scripts",
  "static",
  "themes/vex-hugo-main/archetypes",
  "themes/vex-hugo-main/assets",
  "themes/vex-hugo-main/layouts",
  "themes/vex-hugo-main/static",
  "themes/vex-hugo-main/theme.toml",
  "themes/vex-hugo-main/package.json",
  "backend/pb_schema.json",
  "backend/types.d.ts",
  ".gitignore",
  ".eslintrc.json",
  "go.mod",
  "go.sum",
  "package.json",
  "PROJECT_OVERVIEW.md",
  "docs/deployment.md",
  "docs/troubleshooting-blog-sync.md"
];

const excludedNotes = [
  "server/ (배포 산출물)",
  "public/ (과거 산출물)",
  "resources/ (Hugo 캐시/리소스)",
  "node_modules/ (재설치 가능)",
  "content/*_backup (구백업)",
  "sqlite-test/ (실험용)",
  "themes/vex-hugo-main/exampleSite (테마 예제)",
  "backend/*.db (운영 데이터 파일)",
  "themes/vex-hugo-main/.forestry, .sitepins (메타 설정)",
  "backend/pb_data (중복 백업본)",
  "backend/*.db-shm, backend/*.db-wal (임시 런타임 파일)",
  ".env (민감/환경별 파일이라 제외)"
];

await rm(backupRoot, { recursive: true, force: true });
await mkdir(backupRoot, { recursive: true });

for (const rel of includePaths) {
  const src = path.join(root, rel);
  const dest = path.join(backupRoot, rel);
  await mkdir(path.dirname(dest), { recursive: true });
  await cp(src, dest, { recursive: true, force: true });
}

const readme = [
  "# Essential Runtime Backup",
  "",
  `Created: ${new Date().toISOString()}`,
  "",
  "## Included",
  ...includePaths.map((item) => `- ${item}`),
  "",
  "## Excluded",
  ...excludedNotes.map((item) => `- ${item}`),
  "",
  "## Notes",
  "- 이 백업은 현재 프로젝트를 다시 빌드/수정하는 데 필요한 원본 중심으로 구성됨.",
  "- 실행 전에는 환경에 맞는 .env 파일을 별도로 준비해야 함.",
  "- 배포 산출물이 필요하면 이 백업을 복원한 뒤 pnpm build 로 server/를 재생성하면 됨."
].join("\n");

await writeFile(path.join(backupRoot, "BACKUP_README.md"), readme, "utf8");
console.log(backupRoot);
