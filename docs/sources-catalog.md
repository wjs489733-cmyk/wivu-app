# WivU 프로토타입 소스 카탈로그

- 확인일: 2026-10-12
- 범위: React + TypeScript + Vite 기반 프론트엔드 전용 PWA 프로토타입(393×852, iOS 느낌 전환, Pretendard, Figma 변수 → CSS 커스텀 프로퍼티)
- 검증 방법
  - npm 버전·라이선스·게시일: `registry.npmjs.org`를 직접 조회함 (`dist-tags.latest` + `time`).
  - GitHub 저장소: `git ls-remote`로 존재 확인, shallow clone으로 기본 브랜치 마지막 커밋일 확인, `raw.githubusercontent.com`으로 LICENSE 원문 확인. "마지막 커밋"은 기본 브랜치 기준임.
  - 웹 문서: 공식 페이지를 직접 열어 확인함. Apple HIG는 JS 렌더링 페이지라 공식 JSON 데이터 경로로 본문을 확인함.
- 판정: **채택**(코드에 넣음) / **참고**(레퍼런스만) / **보류**(부적합)
- 확인하지 못한 항목은 `미확인`으로 표기함.

---

## 요약: 최종 채택 스택

| 영역 | 패키지 | 버전 (npm 게시일) | 비고 |
|---|---|---|---|
| UI 런타임 | `react`, `react-dom` | 19.3.0 (2026-09-09) | |
| 빌드 | `vite` | 8.3.4 (2026-10-08) | |
| 빌드 | `@vitejs/plugin-react` | 6.1.2 (2026-10-05) | peer: vite ^8 |
| 언어 | `typescript` | 6.0.3 (2026-04-16) | 공식 create-vite react-ts 템플릿이 `~6.0.2`를 씀. 7.0.2는 보류 |
| 라우팅 | `react-router` | 8.4.0 (2026-09-15) | 현재 메이저 v8. Declarative/Data 모드로 사용 |
| 전환 모션 | `motion` (`motion/react`) | 14.1.0 (2026-10-09) | push / modal / dissolve |
| 상태 | `zustand` | 5.0.15 (2026-08-13) | |
| 헤드리스 UI | `@base-ui/react` | 1.9.0 (2026-10-09) | Drawer(바텀시트), OTP Field(PIN), Dialog, Tabs, Toast |
| 캐러셀 | `embla-carousel-react` | 8.6.0 (2025-04-04) | v9는 아직 RC |
| 날짜 | `date-fns` | 4.4.0 (2026-05-29) | |
| QR | `qrcode.react` | 4.2.0 (2024-12-11) | |
| PWA | `vite-plugin-pwa` | 2.0.0 (2026-10-03) | 문제가 생기면 1.3.0(2026-05-05)으로 고정 |
| 폰트 | `pretendard` | 1.3.9 (2023-11-05) | `PretendardVariable.woff2` 직접 호스팅 + precache |
| 아이콘 fallback | `lucide-react` | 1.55.0 (2026-10-10) | `strokeWidth` / `absoluteStrokeWidth` |
| 토큰 export | TokensBrücke (Figma 플러그인 / `tokens-bruecke` CLI) | 3.18.0 (2026-10-09) | Variables·Styles를 DTCG 2025.10 JSON으로 내보냄 |
| 토큰 빌드 | `style-dictionary` | 5.6.1 (2026-10-10) | DTCG JSON → CSS 커스텀 프로퍼티 |
| 토큰 포맷 기준 | DTCG Format Module | 2025.10 (2025-10-28) | |
| 검수 기준 | WCAG 2.2, Apple HIG, KRDS 타이포 | — | |

### 바로 반영할 체크포인트

1. **브랜드 블루 대비 미달.** 흰 바탕의 `#4C80F0`, 그리고 `#4C80F0` 위의 흰 글자는 대비가 **3.71:1**임(직접 계산). WCAG 1.4.3 AA의 일반 텍스트 기준 4.5:1에 못 미침. 큰 텍스트(24px 이상, bold는 약 18.66px 이상)와 비텍스트 UI(3:1)에서만 통과함. 16~17px 버튼 라벨이나 링크 텍스트에는 진한 브랜드 토큰(예: `brand-strong`)을 따로 두는 걸 권장함. 참고로 KRDS primary-50 `#256EF4`는 흰 글자 대비 4.55:1, primary-60 `#0B50D0`은 6.83:1임.
2. **TypeScript 7.0.2**가 npm `latest` 태그(2026-07-08, 네이티브 포트)이지만, 공식 Vite 템플릿은 여전히 6.0.x를 씀. 프로토타입은 **6.0.3**으로 고정함.
3. **vaul**은 README에 "This repo is unmaintained"라고 명시돼 있음. 바텀시트는 **Base UI Drawer**(snapPoints, swipe-to-dismiss, nested 지원)로 대체함.
4. **MSW와 PWA는 같은 scope에서 충돌함.** MSW 공식 문서에 "브라우저는 scope당 Service Worker 하나만 등록"이라고 나옴. 전시용 오프라인 빌드에서는 in-memory mock 레이어(TS 픽스처 + 지연)를 쓰고, MSW는 쓰지 않거나 dev 전용으로만 둠.
5. **Ionic React는 라우터가 충돌함.** `@ionic/react-router` 9.0.7의 peer가 `react-router >=6.4.0 <7`이라 React Router v8과 같이 쓸 수 없음.
6. **폰트 precache 한도.** `PretendardVariable.woff2`는 2,057,688 B이고 Workbox `maximumFileSizeToCacheInBytes` 기본값은 2,097,152 B임. 한도 안에 들지만 여유가 약 39 KB뿐임. 기본 `globPatterns`에는 woff2가 없으므로 직접 추가해야 함.

---

## 1. 공식 디자인 가이드라인

| 이름 | 용도 | 공식 링크 | 라이선스 | 버전(확인일) | 판정 | 이유 |
|---|---|---|---|---|---|---|
| Apple HIG: Tab bars | 탭바 규칙 | https://developer.apple.com/design/human-interface-guidelines/tab-bars | Apple 문서(저작권) | 변경 로그 최신 2026-06-08 (확인 2026-10-12) | 참고 | 탭은 이동 전용이고 액션을 두지 않음. 라벨은 가능하면 한 단어. 탭바는 숨기지 않고 모달일 때만 가려짐. 배지는 중요한 정보에만 씀. Liquid Glass 플로팅 바 |
| Apple HIG: Toolbars (내비게이션 바 포함) | 상단 바·뒤로가기 | https://developer.apple.com/design/human-interface-guidelines/toolbars | Apple 문서 | 변경 로그 최신 2025-12-16 | 참고 | 2025-06에 내비게이션 바 가이드가 이 페이지로 통합됨. large title은 스크롤하면 표준 타이틀로 바뀜. 타이틀은 15자 이하. 표준 Back 심볼을 쓰고 "Back" 텍스트 라벨은 쓰지 않음. 그룹은 최대 3개 |
| Apple HIG: Sheets | 모달 시트 | https://developer.apple.com/design/human-interface-guidelines/sheets | Apple 문서 | 변경 로그 최신 2026-03-24 | 참고 | medium/large detent, 리사이즈 가능하면 grabber 표시, 스와이프로 닫기, 시트는 한 번에 하나만. Cancel은 leading, Done은 trailing |
| Apple HIG: Typography | 타입 스케일 | https://developer.apple.com/design/human-interface-guidelines/typography | Apple 문서 | 변경 로그 2025-12-16 | 참고 | iOS 기본 17pt, 최소 11pt. Dynamic Type Large 기준: Large Title 34/41, Title1 28/34, Title2 22/28, Title3 20/25, Headline·Body 17/22, Callout 16/21, Subhead 15/20, Footnote 13/18, Caption1 12/16, Caption2 11/13 |
| Apple HIG: Accessibility | 터치 타깃·대비 | https://developer.apple.com/design/human-interface-guidelines/accessibility | Apple 문서 | 변경 로그 최신 2025-06-09 | 참고 | iOS 컨트롤 기본 44×44pt, 최소 28×28pt. 17pt 이하 텍스트는 대비 4.5:1, 18pt 이상이나 bold는 3:1. 텍스트 200% 확대 지원 권장 |
| Material Design 3 | 교차 확인용 (Android 관점) | https://m3.material.io/ (Navigation bar: https://m3.material.io/components/navigation-bar/guidelines, Bottom sheets: https://m3.material.io/components/bottom-sheets/guidelines, Transitions: https://m3.material.io/styles/motion/transitions) | Google 문서 | M3 + M3 Expressive (공식 블로그 https://m3.material.io/blog/building-with-m3-expressive). 페이지가 JS 렌더링이라 세부 본문은 미확인 | 참고 | WivU는 iOS 느낌이 기준이라 2순위. 전환 패턴(fade-through 등) 이름을 맞추는 정도로 씀 |
| Google Accessibility: Touch target size | Android 터치 타깃 | https://support.google.com/accessibility/android/answer/7101858 | Google 문서 | 확인 2026-10-12 | 참고 | 최소 48×48dp, 간격 8dp 이상 |
| WCAG 2.2 | 접근성 검수 기준 | https://www.w3.org/TR/WCAG22/ | W3C 문서 (라이선스 세부 미확인) | W3C Recommendation 2024-12-12 판 | 채택 (검수 기준) | 1.4.3 대비 4.5:1 (큰 텍스트 3:1), 1.4.11 비텍스트 3:1, 2.4.11 포커스 가림 금지(AA, 2.2 신규), 2.5.8 타깃 최소 24×24 CSS px(AA) |
| WCAG 2.2 Understanding 2.5.8 | 타깃 크기 예외 조항 | https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html | W3C | 확인 2026-10-12 | 참고 | 예외는 spacing(24px 원), equivalent, inline, user agent, essential. 중요한 컨트롤은 2.5.5(Enhanced)를 목표로 하라고 권함 |
| KRDS (대한민국 정부 디자인 시스템) | 한국어 타이포·접근성·토큰 구조 | https://www.krds.go.kr/ (타이포그래피: https://www.krds.go.kr/html/site/style/style_03.html, 색상: https://www.krds.go.kr/html/site/style/style_02.html, 자료실: https://krds.go.kr/html/eng/resource/resource.html) | KRDS 이용약관(아래 라이선스 주의 참고) | Figma 라이브러리 v1.0.0, HTML 컴포넌트 키트 v1.1.0 | 참고 | 본문 최소 16px, 기본 17px, 행간 150% 이상, 굵기는 400/500/700으로 최대 4종. 모바일 스케일: Heading L 24 / M 22 / S 19, Body 19·17·15·13. 대비는 일반 4.5:1, 큰 텍스트 3:1, 선명한 화면 모드 본문 15:1 |
| KRDS HTML 컴포넌트 키트 | 토큰 CSS 구조 참고 | https://github.com/KRDS-uiux/krds-uiux (npm `krds-uiux`) | npm 표기는 ISC, README는 "KRDS 이용약관을 따름" | 1.1.0 (npm 2026-01-12, 마지막 커밋 2026-01-12) | 참고 | `resources/css/token/krds_tokens.css`에 primitive 5~95 단계 → semantic 변수와 light/고대비 모드 구조가 있음. 폰트 토큰은 `Pretendard GOV` |

## 2. 디자인 토큰 표준·툴

| 이름 | 용도 | 공식 링크 | 라이선스 | 버전(확인일) | 판정 | 이유 |
|---|---|---|---|---|---|---|
| DTCG Design Tokens Specification | 토큰 JSON 포맷 표준 | https://www.designtokens.org/tr/2025.10/ (발표: https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/, 저장소: https://github.com/design-tokens/community-group) | W3C Software and Document License | **2025.10** (2025-10-28, 첫 stable). 모듈은 Format / Color / Resolver. 이후 living draft는 https://www.designtokens.org/TR/drafts/ | 채택 (포맷 기준) | `$value`/`$type` 기반. 모드·테마는 Resolver, 색 공간은 P3/OKLCH 지원. 문서 헤더는 "Final Community Group Report"라 쓰고 본문 status에는 "Candidate Recommendation"이라 써서 표기가 섞여 있음 |
| Figma Variables 네이티브 Export/Import | 변수 → JSON | https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables | Figma 서비스 | 확인 2026-10-12 | 참고 | 컬렉션을 우클릭해 Export modes를 누르면 JSON이 나옴. Import는 DTCG 포맷만 받는다고 명시돼 있음. Export 결과가 DTCG를 완전히 준수하는지는 미확인. 텍스트 스타일은 변수가 아니라 포함 안 됨 |
| TokensBrücke | Figma Variables·Styles → DTCG JSON | https://github.com/tokens-bruecke/figma-plugin (Figma Community 플러그인 1254538877056388290) | MIT | 3.18.0 (npm 2026-10-09) | **채택** | README에 DTCG 2025.10 호환 export와 컬렉션 분리 옵션이 명시돼 있음. Styles(타이포)도 포함할 수 있고 CLI도 있음. 무료 |
| Style Dictionary | DTCG JSON → CSS 변수 빌드 | https://styledictionary.com / https://github.com/style-dictionary/style-dictionary | Apache-2.0 | 5.6.1 (2026-10-10) | **채택** | v4부터 DTCG를 지원함. 공식 문서상 2025.10 완전 지원은 "v5에서 진행 중". 기본 `$value`/`$type`/alias만 쓰면 충분함 |
| `@tokens-studio/sd-transforms` | Tokens Studio 포맷용 SD transform | https://github.com/tokens-studio/sd-transforms | MIT | 2.0.3 (2025-12-10) | 보류 | Tokens Studio 포맷을 쓸 때만 필요함. 네이티브 변수 + DTCG 경로에서는 필요 없음 |
| Tokens Studio for Figma | 토큰 관리 플러그인 | https://tokens.studio / https://github.com/tokens-studio/figma-plugin | MIT (플러그인 코드) | 플러그인 버전 미확인 (저장소 마지막 커밋 2026-10-06) | 보류 | Git sync, 멀티 테마 같은 핵심 기능이 유료(Team €39/월). 이미 Figma 네이티브 변수로 관리하고 있어 중복임 |
| Terrazzo | DTCG 검증·빌드 CLI | https://terrazzo.app / https://github.com/terrazzoapp/terrazzo | MIT | `@terrazzo/cli` 2.7.1 (2026-08-11) | 참고 (대안) | `tz check`로 DTCG를 검증할 수 있음. `tz import`(Figma)는 Variables 가져오기에 **Enterprise 플랜이 필요**해 학생 플랜에선 못 씀. 2025.10 resolver 지원은 문서 표기가 섞여 있어 미확인 |

권장 파이프라인: Figma Variables(Color / Spacing / Radius / Typography) → TokensBrücke(DTCG 2025.10 JSON, 컬렉션별 파일) → Style Dictionary 5 → `tokens.css`(`:root` 커스텀 프로퍼티). 결과 JSON은 Terrazzo `tz check`로 한 번 검증하는 걸 권장함.

## 3. 폰트

| 이름 | 용도 | 공식 링크 | 라이선스 | 버전(확인일) | 판정 | 이유 |
|---|---|---|---|---|---|---|
| Pretendard | 기본 서체 | https://github.com/orioncactus/pretendard (npm `pretendard`) | SIL OFL 1.1 | **1.3.9** (npm 2023-11-05. GitHub 최신 태그 v1.3.9, 저장소 마지막 커밋 2025-06-28) | **채택** | 아래 파일들이 npm 패키지에 있는 걸 직접 확인함. 오프라인 전시용으로 직접 호스팅할 수 있음 |
| Pretendard GOV | KRDS 지정 변형 | Pretendard 저장소 릴리스의 `PretendardGOV.zip` (KRDS 자료실 안내) | OFL | 미확인 | 참고 | 공공 서비스용 변형이라 WivU는 표준 Pretendard로 충분함 |

npm `pretendard@1.3.9` 파일 구성 (tarball 직접 확인):
- 가변 단일 파일: `dist/web/variable/woff2/PretendardVariable.woff2` (2,057,688 B), CSS는 `dist/web/variable/pretendardvariable.css`
- 가변 dynamic subset: `dist/web/variable/pretendardvariable-dynamic-subset.css` + `woff2-dynamic-subset/` 92개 파일
- 정적 dynamic subset: `dist/web/static/pretendard-dynamic-subset.css` + `woff2-dynamic-subset/` 828개 파일
- npm 패키지엔 `.min.css`가 없음. README의 `.min.css` 경로는 CDN에서 쓰는 경로임. 라이선스 원문은 `dist/LICENSE.txt`에 있음.
- font-family는 `"Pretendard Variable"`. README의 Next.js 예시는 `weight: '45 920'`이고, weight를 빠뜨리면 WebKit에서 렌더링이 어긋날 수 있다고 경고함.
- 전시 권장안: 393×852 단일 앱이라 **가변 단일 woff2 하나를 precache**하는 게 가장 단순하고 확실함. 오프라인에서 서브셋이 빠지는 일이 없음. dynamic subset을 쓰려면 런타임 캐시(CacheFirst)를 따로 설정해야 함.

## 4. React 앱 스택

| 이름 | 용도 | 공식 링크 | 라이선스 | 버전(확인일) | 판정 | 이유 |
|---|---|---|---|---|---|---|
| React | UI | https://react.dev (npm 메타데이터의 저장소: https://github.com/react/react) | MIT | 19.3.0 (2026-09-09) | 채택 | |
| Vite | 빌드·dev 서버 | https://vite.dev / https://github.com/vitejs/vite | MIT | 8.3.4 (2026-10-08) | 채택 | 공식 react-ts 템플릿 기준 스택 |
| @vitejs/plugin-react | React 플러그인 | https://github.com/vitejs/vite-plugin-react | MIT | 6.1.2 (2026-10-05) | 채택 | peer `vite ^8` |
| TypeScript | 타입 | https://www.typescriptlang.org / https://github.com/microsoft/TypeScript | Apache-2.0 | 6.0.3 (2026-04-16). `latest`는 7.0.2 (2026-07-08) | 채택 (6.0.x) | create-vite 템플릿이 `~6.0.2`를 씀. 7.x(네이티브 포트)는 주변 툴 호환이 미확인이라 보류 |
| React Router | 라우팅·스택 | https://reactrouter.com / https://github.com/remix-run/react-router | MIT | **8.4.0** (2026-09-15). v7 라인은 7.18.4 | 채택 | 현재 메이저 v8. peer는 react ≥19.2.7, engines는 Node ≥22.22.0. Framework 모드(SSR 지향)는 필요 없음. 공식 문서상 future flag를 맞춰 둔 v7에서는 "대체로 non-breaking" 업그레이드 |
| Motion (구 Framer Motion) | push/modal/dissolve 전환, 제스처 | https://motion.dev / https://github.com/motiondivision/motion | MIT | `motion` 14.1.0 (2026-10-09). `framer-motion`도 같은 버전으로 계속 배포됨 | 채택 | `import { motion, AnimatePresence } from "motion/react"`. 스프링이 기본값. Motion+(유료 예제·컴포넌트)는 필요 없음 |
| Zustand | 전역 상태 (출석·제출·설정 시연 상태) | https://github.com/pmndrs/zustand | MIT | 5.0.15 (2026-08-13) | 채택 | 가볍고 보일러플레이트가 적음 |
| MSW (Mock Service Worker) | 네트워크 레벨 모킹 | https://mswjs.io / https://github.com/mswjs/msw | MIT | 3.0.3 (2026-10-10) | 참고 | 공식 레시피에 "scope당 SW 1개"라고 나옴(https://mswjs.io/docs/recipes/merging-service-workers). PWA SW와 병합해야 해서 전시 빌드엔 부적합함. 3.x peer는 TS ≥5.9, Node ≥22.12 |
| vite-plugin-pwa | manifest·SW 생성 | https://vite-pwa-org.netlify.app / https://github.com/vite-pwa/vite-plugin-pwa | MIT | **2.0.0** (2026-10-03). 1.x 최신은 1.3.0 (2026-05-05) | 채택 | 2.0 릴리스 노트상 주 변경은 assets-generator ^2 peer 허용. 문서 사이트는 아직 v1.2.0으로 표기됨. 기본 precache는 js/css/html이라 woff2/svg/png를 추가해야 함 |
| Base UI | 헤드리스 프리미티브 | https://base-ui.com / https://github.com/mui/base-ui | MIT | `@base-ui/react` 1.9.0 (2026-10-09) | **채택** | Drawer(`snapPoints`, `swipeDirection`, 중첩), OTP Field(PIN 입력), Dialog, Tabs, Toast, Switch를 지원함. 스타일이 없어서 커스텀 DS와 충돌하지 않음 |
| vaul | 드로어/바텀시트 | https://vaul.emilkowal.ski / https://github.com/emilkowalski/vaul | MIT | 1.1.2 (2024-12-14), 마지막 커밋 2025-10-03 | 보류 | README에 "This repo is unmaintained"라고 명시돼 있음 |
| Radix Primitives | 헤드리스 프리미티브 | https://radix-ui.com/primitives / https://github.com/radix-ui/primitives | MIT | `radix-ui` 1.7.0 (2026-10-05) | 참고 (대안) | Base UI와 역할이 겹쳐서 하나만 고름 |
| Ark UI | 헤드리스 (Zag 기반) | https://ark-ui.com / https://github.com/chakra-ui/ark | MIT | `@ark-ui/react` 5.39.3 (2026-10-05) | 참고 | 역할 중복 |
| React Aria Components | 접근성 프리미티브 | https://github.com/adobe/react-spectrum | Apache-2.0 | `react-aria-components` 1.22.1 / `react-aria` 3.53.1 (2026-10-09) | 참고 | a11y 패턴 구현을 참고하는 용도. 역할 중복 |
| Stackflow (당근) | 모바일 스택 내비게이션 | https://stackflow.so / https://github.com/daangn/stackflow | MIT | `@stackflow/core` 3.1.0, `@stackflow/react` 2.1.4, `@stackflow/plugin-basic-ui` 1.19.0 | 참고 (대안) | iOS 스와이프 백, `cupertino` 테마, 스크롤 상태 유지가 됨. React Router와 라우팅 모델이 달라 둘 중 하나만 골라야 함. 탭별 스택 + 시트 조합은 RR + Motion이 자유도가 높음 |
| Embla Carousel | 캐러셀 (학식 카드, 공지 배너) | https://www.embla-carousel.com / https://github.com/davidjerleke/embla-carousel | MIT | `embla-carousel-react` 8.6.0 (2025-04-04). `next` 태그는 9.0.0-rc04 (2026-10-08) | 채택 | 헤드리스이고 가벼움. v9 정식이 나올 때까지 8.6.0에 고정 |
| Swiper | 캐러셀 | https://swiperjs.com / https://github.com/nolimits4web/Swiper | MIT | 14.3.0 (2026-09-28) | 참고 | 기능은 많지만 자체 CSS가 있어 DS 스타일을 덮어써야 함 |
| egjs-flicking (NAVER) | 캐러셀 | https://naver.github.io/egjs-flicking / https://github.com/naver/egjs-flicking | MIT | `@egjs/react-flicking` 4.17.1 (2026-09-30) | 참고 | 국내 대안 |
| date-fns | 날짜 | https://github.com/date-fns/date-fns | MIT | 4.4.0 (2026-05-29) | 채택 | `ko` 로케일 지원, tree-shaking 가능. Base UI의 peer 목록에도 date-fns ^4가 있음 |
| Day.js | 날짜 | https://day.js.org / https://github.com/iamkun/dayjs | MIT | 1.11.23 (2026-08-17) | 보류 | date-fns와 기능이 겹침 |
| qrcode.react | 학생증·출석 QR 렌더 | https://github.com/zpao/qrcode.react | ISC | 4.2.0 (2024-12-11), 저장소 마지막 커밋 2026-08-21 | 채택 | `QRCodeSVG`를 씀. React 19 peer 지원 |
| react-qr-code | QR 렌더 | https://github.com/rosskhanas/react-qr-code | MIT | 2.2.0 (2026-06-09) | 참고 (대안) | |
| react-simplikit (Toss) | 모바일 웹 훅 | https://react-simplikit.slash.page / https://github.com/toss/react-simplikit | MIT | 0.3.2 (2026-09-30). `@react-simplikit/mobile`은 v0.2.0+에 통합된 뒤 deprecated | 참고 (선택 채택) | 키보드 회피, body 스크롤 락, visual viewport, safe area 훅. 실기기에서 시연할 때 유용함 |
| Konsta UI | iOS/Material 모바일 킷 | https://konstaui.com / https://github.com/konstaui/konsta | MIT | 5.5.0 (2026-09-28) | 보류 | Tailwind 기반 픽셀 재현 킷이라 자체 토큰·컴포넌트와 스타일 체계가 이중이 되고 Tailwind 도입이 강제됨 |
| Ionic React | 하이브리드 앱 프레임워크 | https://github.com/ionic-team/ionic-framework | MIT | `@ionic/react` 9.0.7 (2026-10-07) | 보류 | `@ionic/react-router` peer가 `react-router >=6.4.0 <7`이라 v8과 충돌함. 자체 테마·컴포넌트 체계도 강함 |
| Framework7 | 모바일 앱 프레임워크 | https://framework7.io / https://github.com/framework7io/framework7 | MIT | `framework7-react` 9.2.0 (2026-09-28) | 보류 | 자체 라우터와 앱 셸 구조가 있어 커스텀 DS·RR와 구조가 충돌함 |

UI 킷 평가 요약: iOS를 흉내 내는 킷(Konsta / Ionic / Framework7)은 모두 **자체 시각 언어 + 자체 라우팅/테마**를 가지고 있어서 Figma 토큰 기반 커스텀 DS와 겹침. 헤드리스(Base UI) + Motion으로 직접 만드는 쪽이 결과물 통제력이 높음.

## 5. 아이콘 (fallback)

| 이름 | 용도 | 공식 링크 | 라이선스 | 버전(확인일) | 판정 | 이유 |
|---|---|---|---|---|---|---|
| Lucide | fallback 1순위 | https://lucide.dev / https://github.com/lucide-icons/lucide | ISC (일부 아이콘은 Feather 파생으로 LICENSE에 별도 명시) | `lucide-react` 1.55.0 (2026-10-10) | 채택 | `strokeWidth`(기본 2px)가 있고, `absoluteStrokeWidth`를 쓰면 크기와 무관하게 두께를 고정할 수 있음. 자체 아이콘 stroke 규격에 맞추기 쉬움 |
| Tabler Icons | fallback 2순위 | https://tabler.io/icons / https://github.com/tabler/tabler-icons | MIT | `@tabler/icons-react` 3.49.0 (2026-10-05) | 참고 | `stroke` prop(기본 2, outline 전용), `size` 기본 24 |
| Phosphor | 아이콘 | https://phosphoricons.com / https://github.com/phosphor-icons/react | MIT | `@phosphor-icons/react` 2.1.10 (2025-05-22) | 보류 | stroke를 연속값으로 조절할 수 없고 weight 6종(thin~duotone)만 있음. 마지막 릴리스가 2025-05 |

## 6. 한국 오픈소스 디자인 시스템

| 이름 | 용도 | 공식 링크 | 라이선스 | 버전(확인일) | 판정 | 이유 |
|---|---|---|---|---|---|---|
| 당근 SEED Design | 토큰·컴포넌트 구조 레퍼런스 | https://seed-design.io / https://github.com/daangn/seed-design | Apache-2.0 (+ NOTICE: 브랜드 리소스는 상표) | `@seed-design/react` 3.0.0 (2026-10-01), `@seed-design/css` 3.0.2, `@seed-design/rootage-artifacts` 3.0.2 (2026-10-08), `@seed-design/design-token` 1.0.5. 저장소 마지막 커밋 2026-10-08 | **참고 (최우선)** | 토큰 소스가 YAML임(`packages/rootage/color.yaml`, `collections.yaml`, `components/*.yaml` 116개). 여기서 JSON/TS/CSS를 생성함. bottom-sheet, action-sheet, chip-tablist 같은 **컴포넌트 단위 토큰** 설계가 WivU 토큰 계층 설계에 직접 참고됨. 당근 브랜드에 종속돼 있어 코드 채택은 비권장 |
| 원티드 Montage | 토큰·테마 패키지 구조 레퍼런스 | https://montage.wanted.co.kr / https://github.com/wanteddev/montage-web (iOS: montage-ios, Android: montage-android 모두 MIT) | MIT | `@montage-ui/core` / `theme` / `icon` 4.0.2 (2026-10-10). 이전 패키지명은 `@wanteddev/wds`(GitHub Packages 레지스트리, npmjs에선 404) | 참고 | `@montage-ui/theme`이 토큰·테마 정의를 담당함. 웹/iOS/Android 저장소가 모두 공개돼 있어 플랫폼별 토큰 대응을 비교할 수 있음 |
| Toss es-toolkit | 유틸 | https://es-toolkit.dev / https://github.com/toss/es-toolkit | MIT | 1.52.0 (2026-08-28) | 참고 | lodash 대체. 프로토타입 규모에선 필요할 때만 씀 |
| Toss overlay-kit | 오버레이 관리 유틸 | https://overlay-kit.slash.page / https://github.com/toss/overlay-kit | MIT | 1.9.0 (2026-02-25) | 참고 | 시트·다이얼로그를 여는 패턴 참고 |
| Toss slash | 유틸 모음 | https://github.com/toss/slash | MIT | `@toss/utils` 1.6.1은 npm deprecated, `@toss/react` 1.8.1 (둘 다 2024-10-24). 저장소 마지막 커밋 2025-12-18 | 보류 | 유지 중단 흐름이고, 후속은 react-simplikit / es-toolkit |
| Toss TDS Mobile | 토스 컴포넌트 | npm `@toss/tds-mobile` (저장소 표기 없음), 문서: https://developers-apps-in-toss.toss.im/design/components | npm 라이선스 표기 없음. 문서상 **앱인토스 파트너 한정 사용권** | 2.5.1 (2026-07-29) | 보류 | 사용권이 제한돼 있고 peer가 React ≤18임. 문서의 컴포넌트 구성(Top, ListRow, BottomCTA, Tab 등)만 패턴 참고 |
| KRDS 토큰 CSS | 공공 DS 토큰 구조 | (1번 참고) https://github.com/KRDS-uiux/krds-uiux | KRDS 이용약관 | 1.1.0 | 참고 | primitive/semantic 계층과 고대비 모드 구조 |
| Kakao / NAVER / LINE | — | LINE Design System: https://designsystem.line.me (가이드 문서만 확인) | — | — | 보류 | 코드·토큰까지 공개된 DS는 확인하지 못함. NAVER는 UI 라이브러리(egjs)만 공개 |

## 7. 오픈소스 캠퍼스 앱 (기능·UX 레퍼런스)

| 이름 | 용도 | 공식 링크 | 라이선스 | 활동(마지막 커밋) | 판정 | 이유 |
|---|---|---|---|---|---|---|
| SPARCS Buddy (KAIST) | 캠퍼스 통합 iOS 앱 | https://github.com/sparcs-kaist/app-ios | MIT | 2026-10-09 | **참고 (최우선)** | 시간표(OTL), 게시판(Ara), 피드, 택시, 통합 검색, 위젯을 한 앱에 묶은 구조라 WivU와 가장 비슷함. 기능 모듈 분리(BuddyFeatureTimetable/Feed/Post/Settings…)를 IA 참고용으로 씀 |
| SPARCS OTL Plus | 시간표·강의 | https://github.com/sparcs-kaist/otlplus-web-v4 (웹), https://github.com/sparcs-kaist/otlplus-app (Flutter) | web-v4: LICENSE 파일 없음 / app: GPL-3.0 | web-v4 2026-09-08, app 2026-10-01 | 참고 (UX만) | web-v4는 React Router 7 + framer-motion 12 + MUI로 WivU와 비슷한 스택이지만, 라이선스가 없거나 GPL이라 코드는 복사하지 않음 |
| SPARCS Ara | 커뮤니티 게시판 | https://github.com/sparcs-kaist/new-ara-web-v2 (Next.js), https://github.com/sparcs-kaist/new-ara-app-v3 (Flutter), https://github.com/sparcs-kaist/new-ara-api | web-v2: LICENSE 없음 / app-v3·api: MIT | web-v2 2026-10-12, app-v3 2026-09-27, api 2026-09-28 | 참고 | 게시판 피드·글쓰기·댓글 플로우 참고. 게시판/댓글 데이터 모델은 MIT인 api에서 참고 가능 |
| Waffle Studio SNUTT | 서울대 시간표 | https://github.com/wafflestudio/snutt-ios (Swift), https://github.com/wafflestudio/snutt-android, https://github.com/wafflestudio/snutt (서버), https://github.com/wafflestudio/snutt-webclient | ios·서버·webclient: MIT / android: LICENSE 없음 | ios 2026-10-01, android 2026-10-02, 서버 2026-09-22, webclient 2022-10-16 (비활성) | 참고 | 시간표 그리드, 강의 검색·추가, 위젯 UX. 웹 클라이언트는 오래돼서 코드 가치가 낮음 |
| Waffle Studio SNUTT-ev | 강의평가 | https://github.com/wafflestudio/snutt-ev, https://github.com/wafflestudio/snutt-ev-web | ev: MIT / ev-web: LICENSE 없음 | 2026-09-12 / 2026-08-15 | 참고 | 강의평 화면 패턴 |
| Waffle Studio 식샤 (Siksha) | 서울대 학식 | https://github.com/wafflestudio/siksha-ios, https://github.com/wafflestudio/siksha-android | LICENSE 파일 없음 | 2026-09-13 / 2026-09-12 | 참고 (UX만) | 식당별·끼니별 학식 메뉴 화면 패턴 |
| NUSMods (NUS) | 웹 시간표 빌더 | https://github.com/nusmodifications/nusmods (서비스: https://nusmods.com) | MIT | 2026-10-10 | 참고 | 모바일 대응 웹이고 홈 화면에 추가할 수 있음. 웹 시간표 그리드·충돌 처리 로직 참고. 스택은 React 18 + RR5 + Redux + webpack으로 구형이라 구조만 참고 |
| TUM Campus App | 대학 통합 앱 (독일) | https://github.com/TUM-Dev/Campus-Flutter | GPL-3.0 | 2026-06-23 | 참고 (UX만) | 캘린더, 강의, 성적, 학식, 룸맵, 통합 검색 기능 구성 참고. GPL이라 코드는 쓰지 않음 |

## 8. 상용 앱 벤치마크 (코드 없음, 패턴만)

| 이름 | 용도 | 공식 링크 | 라이선스 | 버전(확인일) | 판정 | 참고할 패턴 |
|---|---|---|---|---|---|---|
| 에브리타임 (Vinu Labs) | 시간표·게시판·학식 | https://apps.apple.com/kr/app/id642416310 | 상용 | 8.3.17 (App Store, 확인 2026-10-12) | 참고 | 요일×교시 **시간표 그리드**, 학교별 **게시판 피드**(제목, 미리보기, 공감·댓글 수), 강의평, 학식 메뉴 |
| 헤이영 캠퍼스 (신한은행) | 대학 통합 앱 | https://apps.apple.com/kr/app/id1605688685 | 상용 | 1.6.6 (App Store, 확인 2026-10-12) | **참고 (최우선)** | **모바일 학생증 → 전자출결·건물 출입**, 시간표, 학사공지, 도서관 좌석 예약까지 WivU 범위와 가장 많이 겹침 |
| 토스 | 금융 앱 UX | https://toss.im | 상용 | 확인 2026-10-12 | 참고 | 한 화면에 한 과업, 하단 고정 CTA(TDS의 `BottomCTA`), `ListRow` 정보 위계, 숫자 키패드·PIN 입력 흐름 |
| 카카오뱅크 | 금융 앱 UX | https://apps.apple.com/app/id1258016944 (검색 결과로 확인. kakaobank.com은 robots 차단으로 열람 못 함) | 상용 | 미확인 | 참고 | 카드형 홈, 간편 비밀번호(PIN 패드) 입력. 세부 패턴은 실기기에서 확인 필요 |
| 아이뮤니즈(iMuniz) | 대학 LMS 앱 | 미확인 | — | 미확인 | 보류 | 검색으로 존재·공식 페이지를 확인하지 못함. 대가대에서 실제 쓰는 LMS/학사 앱 화면을 직접 캡처해 대체하는 걸 권장함 |

## 9. PWA·모바일 웹 공식 문서

| 이름 | 용도 | 공식 링크 | 라이선스 | 버전(확인일) | 판정 | 핵심 |
|---|---|---|---|---|---|---|
| MDN `env()` | safe area | https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env | MDN 문서 (라이선스 세부 미확인) | 확인 2026-10-12 | 채택 (구현 기준) | `safe-area-inset-top/right/bottom/left`와 fallback 인자(`env(safe-area-inset-bottom, 0px)`). Baseline Widely available (2020-01~) |
| MDN `<meta name="viewport">` | viewport-fit 등 | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport | MDN | 확인 2026-10-12 | 채택 | `viewport-fit=cover`면 디스플레이 전체를 채우므로 safe-area 변수를 같이 써야 함. `interactive-widget`(키보드 리사이즈 방식) 지원. `user-scalable=no`는 접근성 문제로 쓰지 않음 |
| MDN `<length>` (dvh/svh/lvh) | 뷰포트 높이 | https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length | MDN | 확인 2026-10-12 | 채택 | `dvh`는 브라우저 UI 변화에 맞춰 바뀌지만 스크롤 중 리사이즈와 성능 저하에 주의해야 함. `vh`는 `lvh`와 같음. 앱 셸은 `100dvh`(또는 `100svh`), 내부 스크롤은 컨테이너에서 처리 |
| MDN manifest `display` | 단독 실행 | https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display | MDN | 확인 2026-10-12 | 채택 | `standalone` 사용. fallback 순서는 fullscreen → standalone → minimal-ui → browser |
| WebKit: Designing Websites for iPhone X | safe area 원전 | https://webkit.org/blog/7929/designing-websites-for-iphone-x/ | WebKit 블로그 | 2017-09-22 (2017-10-31 업데이트) | 참고 | `viewport-fit=cover`, `env()`(`constant()`는 폐기), `max(12px, env(safe-area-inset-left))` 패턴 |
| WebKit: Safari 26 beta (WWDC25) | iOS 26 홈 화면 웹앱 | https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/ | WebKit 블로그 | 2025-06-09 | 참고 | iOS 26부터 **홈 화면에 추가한 모든 사이트가 기본으로 웹 앱으로 열림**("Open as Web App" 토글). manifest 아이콘이 쓰임 |
| Apple Safari Web Content Guide: Configuring Web Applications | apple-mobile-web-app 메타 | https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html | Apple 문서 | **보관 문서**, Updated 2016-12-12 | 참고 | `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`(standalone에서만 효과), `apple-touch-icon`, `apple-touch-startup-image`, `apple-mobile-web-app-title`. status-bar-style 값은 문서에 `black` 예시만 있음. `default`/`black-translucent`는 관례로 쓰이는 값이며 이 문서에서는 미확인 |
| Workbox `workbox-build` 레퍼런스 | precache 한도 | https://developer.chrome.com/docs/workbox/reference/workbox-build | Google 문서 | 확인 2026-10-12 | 채택 | `maximumFileSizeToCacheInBytes` 기본 2,097,152 B. generateSW 기본 `globPatterns`는 `**/*.{js,wasm,css,html}` |
| vite-plugin-pwa: Service Worker Precache | precache 설정 | https://vite-pwa-org.netlify.app/guide/service-worker-precache | MIT | 확인 2026-10-12 | 채택 | `workbox.globPatterns`에 `woff2,svg,png` 등을 추가함 |

`index.html` 최소 구성 (위 문서 근거):

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes"> <!-- 보관 문서 기준 legacy, manifest display:standalone과 병행 -->
<meta name="apple-mobile-web-app-title" content="WivU">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest"> <!-- vite-plugin-pwa가 생성 -->
```

---

## 라이선스 주의

1. **Pretendard (SIL OFL 1.1)**: 폰트 파일을 앱 번들에 넣어 배포하면 저작권 고지와 OFL 전문(npm `dist/LICENSE.txt`)을 같이 넣어야 함. 폰트만 따로 판매하는 건 금지됨. LICENSE에 Reserved Font Name이 'Pretendard'(및 'Source', 'Inter', 'M PLUS 1')로 지정돼 있음. 그래서 **직접 서브셋하거나 수정한 파일을 같은 이름으로 배포하는 건 피해야 함.** 원작자가 제공한 파일(가변 woff2 / 제공된 dynamic subset)을 그대로 쓰는 걸 권장함.
2. **MIT / ISC 라이브러리** (React, Vite, React Router, Motion, Zustand, Base UI, Embla, date-fns, vite-plugin-pwa, qrcode.react[ISC], Lucide[ISC, 일부 아이콘은 Feather MIT 고지 포함]): 배포 번들에 저작권·라이선스 고지를 남겨야 함. 앱의 **설정 > 오픈소스 라이선스** 화면에 목록으로 넣는 걸 권장함. 의무도 충족하고 "출시 직전 앱" 느낌도 남.
3. **Apache-2.0** (TypeScript, Style Dictionary, React Aria, SEED Design): TypeScript와 Style Dictionary는 빌드 도구라 번들에 배포되지 않아 실질적인 고지 의무가 없음. SEED 코드를 일부라도 옮기면 LICENSE와 NOTICE를 유지하고 변경 사실을 표시해야 함. SEED NOTICE에 따르면 **당근 로고·캐릭터 같은 브랜드 리소스는 상표**이며, 사전 협의가 없으면 비상업적 용도로만 허가됨.
4. **GPL-3.0** (otlplus-app, TUM Campus App): 코드를 복사하면 WivU 전체에 GPL이 적용됨. 코드는 복사하지 않고 UX만 참고함.
5. **LICENSE가 없는 저장소** (otlplus-web-v4, new-ara-web-v2, snutt-android, snutt-ev-web, siksha-ios/android): 기본 저작권이 보호됨(All rights reserved). 코드는 쓸 수 없고 화면·흐름만 관찰함.
6. **KRDS**: KRDS 저작권 페이지에 "지적재산권의 전부를 보유한 저작물의 경우에는 출처 표기 후 별도의 허락 없이 이용이 가능"하다고 돼 있음. 토큰 구조나 타이포 규칙을 차용하면 전시 패널이나 문서에 출처를 표기함. npm `krds-uiux`의 license 필드는 ISC지만 README는 KRDS 이용약관을 따른다고 함. KRDS 명칭·로고는 쓰지 않음.
7. **Toss TDS**: 앱인토스 파트너에게만 주는 제한적 사용권임. 컴포넌트·Figma 키트·코드는 쓸 수 없고 패턴 관찰만 함.
8. **DTCG 스펙 / WCAG / MDN / Apple HIG / Material 문서**: 인용하면 출처를 표기함. DTCG 리포트는 W3C Software and Document License임(저장소 LICENSE.md에서 확인). WCAG·MDN 문서 라이선스의 세부 조항은 이번에 확인하지 않음.
9. **상용 앱 화면** (에브리타임, 헤이영 캠퍼스, 토스, 카카오뱅크): 리서치 패널에 캡처를 인용할 때는 출처를 표기하고, 로고나 화면이 WivU 산출물처럼 보이지 않게 구분함.
10. **Tokens Studio / Figma 플랜**: Tokens Studio 핵심 기능은 유료이고, Figma REST Variables API(Terrazzo import)는 Enterprise 전용임. 둘 다 학생 환경의 파이프라인으로 쓰지 않음.

## 미확인 목록

- Figma 네이티브 "Export modes" 결과물이 DTCG 2025.10을 완전히 준수하는지 (Import 쪽은 DTCG 필수라고 명시돼 있음)
- Material 3 개별 컴포넌트 페이지 본문 (JS 렌더링이라 URL만 확인함)
- Tokens Studio 플러그인 현재 버전
- Terrazzo의 DTCG 2025.10 resolver 지원 범위 (문서 표기가 섞여 있음)
- Pretendard GOV 최신 버전·배포일
- 카카오뱅크 앱 현재 버전 (App Store 페이지는 직접 열지 못함)
- 아이뮤니즈(iMuniz) 존재 여부·공식 링크
- `apple-mobile-web-app-status-bar-style`의 `default`/`black-translucent` 값 (Apple 보관 문서에는 `black` 예시만 있음)
