# WivU 코드 프로토타입 — 화면 구현 가이드 (에이전트·개발자용)

Figma `WivU_Prototyping_v3-codex` (페이지 `UXUI 디자인 (프로토타입_v4)` 294:9119)를
React + TypeScript + Vite 웹앱으로 옮긴다. **백엔드 없음 · 가상 데이터 · 겉으로 완전히 동작하는 프로토타입.**

## 0. 실행

```bash
npm run dev            # http://localhost:5173 (이미 떠 있으면 재사용. 새로 띄우지 말 것)
npx tsc -p tsconfig.app.json --noEmit   # 타입 체크 (tsc -b 대신 — 동시 실행 안전)
node scripts/shot.mjs /home shots/x.png 393 852 0     # 모바일(프레임 없음) 화면 캡처
node scripts/shot.mjs /home shots/x.png 393 852 1     # 스크롤 전체(fullPage) — 스크롤 컨테이너라 잘림. 아래 full 캡처 사용
```
스크롤 전체 캡처는 `scripts/full.mjs`를 복사해서 경로만 바꿔 쓴다(뷰포트 높이를 스크롤 높이만큼 늘려 찍음).
Playwright 브라우저: `/opt/pw-browsers/chromium` (스크립트에 이미 설정). `npx playwright install` 금지.

## 1. 소유 범위 (충돌 방지 — 반드시 지킬 것)

- **내 섹션 폴더만 쓴다**: `src/screens/<section>/` 아래 파일 생성·수정.
- 예외: Figma 스크린샷은 `design/figma/screens/<id>_<slug>.png`로 저장해도 됨.
- **수정 금지**: `src/ui/**`, `src/app/**`, `src/nav/**`, `src/store/**`, `src/data/core.ts`, `src/data/quickMenu.ts`, `src/styles/**`, `src/icons/**`, `design/**`, 설정 파일, 다른 섹션 폴더.
  - 공통 컴포넌트가 부족하면 **내 폴더 안에 로컬 컴포넌트**로 만들고, 최종 보고에 "공통화 후보"로 적는다.
  - 전역 상태가 더 필요하면 **내 폴더 안에 zustand 스토어**(`store.ts`)를 만든다. 기존 `useApp`은 읽고/액션 호출만.
- 다른 섹션 화면으로 가는 링크는 `src/app/paths.ts`의 `P` 상수만 쓴다(그 화면이 아직 없어도 경로는 확정되어 있음).
- 파일럿(수정하지 말 것): `src/screens/home/*`, `src/screens/attendance/AttendanceSheet.tsx`, `AttendanceDone.tsx`.
  출석 섹션 담당은 `src/screens/attendance/index.tsx`의 **기존 항목을 유지한 채** 자기 화면을 추가한다.

## 2. Figma 읽기 (읽기 전용 — 절대 수정 금지)

1. ToolSearch로 한 번에 로드: `select:mcp__Figma__use_figma,mcp__Figma__get_screenshot,mcp__Figma__get_metadata`
2. `use_figma` 호출 전 **반드시** Skill `figma:figma-use` 로드 (서버 필수 요건). `skillNames: "figma-use"`.
3. **구조·텍스트 덤프**: `scripts/figma-dump.js`의 코드 전체를 `use_figma`의 `code`로 보내되 첫 줄 `FRAME_IDS`만 바꾼다.
   출력: 노드 트리(좌표·크기·텍스트·폰트·색 변수 이름·반경·오토레이아웃·반응 ⚡). 텍스트 문구는 **그대로** 쓴다.
4. **스크린샷**: `get_screenshot`에 `enableBase64Response: true` (URL 다운로드는 프록시가 막음). 결과에 로컬 경로가 찍히면
   `design/figma/screens/<id>_<slug>.png`로 복사해 두고 비교에 쓴다. 긴 프레임은 `maxDimension`을 프레임 높이 이상으로.
5. **반응(인터랙션) 맵**: `design/figma/frames.json`의 해당 프레임 `interactiveNodes`/반응 목록 — 모든 연결을 코드로 옮긴다.
6. 노드를 만들거나 바꾸는 코드는 절대 실행하지 않는다.

## 3. 디자인 규칙 (v4 · '새 규칙 기준'으로 구현)

Figma는 파일럿 2장만 새 규칙이 적용돼 있고 나머지는 구버전(스타일 없는 SF Pro, 일반 프레임 버튼)이다.
**코드는 새 규칙으로 정리한 최종 모습**을 만든다. 레이아웃·문구·정보 구조는 Figma를 따르고, 스타일만 정규화.

- **타이포**: `<Text variant>`(WivU Type 15종)만. RAW 크기 → 스타일 매핑:
  ≥28 Display · 24–27 Title 1 · 20–23 굵게 → Number(수치) 또는 Title 1 · 17–19 Title 2(내비 타이틀만 Title 3) · 16 Headline ·
  15 Subhead(굵게)/Body(일반) · 14 Label(굵게)/Callout(일반) · 13 Caption 1(Strong) · 12 굵게+칩 → Caption 2 Strong · 12 일반 → Caption 2 ·
  ≤11 굵게 → Micro · ≤11 일반 → Caption 2. 메타 텍스트는 Regular 기본. 나란한 카드 제목은 같은 스타일.
- **색**: semantic 토큰만 (`var(--wivu-color-bg-*)`, `text-*`, `border-*`, `status-*`, `icon-*`). `#hex` 직접 금지(불가피하면 주석).
- **간격**: 4/8 배수 (`Stack/Row`의 `gap/p/px/py`는 타입으로 강제). 카드 좌우 16, 텍스트 좌측 20, 오른쪽 정렬선 폭−20, 카드 내부 16.
- **반경**: 카드 16 · 버튼 L14/M12/S pill · 칩 6 또는 pill · 히어로 24 (`var(--wivu-radius-*)`).
- **버튼**: `Button` (Button v4)만. 화면당 Primary 1개. 파란 배경 위 = `onBrand`/`onBrandGhost`. 가로 줄에서 나눠 쓰면 `grow`, 단독 전폭은 `block`.
- **아이콘**: `<Icon name size={16|20|24}>`. 이름 목록은 `/design-system` 페이지 또는 `src/icons/icons.generated.ts`.
  없는 아이콘이 꼭 필요하면 내 폴더에 24 viewBox, stroke 2, round cap, `currentColor` SVG 컴포넌트로 만든다.
- **섹션**: `<Section title more onMore>` + 섹션 사이 `<SectionDivider/>`. 리스트는 `<ListGroup><ListRow/></ListGroup>`.
- **고정 영역**: `Screen`이 상태바+헤더를 고정(사전 승인 규칙). 탭 루트는 `footer={<TabBar active=…/>}`,
  하위 화면 하단 버튼은 `footer={<CtaBar>…</CtaBar>}`. 스크롤 여백은 자동.
- **카드 그림자 없음**(보더만). 오버레이·떠 있는 요소만 `--wivu-elevation-*`.

## 4. 화면 패턴

```tsx
import { Screen, TopNav, Section, SectionDivider, ListGroup, ListRow, Button, CtaBar, Text, Chip, Card } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';

export function NoticeDetail() {
  const nav = useNav();
  return (
    <Screen figma="398:7759" header={<TopNav title="공지 상세" fallback={P.course()} />} footer={<CtaBar><Button>…</Button></CtaBar>}>
      …
    </Screen>
  );
}
```
- **전환**(Figma 규칙): 상세 = `nav.push(path)` · 입력/모달(학생증·QR·과제 제출·글쓰기·일정 추가·수업 추가) = `nav.modal(path)` ·
  완료/상태 = `nav.fade(path)` (기본 replace; 뒤로 가기에서 돌아오면 안 되는 완료 화면) · 탭 이동 = `nav.tab(path)` ·
  흐름 초기화(온보딩 끝) = `nav.reset(path)` · 뒤로/닫기 = `nav.back(fallbackPath)`.
- 모달 화면은 `TopNav leading="close"`, push 화면은 `leading="back"`(기본). 진입 화면의 원형 뒤로 버튼처럼 Figma 고유 형태는 로컬로 재현 가능.
- **바텀시트·상태 프레임**: Figma에서 별도 프레임인 '시트 열린 상태', '입력 중', '확인 중', '오류', '완료' 등은
  **같은 라우트 안의 상태**로 구현한다(`BottomSheet`, `useState`). 레지스트리 `figma` 배열에 해당 프레임 id를 모두 적는다.
  Flow 시작점처럼 특정 상태로 바로 들어가야 하면 쿼리(`?error=1`, `?sheet=1`)로 연다.
- 존재하지 않는 기능(실제 결제·파일 업로드 서버 등)은 **그럴듯하게 흉내**: 로딩 → 성공 토스트/완료 화면. 파일 선택은 `<input type="file">`로 실제 파일명을 받아 보여주기 가능.
- 아직 범위 밖인 목적지는 `toast('…는 다음 버전에서 열려요')`.
- 접근성: 버튼은 `<button>`, 아이콘 버튼은 `aria-label`, 터치 영역 44 이상.

## 5. 데이터·상태

- 공통 데이터: `src/data/core.ts` (기준 시각 2026-09-11(금) 9:41, 김유진, 6과목 17학점, 과제·학사일정). 섹션 데이터는 `src/screens/<section>/data.ts`.
- 문구는 Figma 텍스트 그대로. Figma끼리 서로 어긋나는 값은 core.ts 기준으로 맞추고 보고에 적는다.
- 실제 학교 규정·수치처럼 보이는 가상 정보는 만들지 않는다. 사람 이름은 'OOO' 패턴(김OO 등)·가상 인물만.
- 전역 상태 `useApp`: `selectedSchool`, `loggedIn`, `attendanceComplete`, `attendanceMethod`, `attendanceTime`, `assignmentSubmitted`, `submittedFile`, `quickMenu`, `readNotifications` + 액션
  `setSchool`, `login`, `completeAttendance(method)`, `submitAssignment(fileName)`, `setQuickMenu(ids)`, `markRead(id)`, `reset()`.
- 토스트: `toast('메시지', 'check')`. 확인창: `<Dialog>`. iOS 시스템 알림창: `<SystemAlert>`.

## 6. 등록

`src/screens/<section>/index.tsx`에서:
```tsx
export const screens: ScreenDef[] = [
  { path: P.course(':id'), element: <CourseDetail />, title: '과목 상세', figma: ['398:7666'], section: '수강과목' },
];
```
- 경로 파라미터는 `P.course(':id')`처럼 함수에 `':id'`를 넣어 패턴을 만든다. 화면에서는 `useParams()`.
- 레지스트리는 `import.meta.glob`으로 자동 수집된다(다른 파일 수정 불필요).

## 7. 검증 (완료 조건)

1. `npx tsc -p tsconfig.app.json --noEmit` 오류 0.
2. 화면마다 코드 캡처 ↔ Figma 스크린샷을 나란히 붙여(`PIL`) 보고 레이아웃·문구·위계 차이를 고친다. 의도적 차이(새 규칙 정규화)만 남긴다.
3. 프레임의 Figma 반응을 전부 클릭해 보는 Playwright 스크립트를 돌려 목적지·전환이 맞는지, 콘솔 에러 0인지 확인.
4. 393×852 기준. 375 폭에서도 깨지지 않는지 한 번 확인(텍스트 말줄임·줄바꿈).

## 8. 최종 보고 형식 (30줄 이내)

- 구현한 라우트 ↔ Figma 프레임 표
- 검증 결과(타입·캡처 비교·인터랙션 테스트·콘솔)
- Figma와 의도적으로 다르게 한 점 / Figma 데이터 불일치
- 공통화 후보(로컬로 만든 컴포넌트), 남은 이슈
