import { NOW } from '@/data/core';

/* ────────────────────────────────────────────────────────────
 * 홈 › 알림·정보 데이터 (v5 · 피드백 반영)
 *   학식 681:5684 · 알림함 681:5798(+ 모두 읽음 701:8991)
 *   학사 공지 목록 688:6810 · 상세 688:6925 · 강의실 지도 688:6715(+ 안내 중 702:8726 · 도착 702:8831)
 * Figma 문구 그대로. n2–n7 공지 본문·월–목 식단·지도 건물 정보는 '가상' 데이터(실제 규정·수치 아님).
 * ──────────────────────────────────────────────────────────── */

/* ── 알림함 ─────────────────────────────────────────────── */
export type NotiFilter = 'all' | 'attendance' | 'assignment' | 'notice' | 'board';
export type NotiTarget =
  | { kind: 'attendance' }
  | { kind: 'assignment' }
  | { kind: 'boardPost'; id: string }
  | { kind: 'courseNotice' }
  | { kind: 'academicNotice'; id: string }
  | { kind: 'board' }
  | { kind: 'calendarEvent' };

export type Noti = {
  id: string;
  group: '오늘' | '어제' | '이번 주';
  category: string;
  filter: Exclude<NotiFilter, 'all'> | null;
  time: string;
  title: string;
  body: string;
  /** 처음부터 안 읽은 알림 (읽으면 useApp.readNotifications에 기록 → 점이 사라짐) */
  unread: boolean;
  /** 오늘 확인이 필요한 알림 — 카테고리 파랑 + 제목 Body 2 Strong.
   *  v5 701:8991(모두 읽음)에서도 굵기는 그대로이고 점만 사라지므로 '읽음'과 따로 둔다. */
  highlight?: boolean;
  to: NotiTarget;
};

export const NOTI_FILTERS: { value: NotiFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'attendance', label: '출석' },
  { value: 'assignment', label: '과제' },
  { value: 'notice', label: '공지' },
  { value: 'board', label: '게시판' },
];

/* 시각은 Figma 681:5798 그대로. (댓글 09:57은 상태바 9:41보다 뒤 — 게시판 상대 시각 '12분 전' 기준과 맞춘 값이라 유지, 보고) */
export const NOTIFICATIONS: Noti[] = [
  { id: 'nt-comment', group: '오늘', category: '게시판', filter: 'board', time: '09:57', title: '내 글에 댓글 2개가 달렸어요', body: '“서비스 분석 리포트, 분석 대상 겹쳐도…”', unread: true, highlight: true, to: { kind: 'boardPost', id: 'p1' } },
  { id: 'nt-attend', group: '오늘', category: '출석', filter: 'attendance', time: '09:40', title: '서비스디자인 출석 인증이 열렸어요', body: '디자인관 302호 · 10:10까지', unread: true, highlight: true, to: { kind: 'attendance' } },
  { id: 'nt-assign', group: '오늘', category: '과제', filter: 'assignment', time: '09:00', title: '서비스 분석 리포트 오늘 마감', body: '23:59까지 · 아직 제출하지 않았어요', unread: true, highlight: true, to: { kind: 'assignment' } },
  { id: 'nt-course-notice', group: '오늘', category: '공지', filter: 'notice', time: '08:30', title: '서비스디자인 새 공지', body: '오늘 수업 진행 방식 안내', unread: false, to: { kind: 'courseNotice' } },
  { id: 'nt-academic', group: '어제', category: '학사', filter: 'notice', time: '18:20', title: '2학기 중간고사 시행 안내', body: '10.19(월)–10.23(금) 시험 기간', unread: false, to: { kind: 'academicNotice', id: 'n1' } },
  { id: 'nt-team', group: '어제', category: '팀플', filter: 'board', time: '13:05', title: 'UX 리서치 팀플 모집이 곧 마감돼요', body: '사용자 인터뷰 팀원 · D-2', unread: false, to: { kind: 'board' } },
  { id: 'nt-fair', group: '이번 주', category: '일정', filter: null, time: '10.05', title: '취업박람회가 캘린더에 추가됐어요', body: '10.12(월) 14:00 · 학생회관 대강당', unread: false, to: { kind: 'calendarEvent' } },
];
export const NOTI_GROUPS = ['오늘', '어제', '이번 주'] as const;

/* ── 학식 ───────────────────────────────────────────────── */
export type CafeteriaId = 'student' | 'staff' | 'dorm';
export const CAFETERIAS: { value: CafeteriaId; label: string; place: string }[] = [
  { value: 'student', label: '학생식당', place: '학생식당 1층' },
  { value: 'staff', label: '교직원식당', place: '학생회관 2층' },
  { value: 'dorm', label: '기숙사식당', place: '기숙사 1층' },
];

/** 이번 주 월–금 (10/5 – 10/9) · 오늘 금 9 */
export const MEAL_DAYS = [
  { d: 5, dow: '월' },
  { d: 6, dow: '화' },
  { d: 7, dow: '수' },
  { d: 8, dow: '목' },
  { d: 9, dow: '금' },
] as const;
export const MEAL_TODAY = NOW.getDate(); // 9
export const MEAL_MONTH = NOW.getMonth() + 1; // 10

export type MealKind = '중식' | '석식';
export type Meal = {
  kind: MealKind;
  main: string;
  sides: string;
  price: string;
  /** 시간대별 혼잡도 0–1 (8칸). 가장 높은 칸이 '가장 붐벼요' 막대 */
  crowd: number[];
  /** 가장 붐비는 시간 'HH:MM–HH:MM' */
  peak: string;
};

export const MEAL_TIME: Record<MealKind, { range: string; axis: string[] }> = {
  중식: { range: '11:30–13:30', axis: ['11:30', '12:00', '12:30', '13:00'] },
  석식: { range: '17:00–18:30', axis: ['17:00', '17:30', '18:00', '18:30'] },
};

/** 가격은 Figma 681:5684(금 학생식당) 값 한 가지로 통일 — 식당·요일별 실제 가격처럼 보이는 가상 수치를 만들지 않음 */
const LUNCH_PRICE = '5,500원';
const DINNER_PRICE = '5,000원';
/* 혼잡도 — 금 학생식당은 Figma 막대 높이(64 기준) 그대로 */
const LUNCH_CROWD = [24, 32, 40, 59, 62, 54, 35, 24].map((h) => h / 64);
const DINNER_CROWD = [27, 41, 57, 52, 34, 24, 19, 16].map((h) => h / 64);
const STAFF_CROWD = [30, 44, 61, 56, 42, 30, 22, 16].map((h) => h / 64);
const L = (main: string, sides: string, crowd = LUNCH_CROWD, peak = '12:10–12:40'): Meal => ({ kind: '중식', main, sides, price: LUNCH_PRICE, crowd, peak });
const D = (main: string, sides: string, crowd = DINNER_CROWD, peak = '17:20–17:50'): Meal => ({ kind: '석식', main, sides, price: DINNER_PRICE, crowd, peak });
const SL = (main: string, sides: string) => L(main, sides, STAFF_CROWD, '12:00–12:30');

/** 식단[날짜][식당] — 금(9) 학생식당은 Figma 681:5684 그대로, 나머지는 가상 식단 */
export const MENUS: Record<number, Record<CafeteriaId, Meal[]>> = {
  5: {
    student: [L('제육덮밥', '미소된장국 · 단무지 · 배추김치'), D('짜장면', '군만두 · 단무지 · 양파')],
    staff: [SL('갈비탕', '잡곡밥 · 깍두기 · 숙주나물'), D('비빔밥', '된장찌개 · 계란후라이')],
    dorm: [L('카레라이스', '미니돈까스 · 샐러드 · 배추김치'), D('닭갈비덮밥', '어묵국 · 깍두기')],
  },
  6: {
    student: [L('치킨마요덮밥', '유부장국 · 단무지 · 배추김치'), D('순두부찌개', '쌀밥 · 계란말이 · 김구이')],
    staff: [SL('생선구이 정식', '된장국 · 시금치나물 · 깍두기'), D('김치찌개', '쌀밥 · 두부조림')],
    dorm: [L('돈부리', '미소된장국 · 샐러드'), D('떡볶이', '튀김 · 순대 · 어묵국')],
  },
  7: {
    student: [L('함박스테이크', '크림스프 · 양배추 샐러드 · 피클'), D('콩나물국밥', '깍두기 · 김구이')],
    staff: [SL('불고기 정식', '미역국 · 잡채 · 배추김치'), D('잔치국수', '김밥 · 단무지')],
    dorm: [L('오므라이스', '미니우동 · 단무지'), D('부대찌개', '쌀밥 · 계란찜')],
  },
  8: {
    student: [L('비빔국수', '군만두 · 단무지 · 요구르트', [14, 20, 28, 42, 46, 38, 22, 14].map((h) => h / 64), '12:15–12:40'), D('돼지국밥', '부추무침 · 깍두기')],
    staff: [SL('닭볶음탕', '쌀밥 · 계란말이 · 깍두기'), D('냉모밀', '유부초밥 · 단무지')],
    dorm: [L('참치김치볶음밥', '계란국 · 깍두기'), D('치킨까스', '양배추 샐러드 · 크림스프')],
  },
  9: {
    student: [L('돈까스', '우동 · 단무지 · 깍두기 · 요구르트'), D('김치볶음밥', '미역국 · 계란후라이 · 깍두기')],
    staff: [SL('소고기무국 정식', '잡곡밥 · 고등어구이 · 배추김치'), D('제육쌈밥', '된장국 · 쌈채소')],
    dorm: [L('마파두부덮밥', '계란국 · 단무지'), D('쫄면', '김밥 · 어묵국')],
  },
};

/* ── 학사 공지 ──────────────────────────────────────────── */
export type NoticeCategory = '학사' | '장학' | '행사';
export type NoticeAction = 'calendar' | 'apply' | 'portal';
export type AcademicNotice = {
  id: string;
  category: NoticeCategory;
  /** 분류 뒤에 붙는 '중요' 배지 */
  important?: boolean;
  /** 목록 제목 (짧은 제목) */
  short: string;
  /** 목록 날짜 'MM.DD' */
  date: string;
  /** 작성 부서 */
  author: string;
  title: string;
  /** 상세 메타 '부서 · MM.DD (요일) · 조회 N' */
  meta: string;
  /** 한눈에 보기 (라벨 2글자) */
  keyDates: { label: string; value: string }[];
  body: string;
  calendarLabel: string;
  /** 처음부터 캘린더에 들어 있음 (알림 '취업박람회가 캘린더에 추가됐어요') */
  inCalendar?: boolean;
  /** 하단 Secondary 버튼 — 공지별 행동 (v5: 오른쪽 Primary는 '캘린더에 추가') */
  secondary: { label: string; doneLabel?: string; action: NoticeAction };
};

export const NOTICE_FILTERS: { value: 'all' | NoticeCategory; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: '학사', label: '학사' },
  { value: '장학', label: '장학' },
  { value: '행사', label: '행사' },
];

/** 이번 학기 최근 공지 3건 — 다른 섹션(학교 연동 카운트 SYNC_COUNTS)이 개수를 읽으므로 3건 유지 */
export const ACADEMIC_NOTICES: AcademicNotice[] = [
  {
    id: 'n1',
    category: '학사',
    important: true,
    short: '2학기 중간고사 시행 안내',
    date: '10.08',
    author: '교무처',
    title: '2026학년도 2학기 중간고사 시행 안내',
    meta: '교무처 · 10.08 (목) · 조회 1,204',
    keyDates: [
      { label: '기간', value: '10.19 (월) – 10.23 (금)' },
      { label: '방식', value: '과목별 시험 또는 대체 과제' },
      { label: '대상', value: '2026-2학기 수강생 전체' },
    ],
    body: '중간고사 기간에는 과목별로 시험이나 시험을 대신하는 과제가 진행됩니다. 시험 시간과 장소는 과목마다 다르니 각 과목 공지를 꼭 확인해 주세요.\n\n· 시험 시간표는 10.14 (수)까지 과목별로 안내됩니다.\n· 결시 사유가 있는 경우 시험 전날까지 담당 교수님께 알려 주세요.',
    calendarLabel: '중간고사 기간',
    secondary: { label: '시험 일정 보기', action: 'calendar' },
  },
  {
    id: 'n2',
    category: '장학',
    short: '교내 근로장학생 추가 모집',
    date: '10.07',
    author: '학생지원팀',
    title: '2026학년도 2학기 교내 근로장학생 추가 모집',
    meta: '학생지원팀 · 10.07 (수) · 조회 862',
    keyDates: [
      { label: '기간', value: '10.07 (수) – 10.14 (수) 17:00' },
      { label: '신청', value: '학교 포털 › 장학 › 근로장학' },
      { label: '대상', value: '2026-2학기 재학생' },
    ],
    body: '교내 여러 부서에서 함께 일할 근로장학생을 추가로 모집합니다. 근무 부서와 시간은 수업 시간표와 겹치지 않게 고를 수 있어요.\n\n· 근무 조건과 선발 기준은 학교 포털 공지의 첨부 파일을 확인해 주세요.\n· 선발 결과는 WivU 알림과 학교 포털에서 함께 안내됩니다.',
    calendarLabel: '근로장학생 모집 마감',
    secondary: { label: '신청하러 가기', action: 'portal' },
  },
  {
    id: 'n3',
    category: '행사',
    short: '2026 하반기 취업박람회 참가 신청',
    date: '10.03',
    author: '취업지원센터',
    title: '2026 하반기 교내 취업박람회 참가 신청 안내',
    meta: '취업지원센터 · 10.03 (토) · 조회 2,031',
    keyDates: [
      { label: '일시', value: '10.12 (월) 14:00 – 17:00' },
      { label: '장소', value: '학생회관 대강당' },
      { label: '신청', value: '10.11 (일)까지 · WivU에서 바로' },
    ],
    // 캘린더 일정 e1(686:6658)과 사실관계 일치: 10.12(월) 14:00–17:00 · 학생회관 대강당 · 사전 신청 10.11(일)까지 · 40여 개 기업
    body: '40여 개 기업이 참여하는 교내 취업박람회로, 기업 상담 부스와 포트폴리오 리뷰가 함께 열립니다. 사전 신청하면 현장 상담을 먼저 받을 수 있어요.\n\n· 참가 기업과 부스 배치는 행사 전날 WivU 공지로 안내됩니다.\n· 포트폴리오 리뷰는 신청한 순서대로 진행됩니다.',
    calendarLabel: '취업박람회',
    inCalendar: true,
    secondary: { label: '참가 신청하기', doneLabel: '신청 완료', action: 'apply' },
  },
];

/** 지난 공지 (Figma 688:6810 목록 4–7행) — 상세는 같은 템플릿의 가상 안내, 원문은 학교 포털로 */
const portalNotice = (n: Omit<AcademicNotice, 'secondary' | 'body'> & { lead: string }): AcademicNotice => ({
  ...n,
  body: `${n.lead}\n\n· 자세한 일정과 기준은 학교 포털 원문 공지를 확인해 주세요.\n· 내용이 바뀌면 WivU 알림으로 다시 안내됩니다.`,
  secondary: { label: '원문 보기', action: 'portal' },
});
export const PAST_NOTICES: AcademicNotice[] = [
  portalNotice({
    id: 'n4',
    category: '학사',
    short: '2학기 수강 철회 기간 안내',
    date: '09.28',
    author: '교무처',
    title: '2026학년도 2학기 수강 철회 기간 안내',
    meta: '교무처 · 09.28 (월) · 조회 1,530',
    keyDates: [
      { label: '신청', value: '학교 포털 › 수업 › 수강 철회' },
      { label: '대상', value: '2026-2학기 수강생 전체' },
    ],
    lead: '이번 학기 수강 과목 가운데 계속 듣기 어려운 과목은 정해진 기간에 철회할 수 있어요. 철회한 과목은 성적표에 남지 않습니다.',
    calendarLabel: '수강 철회 기간',
  }),
  portalNotice({
    id: 'n5',
    category: '장학',
    short: '국가장학금 2차 신청 기간 안내',
    date: '09.22',
    author: '학생지원팀',
    title: '2026학년도 2학기 국가장학금 2차 신청 기간 안내',
    meta: '학생지원팀 · 09.22 (화) · 조회 2,416',
    keyDates: [
      { label: '신청', value: '학교 포털 공지의 신청 안내 참고' },
      { label: '대상', value: '1차 기간에 신청하지 못한 재학생' },
    ],
    lead: '1차 신청 기간을 놓친 학생을 위한 2차 신청 안내예요. 신청 자격과 필요한 서류는 원문 공지에서 확인해 주세요.',
    calendarLabel: '국가장학금 2차 신청',
  }),
  portalNotice({
    id: 'n6',
    category: '학사',
    short: '중앙도서관 시험 기간 24시간 열람실 운영',
    date: '09.18',
    author: '중앙도서관',
    title: '중간고사 기간 중앙도서관 24시간 열람실 운영',
    meta: '중앙도서관 · 09.18 (금) · 조회 1,877',
    keyDates: [
      { label: '기간', value: '10.12 (월) – 10.23 (금)' },
      { label: '장소', value: '중앙도서관 1층 열람실' },
      { label: '대상', value: '학생증을 가진 재학생' },
    ],
    lead: '중간고사 기간에 맞춰 1층 열람실을 24시간 열어요. 밤 시간에는 학생증을 태그해야 들어갈 수 있습니다.',
    calendarLabel: '24시간 열람실 운영',
  }),
  portalNotice({
    id: 'n7',
    category: '행사',
    short: '가을 축제 부스 운영 동아리 모집',
    date: '09.15',
    author: '총학생회',
    title: '2026 가을 축제 부스 운영 동아리 모집',
    meta: '총학생회 · 09.15 (화) · 조회 964',
    keyDates: [
      { label: '신청', value: '총학생회 공지의 신청서 제출' },
      { label: '대상', value: '교내 등록 동아리' },
    ],
    lead: '가을 축제에서 부스를 운영할 동아리를 모집해요. 부스 위치와 운영 시간은 신청한 동아리끼리 함께 정합니다.',
    calendarLabel: '축제 부스 모집',
  }),
];

/** 학사 공지 목록(688:6810) 전체 — 최신순 */
export const NOTICE_LIST: AcademicNotice[] = [...ACADEMIC_NOTICES, ...PAST_NOTICES];
export const noticeById = (id?: string) => NOTICE_LIST.find((n) => n.id === id);

/* ── 강의실 지도 (가상 캠퍼스 · Figma 좌표계 392×852 기준) ───────── */
export type Pt = [number, number];
export type Building = {
  id: string;
  name: string;
  /** 지도 위 사각형 (Figma 좌표) */
  rect: [number, number, number, number];
  /** 핀 라벨 (선택 시 건물 위) */
  pin: string;
  /** 시트 배지 (안내 전) */
  chip: string;
  title: string;
  sub: string;
  /** 도보 분 (강의실까지 · Figma 디자인관 401호 = 4분) */
  walk: number;
  /** 현재 위치 → 건물 입구 경로 (도로를 따라, 마지막 점 = 건물 벽) */
  route: Pt[];
  /** 안내 중 배너 둘째 줄 (첫 줄은 경로 첫 구간 거리로 'Nm 직진 후 ○○ 정문') */
  guide: string;
  /** 도착 배너 둘째 줄 */
  arrive: string;
  floors: { floor: string; desc: string; mine?: boolean }[];
  /** 다음 수업 건물 */
  next?: boolean;
};

export const ME: Pt = [80, 470];
/** 도로 중심선: 가로 y311 · y609, 세로 x161 · x299 */
const ROAD_X = 161;

export const BUILDINGS: Building[] = [
  {
    id: 'design',
    name: '디자인관',
    rect: [190, 350, 90, 120],
    pin: '401호 · 4층',
    chip: '다음 수업 · 13:00 브랜드디자인',
    title: '디자인관 401호',
    sub: '4층 · 엘리베이터에서 오른쪽 세 번째 강의실',
    walk: 4,
    // Figma 702:8726 경로 그대로: M 0 60 L 81 60 L 81 0 L 110 0 (원점 80,410)
    route: [ME, [ROAD_X, 470], [ROAD_X, 410], [190, 410]],
    guide: '정문으로 들어가 엘리베이터로 4층',
    arrive: '엘리베이터로 4층 · 오른쪽 세 번째 강의실',
    next: true,
    floors: [
      { floor: '4층', desc: '401호 브랜드디자인 · 디자인 스튜디오', mine: true },
      { floor: '3층', desc: '302호 서비스디자인 · 세미나실', mine: true },
      { floor: '1층', desc: '학과 사무실 · 라운지 · 엘리베이터' },
      { floor: 'B1', desc: 'B103호 모션그래픽스 · 촬영 스튜디오', mine: true },
    ],
  },
  {
    id: 'info',
    name: '정보관',
    rect: [190, 180, 80, 90],
    pin: '210호 · 2층',
    chip: '오늘 15:00 UX 리서치',
    title: '정보관 210호',
    sub: '2층 · 계단 옆 첫 번째 강의실',
    walk: 5,
    route: [ME, [ROAD_X, 470], [ROAD_X, 225], [190, 225]],
    guide: '정문으로 들어가 계단으로 2층',
    arrive: '계단으로 2층 · 계단 옆 첫 번째 강의실',
    floors: [
      { floor: '2층', desc: '210호 UX 리서치 · 사용성 테스트실', mine: true },
      { floor: '1층', desc: '컴퓨터실 · 출력실' },
    ],
  },
  {
    id: 'humanities',
    name: '인문관',
    rect: [320, 350, 70, 90],
    pin: '305호 · 3층',
    chip: '월·수 10:30 디자인경영',
    title: '인문관 305호',
    sub: '3층 · 복도 끝 강의실',
    walk: 6,
    route: [ME, [ROAD_X, 470], [ROAD_X, 311], [299, 311], [299, 395], [320, 395]],
    guide: '정문으로 들어가 계단으로 3층',
    arrive: '계단으로 3층 · 복도 끝 강의실',
    floors: [
      { floor: '3층', desc: '305호 디자인경영', mine: true },
      { floor: '1층', desc: '강의실 · 휴게 공간' },
    ],
  },
  {
    id: 'library',
    name: '중앙도서관',
    rect: [30, 150, 100, 110],
    pin: '그룹스터디룸 · 3층',
    chip: '열람실 · 그룹스터디룸',
    title: '중앙도서관',
    sub: '1층 열람실 · 3층 그룹스터디룸',
    walk: 5,
    route: [ME, [ROAD_X, 470], [ROAD_X, 205], [130, 205]],
    guide: '1층 열람실 · 3층 그룹스터디룸',
    arrive: '1층 열람실 · 3층 그룹스터디룸',
    floors: [
      { floor: '3층', desc: '그룹스터디룸 1–5' },
      { floor: '2층', desc: '자료실' },
      { floor: '1층', desc: '열람실 · 무인 반납기' },
    ],
  },
  {
    id: 'union',
    name: '학생회관',
    rect: [30, 350, 100, 80],
    pin: '학생식당 · 1층',
    chip: '학생식당 · 대강당',
    title: '학생회관',
    sub: '1층 학생식당 · 2층 대강당·교직원식당',
    walk: 1,
    route: [ME, [80, 430]],
    guide: '1층 학생식당 · 2층 대강당',
    arrive: '1층 학생식당 · 2층 대강당·교직원식당',
    floors: [
      { floor: '2층', desc: '대강당 · 교직원식당' },
      { floor: '1층', desc: '학생식당 · 편의점' },
    ],
  },
  {
    id: 'dorm',
    name: '기숙사',
    rect: [190, 640, 90, 70],
    pin: '기숙사식당 · 1층',
    chip: '기숙사식당',
    title: '기숙사',
    sub: '1층 기숙사식당 · 출입은 학생증 태그',
    walk: 4,
    route: [ME, [ROAD_X, 470], [ROAD_X, 675], [190, 675]],
    guide: '정문에서 학생증을 태그해 주세요',
    arrive: '1층 기숙사식당 · 출입은 학생증 태그',
    floors: [{ floor: '1층', desc: '기숙사식당 · 택배 보관실' }],
  },
];
export const NEXT_BUILDING = 'design';

/** 경로 길이(px · 지도 1px ≈ 1m) */
export const routeLength = (pts: Pt[]) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
/** 안내 중 배너 첫 줄 — 첫 구간 거리(10m 단위) · 디자인관 81px → '80m 직진 후 디자인관 정문' */
export const guideTitle = (b: Building) => {
  const [a, c] = b.route;
  const m = Math.max(10, Math.round(Math.hypot(c[0] - a[0], c[1] - a[1]) / 10) * 10);
  return `${m}m 직진 후 ${b.name} 정문`;
};
/** 도착 위치 — 경로 끝(건물 벽)에서 8px 앞 (Figma 702:8831 me 182,410) */
export const arrivePoint = (pts: Pt[]): Pt => {
  const [x1, y1] = pts[pts.length - 1];
  const [x0, y0] = pts[pts.length - 2];
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  return [x1 - ((x1 - x0) / len) * 8, y1 - ((y1 - y0) / len) * 8];
};

/** 검색 바로가기 (오늘 수업 순) */
export const MAP_SHORTCUTS = [
  { label: '디자인관 401호', meta: '13:00 브랜드디자인 · 다음 수업', building: 'design' },
  { label: '정보관 210호', meta: '15:00 UX 리서치', building: 'info' },
  { label: '디자인관 302호', meta: '10:00 서비스디자인', building: 'design' },
];
