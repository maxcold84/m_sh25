# 블로그 동기화 및 관리자 페이지 트러블슈팅

이번 작업에서 발생했던 세 가지 주요 오류 현상과 원인, 그리고 해결 방법을 문서화한 내용입니다.

---

## 1. 관리자 페이지에서 블로그 글 작성 시 "Failed to create record" 에러 발생

### 문제 현상
관리자 페이지에서 새 글을 저장할 때 알림창에 `Failed to create record.` 라는 기본 메시지만 나타나고 글이 등록되지 않음.

### 원인
* **PocketBase 유효성 검사 실패:** 사용자가 입력한 데이터가 올바르지 않거나 (예: 슬러그 중복 등) 포켓베이스가 요구하는 필수 데이터 형식을 충족하지 못해 400 Bad Request 실패 응답이 온 상황.
* **상세 에러 파싱 누락:** 프론트엔드 자바스크립트(`admin-posts.js`) 측면에서 PocketBase가 돌려준 HTTP 응답에서 구체적인 에러 필드와 사유를 파싱하지 않고 뭉뚱그려 에러 처리함.
* **HTML 검증 미작동:** 저장 버튼이 `type="button"` 이기 때문에 브라우저 기본의 폼 필수 입력(`required`) 기능이 작동하지 않아 제목 없이도 서버로 요청이 전송됨.

### 해결 방법
* `assets/js/admin-posts.js` 및 `server/js/admin-posts.js` 파일 수정.
* 저장 시 로직 맨 앞에 **필수 입력값(Title, Slug) 빈 값 체크** 추가.
* 에러를 캐치하는 부분(`catch(error)`)에서 PocketBase의 응답 데이터 원본(`error.response.data`) 내부를 순회하며 **어떤 필드가 왜 에러가 났는지 구체적인 메시지**를 수집해 사용자 알림창에 상세 안내하도록 개선.

---

## 2. 블로그 화면에서 이미지가 엑스박스로 깨지는 현상

### 문제 현상
글 동기화 툴(`npm run sync`) 실행 이후 로컬 호스트(예: `http://localhost:1313/ko/blog/fdf/`)에서 블로그 글을 열었으나 이미지가 표시되지 않고 깨짐.

### 원인
* 동기화 스크립트가 포켓베이스에서 다운로드한 이미지를 정적 폴더(`static/`)가 아닌 리소스 폴더인 `assets/images/blog/` 에 저장함.
* 기존 HTML 템플릿(`layouts/blog/single.html` 및 `layouts/partials/image.html`)은 경로 문자열을 처리할 때 단순하게 `absURL` 파이프라인만 사용하고 있음. 
* Hugo의 구조상 `assets/` 하위 파일은 명시적으로 `resources.Get` 함수를 통해 참조하지 않으면 최종 빌드(HTML 컴파일링) 결과물 안팎으로 파일이 생성되거나 노출되지 않기 때문에 이미지를 찾을 수 없음.

### 해결 방법
* `layouts/blog/single.html` 과 `layouts/partials/image.html` 에 이미지 출력 로직 재작성.
* 단순히 URL을 문자열로 쓰는 대신, `{{ $image := resources.Get .Src }}` 를 통해 에셋 파이프라인에서 이미지를 인식하게 만들었음.
* 인식이 성공하면 해당 리소스의 고유 웹 경로(`$image.RelPermalink`)를 `<img>` 태그의 `src`로 할당하도록 구조 개편.

---

## 3. 외부 이미지 URL 삽입 시 Hugo 빌드 크래시 (서버 중단) 오류

### 문제 현상
위 2번 항목 패치 후 발생한 오류로, 일부 글의 썸네일이나 본문에 `https://...` 등의 외부 웹 URL이 있는 상태에서 `hugo server -D` 프로세스가 `CreateFile ... The filename, directory name, or volume label syntax is incorrect.` 라는 에러를 내뱉고 종료됨.

### 원인
* 2번에서 추가했던 `resources.Get` 함수에 URL 형식의 문자열이 넘겨지면 Hugo가 이를 로컬 시스템 폴더 경로로 억지로 해석하려다 윈도우 OS의 폴더 이름 생성 제약 조건(`:` 콜론 문자 포함 등)을 위반하면서 생기는 파일 시스템 수준의 에러 발생.

### 해결 방법
* 에러가 났던 템플릿(`layouts/blog/single.html`, `layouts/partials/image.html`)으로 이동하여 인입되는 이미지 `.Src` 값 사전 검수 기능 도입.
* `hasPrefix` 함수를 이용해 해당 문자열이 `http://`, `https://`, 또는 `//` 로 시작되는지 판별하는 구문 추가.
* 검수 결과, 외부 웹 URL일 경우에는 `resources.Get` 함수 실행을 건너뛰고 바로 `<img>` 태그에 원래 문자열 값을 하드코딩해서 내보내도록 예외 상황 분기(Fallback) 작성 완료.
