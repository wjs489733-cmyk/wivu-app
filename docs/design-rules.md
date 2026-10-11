# WivU 디자인 규칙 v4 (코드 기준)

Figma 작업 매뉴얼(v1.3, 2026-10-12)의 결정을 코드로 옮기면서 정리한 규칙입니다.
Figma 52장 롤아웃의 기준으로도 쓸 수 있습니다. **확정(Figma 결정)** / **코드 보완**을 구분해 적었습니다.

## 1. 기준
| 항목 | 값 | 출처 |
|---|---|---|
| 프레임 | 393×852 (Figma 392×852) · 폭은 유동 | 확정 |
| 폰트 | Pretendard Variable (작업용 SF Pro → 최종 Pretendard) | 확정 10-12 |
| 기준 데이터 | 2026-09-11(금) 9:41 · 김유진 · 6과목 17학점 | 확정 |

## 2. 색 — semantic 토큰만 사용
- 화면은 `bg/*`, `text/*`, `icon/*`, `border/*`, `status/*` semantic 토큰만 쓴다. primitive(`brand/500` 등) 직접 사용 금지. **확정**
- 브랜드 블루 `#4C80F0` 하나가 강조를 담당. 라임 pulse(`#B7F34D` 계열)는 팀플·장학·공강처럼 "살아있는" 상태에만. **확정**
- 코드 보완 토큰: `bg/qr-dark`, `bg/scrim`, `bg/on-brand-ghost`(20%), `bg/on-brand-chip`(18%), `text/on-brand-muted`(85%) — Figma RAW 값을 토큰화.
- **결정 대기 — 대비(WCAG AA 4.5:1)**: 흰 배경 위 `text/brand` 3.71:1, `text/tertiary` 2.54:1, 라임 텍스트 2.47:1.
  제안: 채움색은 유지하고 텍스트 전용 토큰만 진하게(`text/brand-strong` #3366D6 = 5.23:1 등).

## 3. 타이포 — WivU Type 15종
| 스타일 | 크기/행간 · 굵기 | 용도 |
|---|---|---|
| Display | 28/36 Bold | 히어로 과목명, 온보딩·완료 타이틀 |
| Title 1 | 24/32 Bold | 탭 루트 타이틀, 상세 히어로 제목 |
| Title 2 | 18/26 Bold | 섹션 타이틀 |
| Title 3 | 17/24 Semibold | 상단 내비 타이틀, 홈 헤더 월 |
| Headline | 16/24 Semibold | 카드 제목, 버튼 L |
| Subhead | 15/22 Semibold | 리스트 행 제목 |
| Body | 15/24 Regular | 본문 |
| Label | 14/20 Semibold | 요약 행 제목, 타일 라벨, 버튼 M |
| Callout | 14/20 Regular | 보조 본문 |
| Caption 1 Strong / Caption 1 | 13/18 Semibold / Regular | 버튼 S·강조 메타 / 메타·더보기 |
| Caption 2 Strong / Caption 2 | 12/16 Semibold / Regular | 칩·태그 / 날짜·보조 메타 |
| Micro | 11/14 Semibold | 배지. 11px 미만 금지 |
| Number | 24/30 Bold | 수치 강조 |
- 메타 텍스트는 Regular가 기본(Semibold 남발 금지). 나란한 카드 제목은 같은 스타일. **확정**
- RAW 크기 → 스타일 자동 매핑 규칙은 BUILD_GUIDE §3. 10px 블록 텍스트 등은 Caption 2로 올림. **코드 보완**

## 4. 간격·형태
- 간격 4/8 배수(2·4·8·12·16·20·24·32). 카드 좌우 16, 텍스트 좌측 20, 오른쪽 정렬선 폭−20, 카드 내부 16. **확정**
- 코드에서는 `Stack/Row`의 간격 prop이 이 스케일만 받도록 **타입으로 강제**. **코드 보완**
- 반경: 카드 16 · 버튼 L 14 / M 12 / S pill · 칩 6 또는 pill · 히어로 24(코드 토큰화) · 시트 상단 24.
- 카드는 그림자 없이 1px `border/default`. 그림자는 오버레이(시트·토스트·플로팅)와 FAB만. **확정 + 보완**

## 5. 컴포넌트
- **버튼 = Button v4만.** L h52 r14 Headline / M h44 r12 Label / S h32 pill Caption 1 Strong.
  Type: Primary(화면당 1개) · Soft · Outline · OnBrand · OnBrandGhost. **확정**
  - 코드 보완: Pressed(98% 축소+밝기 94%), 모든 타입 Disabled(`bg/disabled` — Figma는 흰 배경에서 안 보이는 `bg/subtle`), 로딩, `dark`(라임 카드 위 진한 버튼).
- **아이콘**: 16/20/24, 선 두께 = 크기/12, `currentColor`. 레이디얼 1.6 stroke 아이콘은 2(round)로 보정. `chevron-down/left/up`은 코드 파생. **확정 + 보완**
- **섹션**: 제목 Title 2 + '전체 N ›'(Caption 1 tertiary + 셰브론 16, 오른쪽 정렬선). 섹션 사이 전폭 1px 구분선. **확정**
- **리스트**: 흰 카드 안 그룹 리스트, 행 패딩 14, 행 사이 1px. **확정**
- **칩 색 매핑**: 학사·전공·중식 → brand / 장학·UX리서치 → pulse / 행사·석식·학점 → neutral / D-DAY → danger. 필터 칩 선택 = brand(코드 통일; Figma 일부는 ink).

## 6. 화면 구조
- **상태바 + 헤더 고정**(사전 승인): 스크롤해도 흰 배경으로 고정, 스크롤 시 1px 라인.
- 탭 루트: 왼쪽 큰 타이틀(Title 1) + 오른쪽 24 아이콘, 하단 탭바(출석·수강과목·홈·시간표·게시판, 가운데 홈 범프).
- 하위 화면: 가운데 타이틀(Title 3) + 뒤로. 모달 화면은 X. 하단 버튼은 고정 CTA 바.
- 진입 화면: 원형(44) 뒤로 버튼 + 진행 막대. '건너뛰기'는 [다음] 바로 위 가운데(캔버스 메모 반영).
- 바텀시트: Figma의 '배경 복제 + 딤 + 시트' 프레임 → 실제 오버레이(핸들 드래그로 닫기).

## 7. 전환 (Figma 프로토타입 규칙 그대로)
| 동작 | 전환 | 시간 |
|---|---|---|
| 상세 진입 | push (오른쪽→왼쪽, 아래 화면 −28% 패럴랙스) | 0.3s |
| 입력·모달 | 아래→위 | 0.3s |
| 완료·상태 | dissolve | 0.25s |
| 탭 이동 | 즉시 | — |
| 뒤로·닫기 | 들어온 전환의 역방향 | — |
이징 `cubic-bezier(0.32, 0.72, 0, 1)` (iOS 내비게이션 근사). 시스템 '동작 줄이기' 설정 존중.

## 8. 상태 (Figma 변수 → 코드)
- `attendanceComplete` → 홈·출석 탭 히어로 자동 분기 (Figma CONDITIONAL 대체)
- `assignmentSubmitted` → Figma에선 미사용 → 코드에서 홈 카드·타임라인·과제 상세에 연결
- `selectedSchool` → 로그인·연동·홈 헤더·마이에 반영
- 퀵메뉴 → 초기 설정·마이 편집·홈 레디얼이 같은 상태 공유

## 9. 접근성
터치 영역 44 이상 · 버튼은 실제 `<button>` · 아이콘 버튼 `aria-label` · 포커스 링 · 시트/다이얼로그 `aria-modal` · 동작 줄이기 존중. 대비 이슈는 §2 결정 대기.
