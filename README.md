# WivU — 대학생 통합 앱 코드 프로토타입

> 출석 · 수강과목 · 시간표 · 게시판을 하나의 흐름으로.
> 2026 졸업전시 「WivU」 UX/UI 프로젝트의 **기술실증용 프론트엔드 프로토타입**입니다.
> Figma 디자인(`WivU_Prototyping_v3-codex`)을 디자인 토큰 → 컴포넌트 → 화면 순서로 코드화했습니다.
> **백엔드 없음.** 모든 데이터는 가상이고, 상태는 새로고침하면 처음으로 돌아갑니다(전시용 의도).

**바로 보기 → https://wivu.vercel.app** (PC: 전시용 폰 프레임 · 폰: 앱 전체 화면 · 홈 화면에 추가 가능)
main에 push하면 Vercel과 GitHub Pages(https://wjs489733-cmyk.github.io/wivu-app/)에 자동 배포됩니다.

## 무엇이 들어 있나

| 항목 | 내용 |
|---|---|
| 화면 | 라우트 43개 · Figma 프레임 58개 대응 → [docs/screen-map.md](docs/screen-map.md) |
| 디자인 시스템 | 앱 안 `#/design-system` 페이지 (토큰·타이포·버튼·아이콘·컴포넌트·규칙) |
| 디자인 토큰 | W3C DTCG 포맷 `design/tokens/*.tokens.json` → Style Dictionary → `src/styles/tokens.css` |
| 디자인 규칙 | [docs/design-rules.md](docs/design-rules.md) |
| 소스 카탈로그 | 참고한 가이드·오픈소스·레퍼런스 앱과 라이선스 → [docs/sources-catalog.md](docs/sources-catalog.md) |
| 구현 가이드 | 화면 추가·수정 규칙 → [docs/BUILD_GUIDE.md](docs/BUILD_GUIDE.md) |
| 아이콘 | WivU Icons v2 — 66개 · 24 그리드 · 선 1.7 → `design/icons/` ([사용 안내](design/icons/USAGE.txt) · [변경 기록](design/icons/CHANGELOG.txt)) |
| Figma 원본 데이터 | `design/figma/` — Figma 읽기 전용 추출본. **공개 저장소에는 넣지 않고 로컬에만 보관** (`npm run tokens:figma`에 필요) |

## 실행

Node.js 20.19+ 또는 22.12+ 필요.

```bash
npm install
npm run dev          # http://localhost:5173  (같은 와이파이의 폰에서 http://<내 PC IP>:5173 으로도 열림)
npm run build        # dist/ — PWA(홈 화면에 추가·오프라인 캐시) 정적 사이트
npm run preview      # 빌드 결과 미리보기
npm run build:single # dist-single/index.html — 파일 하나로 된 버전(USB·오프라인 전시용, 더블클릭으로 열림)
```

- **데스크톱**: 폰 목업 + 전시 패널(플로우 바로가기 10개, 지금 화면의 Figma 프레임 id, 앱 상태, QR로 폰에서 열기).
- **폰(폭 520px 미만)**: 전체 화면 앱. 홈 화면에 추가하면 앱처럼 실행됩니다.
- 강제 전환: 주소 뒤에 `?frame=1`(목업) / `?frame=0`(전체 화면).

## 데모 시나리오

1. **시작부터 홈까지** — 스플래시 → 소개 3장(좌우로 밀기 가능) → 학교 선택/검색 → 로그인 → 학교 정보 연동 → 알림·퀵메뉴 설정 → 홈
   - 로그인 오류 보기: 비밀번호를 3자 이하로 입력
2. **출석** — 홈 히어로 `출석 인증하기` → 아무 4자리 PIN(`0000`은 오류) → 출석 완료 → 홈이 '출석 완료'로 바뀜. QR·NFC 인증도 흉내
3. **과제 제출** — 수강과목 → 서비스디자인 → 과제 → 실제 PDF 선택 또는 '샘플 파일 첨부' → 제출 완료 → 홈 카드 '제출 완료'
4. **시간표·캘린더** — 블록 탭 → 수업 시트 → 출석 인증 / 수업 추가(겹침 검사) / 일정 추가
5. **게시판** — 수업 게시판 → 글 → 댓글·공감 / 글쓰기 → 새 글 / 팀플 참여 신청
6. **퀵메뉴** — 홈에서 홈 탭을 한 번 더 → 레디얼 메뉴. 마이 › 퀵메뉴 편집에서 바꾸면 즉시 반영

## 구조

```
design/
  icons/        WivU Icons v2 (web/*.svg · manifest.json · 미리보기) + supplement/(세트 보충)
  logos/        로고·스플래시 SVG (확정본 — 수정 금지)
  figma/        Figma 읽기 전용 추출본 (로컬 전용 · 저장소 제외)
  tokens/       W3C DTCG 토큰 (primitive · semantic · layout · typography · elevation · motion · component)
docs/           디자인 규칙 · 화면 맵 · 소스 카탈로그 · 구현 가이드
scripts/        figma-to-dtcg · build-icons · subset-font · screen-map · crawl(전 화면 점검) · shot(캡처) · figma-dump(Figma 읽기용)
src/
  styles/       tokens.css · typography.css (자동 생성) + global.css
  icons/        아이콘·로고 SVG → TS 모듈 (자동 생성)
  ui/           디자인 시스템 컴포넌트 (Button v4, Card, ListRow, Section, TabBar, Screen, BottomSheet, PinPad …)
  nav/          Figma 전환 규칙(push · modal · dissolve · 탭 즉시)을 옮긴 스택 내비게이션
  app/          라우트 경로(paths.ts) · 화면 레지스트리 · 데스크톱 전시 프레임
  store/        전역 상태 (Figma 프로토타입 변수: attendanceComplete · assignmentSubmitted · selectedSchool)
  data/         공통 가상 데이터 (기준 시각 2026-09-11 금 9:41)
  screens/      entry · home · attendance · courses · timetable · board · my · info
  design-system/ 디자인 시스템 페이지
```

## 디자인 토큰 파이프라인

```bash
npm run tokens   # design/figma/*.json → design/tokens/*.tokens.json (DTCG) → src/styles/tokens.css · typography.css · tokens.ts
npm run icons    # design/icons/web/*.svg + design/logos → src/icons/icons.generated.ts (currentColor, 16/20/24)
npm run font:subset  # Pretendard Variable → 앱에 쓰인 글자 + KS X 1001 한글 2,350자 서브셋 (2MB → 약 450KB)
```
CSS 변수 이름은 `--wivu-color-bg-surface`, `--wivu-space-16`, `--wivu-radius-14`처럼 Figma 변수 경로를 그대로 따릅니다.
Figma 변수를 바꾸면 플러그인으로 다시 추출해 `design/figma/variables.json`을 교체한 뒤 `npm run tokens` 한 번이면 반영됩니다
(Figma REST Variables API는 Enterprise 전용이라 플러그인 추출 방식을 씀).

## 배포 (퍼블리싱 직전 상태)

- `npm run build` 결과 `dist/`는 어떤 정적 호스팅에도 올릴 수 있습니다(HashRouter + 상대 경로).
- GitHub Pages: `.github/workflows/deploy.yml`이 준비되어 있습니다. **자동 배포는 꺼져 있고**, 저장소 Settings › Pages에서 Source를 GitHub Actions로 정한 뒤 Actions 탭에서 수동 실행(Run workflow)할 때만 배포됩니다.

## 기술 스택

React 19 · TypeScript · Vite 8 · React Router 8(HashRouter) · Motion · Zustand · qrcode.react · vite-plugin-pwa · Style Dictionary 5 · Pretendard(OFL 1.1).
선정 근거와 라이선스는 [docs/sources-catalog.md](docs/sources-catalog.md).

## 라이선스·데이터 고지

- 폰트 Pretendard: SIL Open Font License 1.1 (© Kil Hyung-jin). 서브셋 파일도 OFL 조건을 따릅니다.
- WivU 로고·일러스트·디자인: 원작자 소유. 로고는 형태를 바꾸지 않고 색만 적용했습니다.
- 학생·교수·게시글·공지·학식·수치는 모두 **가상 데이터**입니다. 학교 이름과 소재지만 실제 정보입니다.
