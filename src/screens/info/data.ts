import type { ChipTone, IconName } from '@/ui';
import { TOTAL_CREDITS } from '@/data/core';

/* ────────────────────────────────────────────────────────────
 * 홈 › 알림·정보 데이터
 *   알림함 428:8938 · 학식 429:8987 · 학사 공지 430:9007 · 강의실 지도 431:9033
 * Figma 문구 그대로. n2·n3 공지와 월–목 식단, 지도 건물 정보는 '가상' 데이터(실제 규정·수치 아님).
 * ──────────────────────────────────────────────────────────── */

/* ── 알림함 ─────────────────────────────────────────────── */
export type NotiFilter = 'all' | 'attendance' | 'assignment' | 'notice' | 'board';
export type NotiTone = 'brand' | 'error' | 'pulse' | 'neutral';
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
  icon: IconName;
  tone: NotiTone;
  time: string;
  title: string;
  body: string;
  /** 처음부터 안 읽은 알림 (읽으면 useApp.readNotifications에 기록) */
  unread: boolean;
  to: NotiTarget;
};

export const NOTI_FILTERS: { value: NotiFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'attendance', label: '출석' },
  { value: 'assignment', label: '과제' },
  { value: 'notice', label: '공지' },
  { value: 'board', label: '게시판' },
];

/* 시간 흐름: 상태바 9:41은 장식. 시나리오는 '수업이 막 시작돼 10:10까지 출석 인증 가능'(≈10:00).
 * 게시판 상대 시각(p1 '12분 전' ≈ 09:48, 댓글 '8분 전'·'3분 전')과 맞춰 댓글 알림은 09:57 — 글보다 앞서지 않게. */
export const NOTIFICATIONS: Noti[] = [
  { id: 'nt-comment', group: '오늘', category: '게시판', filter: 'board', icon: 'nav-board', tone: 'brand', time: '09:57', title: '내 글에 댓글 2개가 달렸어요', body: '“서비스 분석 리포트, 분석 대상 겹쳐도…”', unread: true, to: { kind: 'boardPost', id: 'p1' } },
  { id: 'nt-attend', group: '오늘', category: '출석', filter: 'attendance', icon: 'nav-attendance', tone: 'brand', time: '09:50', title: '서비스디자인 출석 인증 10분 전이에요', body: '디자인관 302호 · 10:00–10:10 인증', unread: true, to: { kind: 'attendance' } },
  { id: 'nt-assign', group: '오늘', category: '과제', filter: 'assignment', icon: 'assignment', tone: 'error', time: '09:00', title: '서비스 분석 리포트 오늘 마감', body: '23:59까지 · 아직 제출하지 않았어요', unread: true, to: { kind: 'assignment' } },
  { id: 'nt-course-notice', group: '오늘', category: '공지', filter: 'notice', icon: 'notice', tone: 'brand', time: '08:30', title: '서비스디자인 새 공지', body: '오늘 수업 진행 방식 안내', unread: true, to: { kind: 'courseNotice' } },
  { id: 'nt-academic', group: '어제', category: '학사', filter: 'notice', icon: 'notice', tone: 'brand', time: '18:20', title: '2학기 수강신청 정정 기간 안내', body: '9.15(화) 18:00 마감', unread: false, to: { kind: 'academicNotice', id: 'n1' } },
  { id: 'nt-team', group: '어제', category: '팀플', filter: 'board', icon: 'user', tone: 'pulse', time: '13:05', title: 'UX 리서치 팀플 모집이 곧 마감돼요', body: '사용자 인터뷰 팀원 · D-2', unread: false, to: { kind: 'boardPost', id: 'u1' } },
  { id: 'nt-fair', group: '이번 주', category: '일정', filter: null, icon: 'quick-calendar', tone: 'neutral', time: '9.07', title: '취업박람회가 캘린더에 추가됐어요', body: '9.14(월) 14:00 · 학생회관 대강당', unread: false, to: { kind: 'calendarEvent' } },
];
export const NOTI_GROUPS = ['오늘', '어제', '이번 주'] as const;

/* ── 학식 ───────────────────────────────────────────────── */
export type CafeteriaId = 'student' | 'staff' | 'dorm';
export const CAFETERIAS: { value: CafeteriaId; label: string; place: string }[] = [
  { value: 'student', label: '학생식당', place: '학생식당 1층' },
  { value: 'staff', label: '교직원식당', place: '학생회관 2층' },
  { value: 'dorm', label: '기숙사식당', place: '기숙사 1층' },
];

export const MEAL_DAYS = [
  { d: 7, dow: '월' },
  { d: 8, dow: '화' },
  { d: 9, dow: '수' },
  { d: 10, dow: '목' },
  { d: 11, dow: '금' },
] as const;
export const MEAL_TODAY = 11;

export type MealKind = '중식' | '석식';
export type Meal = {
  kind: MealKind;
  main: string;
  sides: string;
  price: string;
  /** 15분 단위 혼잡도 0–1 (8칸) */
  crowd: number[];
  /** 붐비는 구간 표시 문구 */
  peak: string;
  /** 추천 시간 막대 index */
  best: number;
};

const LUNCH_AXIS = ['11:30', '12:00', '12:30', '13:00'];
const DINNER_AXIS = ['17:00', '17:30', '18:00', '18:30'];
export const MEAL_TIME: Record<MealKind, { range: string; axis: string[] }> = {
  중식: { range: '11:30 – 13:30', axis: LUNCH_AXIS },
  석식: { range: '17:00 – 18:30', axis: DINNER_AXIS },
};

/** 가격은 Figma 429:8987(금 학생식당) 값 한 가지로 통일 — 식당·요일별 실제 가격처럼 보이는 가상 수치를 만들지 않음 */
const LUNCH_PRICE = '5,500원';
const DINNER_PRICE = '5,000원';
const L = (main: string, sides: string, price: string, crowd = [0.3, 0.44, 0.6, 0.94, 1, 0.86, 0.5, 0.3], peak = '12:10–12:40 붐빔', best = 2): Meal => ({ kind: '중식', main, sides, price, crowd, peak, best });
const D = (main: string, sides: string, price: string, crowd = [0.36, 0.62, 0.9, 0.82, 0.48, 0.3, 0.2, 0.14], peak = '17:20–17:50 붐빔', best = 5): Meal => ({ kind: '석식', main, sides, price, crowd, peak, best });

/** 식단[날짜][식당] — 금(11) 학생식당은 Figma 429:8987 그대로, 나머지는 가상 식단 */
export const MENUS: Record<number, Record<CafeteriaId, Meal[]>> = {
  7: {
    student: [L('제육덮밥', '미소된장국 · 단무지 · 배추김치', LUNCH_PRICE), D('짜장면', '군만두 · 단무지 · 양파', DINNER_PRICE)],
    staff: [L('갈비탕', '잡곡밥 · 깍두기 · 숙주나물', LUNCH_PRICE, undefined, '12:00–12:30 붐빔', 1), D('비빔밥', '된장찌개 · 계란후라이', DINNER_PRICE)],
    dorm: [L('카레라이스', '미니돈까스 · 샐러드 · 배추김치', LUNCH_PRICE), D('닭갈비덮밥', '어묵국 · 깍두기', DINNER_PRICE)],
  },
  8: {
    student: [L('치킨마요덮밥', '유부장국 · 단무지 · 배추김치', LUNCH_PRICE), D('순두부찌개', '쌀밥 · 계란말이 · 김구이', DINNER_PRICE)],
    staff: [L('생선구이 정식', '된장국 · 시금치나물 · 깍두기', LUNCH_PRICE, undefined, '12:00–12:30 붐빔', 1), D('김치찌개', '쌀밥 · 두부조림', DINNER_PRICE)],
    dorm: [L('돈부리', '미소된장국 · 샐러드', LUNCH_PRICE), D('떡볶이', '튀김 · 순대 · 어묵국', DINNER_PRICE)],
  },
  9: {
    student: [L('함박스테이크', '크림스프 · 양배추 샐러드 · 피클', LUNCH_PRICE), D('콩나물국밥', '깍두기 · 김구이', DINNER_PRICE)],
    staff: [L('불고기 정식', '미역국 · 잡채 · 배추김치', LUNCH_PRICE, undefined, '12:00–12:30 붐빔', 1), D('잔치국수', '김밥 · 단무지', DINNER_PRICE)],
    dorm: [L('오므라이스', '미니우동 · 단무지', LUNCH_PRICE), D('부대찌개', '쌀밥 · 계란찜', DINNER_PRICE)],
  },
  10: {
    student: [L('비빔국수', '군만두 · 단무지 · 요구르트', LUNCH_PRICE, [0.2, 0.3, 0.42, 0.66, 0.72, 0.6, 0.34, 0.2], '12:15–12:40 조금 붐빔'), D('돼지국밥', '부추무침 · 깍두기', DINNER_PRICE)],
    staff: [L('닭볶음탕', '쌀밥 · 계란말이 · 깍두기', LUNCH_PRICE, undefined, '12:00–12:30 붐빔', 1), D('냉모밀', '유부초밥 · 단무지', DINNER_PRICE)],
    dorm: [L('참치김치볶음밥', '계란국 · 깍두기', LUNCH_PRICE), D('치킨까스', '양배추 샐러드 · 크림스프', DINNER_PRICE)],
  },
  11: {
    student: [
      { ...L('돈까스', '우동 · 단무지 · 깍두기 · 요구르트', LUNCH_PRICE) },
      { ...D('김치볶음밥', '미역국 · 계란후라이 · 깍두기', DINNER_PRICE) },
    ],
    staff: [L('소고기무국 정식', '잡곡밥 · 고등어구이 · 배추김치', LUNCH_PRICE, undefined, '12:00–12:30 붐빔', 1), D('제육쌈밥', '된장국 · 쌈채소', DINNER_PRICE)],
    dorm: [L('마파두부덮밥', '계란국 · 단무지', LUNCH_PRICE), D('쫄면', '김밥 · 어묵국', DINNER_PRICE)],
  },
};

/** 오늘(금) 시간표 기준 추천 — Figma 그대로 */
export const MEAL_TIP = {
  label: '내 시간표 기준 추천',
  title: '11:50 수업 끝나고 12:00에 가면 대기가 짧아요',
  meta: '13:00 브랜드디자인 전까지 여유 50분',
};

/* ── 학사 공지 ──────────────────────────────────────────── */
export type AcademicNotice = {
  id: string;
  chips: { label: string; tone: ChipTone; danger?: boolean }[];
  /** 홈·공지 목록 제목 (짧은 제목) */
  short: string;
  /** 목록 날짜 'MM.DD' */
  date: string;
  title: string;
  author: string;
  meta: string;
  keyDates: { label: string; value: string; emphasis?: boolean }[];
  body: string;
  context: { icon: IconName; text: string };
  calendarLabel: string;
  /** 처음부터 캘린더에 들어 있음 (알림 '취업박람회가 캘린더에 추가됐어요') */
  inCalendar?: boolean;
  primary: { label: string; doneLabel?: string; action: 'timetableAdd' | 'apply' | 'portal' };
};

export const ACADEMIC_NOTICES: AcademicNotice[] = [
  {
    id: 'n1',
    chips: [
      { label: '학사', tone: 'brand' },
      { label: '중요', tone: 'neutral', danger: true },
    ],
    short: '2학기 수강신청 정정 기간 안내',
    date: '09.10',
    title: '2026학년도 2학기 수강신청 정정 기간 안내',
    author: '학사지원팀',
    meta: '09.10 (목) 14:00 · 조회 1,284',
    keyDates: [
      { label: '정정 기간', value: '9.14(월) 10:00 – 9.15(화) 18:00', emphasis: true },
      { label: '신청 방법', value: '학교 포털 > 수강신청 > 정정' },
      { label: '대상', value: '2026-2학기 재학생 전체' },
    ],
    body: '수강 정정 기간에는 과목 추가와 취소를 모두 할 수 있어요. 정원이 찬 과목은 대기 신청 후 결원이 생기면 순서대로 배정돼요.\n\n· 신청 가능 학점은 학사 규정을 따라요.\n· 정정 후 시간표는 WivU에 자동으로 다시 동기화돼요.',
    context: { icon: 'nav-timetable', text: `현재 ${TOTAL_CREDITS}학점 · 정정하면 시간표·과제가 자동으로 다시 맞춰져요` },
    calendarLabel: '수강정정 기간',
    primary: { label: '수업 찾아보기', action: 'timetableAdd' },
  },
  {
    id: 'n2',
    chips: [{ label: '장학', tone: 'pulse' }],
    short: '교내 근로장학생 추가 모집',
    date: '09.09',
    title: '2026학년도 2학기 교내 근로장학생 추가 모집',
    author: '학생지원팀',
    meta: '09.09 (수) 10:00 · 조회 862',
    keyDates: [
      { label: '모집 기간', value: '9.9(수) – 9.16(수) 17:00', emphasis: true },
      { label: '신청 방법', value: '학교 포털 > 장학 > 근로장학' },
      { label: '대상', value: '2026-2학기 재학생' },
    ],
    body: '교내 여러 부서에서 함께 일할 근로장학생을 추가로 모집해요. 근무 부서와 시간은 수업 시간표와 겹치지 않게 고를 수 있어요.\n\n· 근무 조건과 선발 기준은 학교 포털 공지의 첨부 파일을 확인해 주세요.\n· 선발 결과는 WivU 알림과 학교 포털에서 함께 안내돼요.',
    context: { icon: 'nav-timetable', text: '목요일은 수업이 없어서 근무 시간으로 고르기 좋아요' },
    calendarLabel: '근로장학생 모집 마감',
    primary: { label: '신청하러 가기', action: 'portal' },
  },
  {
    id: 'n3',
    chips: [{ label: '행사', tone: 'neutral' }],
    short: '2026 하반기 취업박람회 참가 신청',
    date: '09.05',
    title: '2026 하반기 교내 취업박람회 참가 신청 안내',
    author: '취업지원팀',
    meta: '09.05 (토) 10:00 · 조회 2,031',
    keyDates: [
      { label: '일시', value: '9.14(월) 14:00 – 17:00', emphasis: true },
      { label: '장소', value: '학생회관 대강당' },
      { label: '사전 신청', value: '9.13(일)까지 · WivU에서 바로' },
    ],
    body: '기업 상담 부스와 포트폴리오 리뷰, 현직자 특강이 함께 열려요. 미리 신청하면 상담 순서를 먼저 받을 수 있어요.\n\n· 참가 기업과 부스 배치는 행사 전날 WivU 공지로 안내돼요.\n· 포트폴리오 리뷰는 신청한 순서대로 진행돼요.',
    context: { icon: 'nav-timetable', text: '월 14:00엔 수업이 없어요 · 디자인경영(10:30–11:45) 뒤 바로 갈 수 있어요' },
    calendarLabel: '취업박람회',
    inCalendar: true,
    primary: { label: '참가 신청하기', doneLabel: '신청 완료', action: 'apply' },
  },
];
export const noticeById = (id?: string) => ACADEMIC_NOTICES.find((n) => n.id === id);

/* ── 강의실 지도 (가상 캠퍼스 · Figma 좌표계 392×852 기준) ───────── */
export type Pt = [number, number];
export type Building = {
  id: string;
  name: string;
  /** 지도 위 사각형 (Figma 좌표) */
  rect: [number, number, number, number];
  /** 핀 라벨 (선택 시 건물 위) */
  pin: string;
  chip: string;
  title: string;
  sub: string;
  /** 현재 위치 → 입구 경로 (도로를 따라) */
  route: Pt[];
  floors: { floor: string; desc: string; mine?: boolean }[];
  /** 다음 수업 건물 */
  next?: boolean;
};

export const ME: Pt = [80, 470];
const viaWest = (x: number, y: number, roadY = 311): Pt[] => [ME, [161, 470], [161, roadY], [x, roadY], [x, y]];

export const BUILDINGS: Building[] = [
  {
    id: 'design',
    name: '디자인관',
    rect: [190, 350, 90, 120],
    pin: '401호 · 4층',
    chip: '다음 수업 · 13:00 브랜드디자인',
    title: '디자인관 401호',
    sub: '4층 · 엘리베이터에서 오른쪽 세 번째 강의실',
    route: viaWest(235, 350),
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
    route: viaWest(230, 270),
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
    route: viaWest(355, 350),
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
    route: viaWest(80, 260),
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
    route: [ME, [80, 430]],
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
    route: viaWest(235, 640, 609),
    floors: [{ floor: '1층', desc: '기숙사식당 · 택배 보관실' }],
  },
  {
    id: 'gym',
    name: '체육관',
    rect: [-70, 160, 64, 100],
    pin: '체육관 · 1층',
    chip: '운동 시설',
    title: '체육관',
    sub: '1층 체육관 · 2층 체력단련실',
    route: viaWest(-38, 260),
    floors: [
      { floor: '2층', desc: '체력단련실' },
      { floor: '1층', desc: '실내 체육관' },
    ],
  },
  {
    id: 'eng',
    name: '공학관',
    rect: [330, 226, 90, 64],
    pin: '공학관',
    chip: '이번 학기 수업 없음',
    title: '공학관',
    sub: '내 수업이 없는 건물이에요',
    route: viaWest(375, 290),
    floors: [{ floor: '1–5층', desc: '공학 계열 강의실 · 실험실' }],
  },
];
export const NEXT_BUILDING = 'design';

/** 경로 길이(px) → 도보 분 (디자인관 401호 = 4분 기준) */
export const routeLength = (pts: Pt[]) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
export const walkMinutes = (pts: Pt[]) => Math.max(1, Math.round(routeLength(pts) / 88));

/** 검색 바로가기 (오늘 수업 순) */
export const MAP_SHORTCUTS = [
  { label: '디자인관 401호', meta: '13:00 브랜드디자인 · 다음 수업', building: 'design' },
  { label: '정보관 210호', meta: '15:00 UX 리서치', building: 'info' },
  { label: '디자인관 302호', meta: '10:00 서비스디자인', building: 'design' },
];
