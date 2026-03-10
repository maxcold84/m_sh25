---
name: hugo_expert
description: Hugo 정적 사이트 생성기 개발을 위한 전문가 가이드 및 유틸리티입니다. 템플릿 패턴, 디버깅 및 모범 사례를 포함합니다.
---

# Hugo Expert Skill

이 스킬은 Hugo 프로젝트 작업을 위한 전문적인 지식과 패턴을 제공합니다. Context7에서 수집한 정보를 바탕으로 작성되었습니다.

## 핵심 개념 및 패턴 (Core Concepts & Patterns)

### 1. 재귀적 메뉴 렌더링 (Recursive Menu Rendering)
중첩된 메뉴를 처리할 때는 재귀적 파셜(recursive partial) 전략을 사용하세요.
**Pattern:**
자식 요소에 대해 자기 자신을 호출하는 파셜을 정의합니다.

```go-html-template
{{- define "partials/inline/menu/walk.html" }}
  {{- $page := .page }}
  {{- range .menuEntries }}
    <li>
      <a href="{{ .URL }}" class="{{ if $page.IsMenuCurrent .Menu . }}active{{ end }}">
        {{ .Name }}
      </a>
      {{- with .Children }}
        <ul>
          {{- partial "partials/inline/menu/walk.html" (dict "page" $page "menuEntries" .) }}
        </ul>
      {{- end }}
    </li>
  {{- end }}
{{- end }}
```

### 2. 템플릿 디버깅 (Debugging Templates)
개발 중에 변수를 검사하려면 `debug.Dump`를 사용하세요. 복잡한 데이터 구조를 확인할 때 매우 유용합니다.
```go-html-template
<pre>{{ debug.Dump site.Data.books }}</pre>
```

### 3. 템플릿 존재 여부 확인 (Check Template Existence)
동적인 파셜 이름을 사용할 때, 파셜이 존재하는지 먼저 확인하여 에러를 방지하세요.
```go-html-template
{{ if templates.Exists "partials/my-partial.html" }}
  {{ partial "partials/my-partial.html" . }}
{{ end }}
```

### 4. QR 코드 생성 (QR Code Generation)
내장된 기능을 사용하여 페이지 링크에 대한 QR 코드를 쉽게 생성할 수 있습니다.
```gohtml
{{ with images.QR .Permalink (dict "targetDir" "images/qr") }}
  <img src="{{ .RelPermalink }}" alt="QR Code">
{{ end }}
```

## 프로젝트 구조 모범 사례 (Project Structure Best Practices)

- **Layouts**: `_default` 폴더는 기본 템플릿(single.html, list.html)을 위해 유지하세요.
- **Partials**: 재사용 가능한 컴포넌트(네비게이션, 푸터, 카드 등)는 `layouts/partials/`에 두고 적극적으로 활용하세요.
- **Assets**: SCSS, JS 파일은 `assets/` 폴더에 위치시켜 Hugo Pipes 처리를 활용하세요.

## 일반적인 작업 (Common Operations)

### Asset Processing (Hugo Pipes)
SCSS 파일을 컴파일하고 캐시 버스팅(fingerprinting)을 적용하는 예시입니다.
```go-html-template
{{ $style := resources.Get "css/main.scss" | resources.ToCSS | resources.Minify | resources.Fingerprint }}
<link rel="stylesheet" href="{{ $style.RelPermalink }}">
```

## 성능 최적화 (Performance Optimization)

### 1. 자산 최적화 (Asset Optimization)
프로덕션 빌드 시에는 자산을 최소화(Minify)하고 핑거프린팅(Fingerprint)하여 로딩 속도를 높이고 캐싱 문제를 해결하세요.

**JavaScript 최적화 예시:**
```go-html-template
{{ with resources.Get "js/main.js" }}
  {{ $opts := dict "minify" (not hugo.IsDevelopment) "target" "es2015" }}
  {{ $js := . | js.Build $opts }}
  {{ if not hugo.IsDevelopment }}
    {{ $js = $js | fingerprint }}
  {{ end }}
  <script src="{{ $js.RelPermalink }}" {{ if not hugo.IsDevelopment }}integrity="{{ $js.Data.Integrity }}"{{ end }}></script>
{{ end }}
```

### 2. 이미지 처리 (Image Processing)
Hugo의 강력한 이미지 처리 기능을 사용하여 원본 이미지를 최적화된 크기와 포맷으로 제공하세요.

**이미지 리사이징 및 WebP 변환:**
```go-html-template
{{ $src := resources.Get "images/photo.jpg" }}
{{ $tiny := $src.Resize "500x q85 webp" }}
<img src="{{ $tiny.RelPermalink }}" width="{{ $tiny.Width }}" height="{{ $tiny.Height }}">
```

**이미지 캐시 설정 (hugo.toml):**
이미지 처리 결과물을 별도 디렉토리에 캐시하여 빌드 속도를 높일 수 있습니다.
```toml
[caches.images]
dir = ":cacheDir/images"
```

### 3. 파셜 캐싱 (Partial Caching)
복잡한 연산이나 외부 API 호출이 포함된 파셜은 `partialCached`를 사용하여 결과를 캐시하세요.

```go-html-template
{{/* 사이트 전체에서 한 번만 렌더링되고 캐시됨 */}}
{{ partialCached "partials/expensive-calculation.html" . }}

{{/* 각 섹션별로 다르게 캐시하고 싶을 때 */}}
{{ partialCached "partials/sidebar.html" . .Section }}
```

### 4. 사용하지 않는 리소스 정리 (Garbage Collection)
이미지 처리 로직이 변경되면 사용하지 않는 파생 이미지들이 쌓일 수 있습니다. 정기적으로 GC를 실행하세요.
```bash
hugo --gc
```
