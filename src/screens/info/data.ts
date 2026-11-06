import { DOW_KO, LOAD_NOW, dayDiff, fmtHM, fmtMD, sameDay, shiftDate, shiftDeep } from '@/data/clock';
import { COURSES, NOW, SCENARIO_DAY, type Course } from '@/data/core';
import { classesOn, nextSession, phaseOf, relDayLabel, type ClassSession } from '@/data/today';

/* ────────────────────────────────────────────────────────────
 * 홈 › 알림·정보 데이터 (v5 · 피드백 반영)
 *   학식 681:5684 · 알림함 681:5798(+ 모두 읽음 701:8991)
 *   학사 공지 목록 688:6810 · 상세 688:6925 · 강의실 지도 688:6715(+ 안내 중 702:8726 · 도착 702:8831)
 * Figma 문구 그대로. n2–n7 공지 본문·월–목 식단·지도 건물 정보는 '가상' 데이터(실제 규정·수치 아님).
 *
 * 11-06 실시간 전환: 날짜는 시나리오 주(10/5–10/11) → 이번 주로 옮김(shiftDeep · shiftDate).
 *   · 알림: 시나리오 시각(금 09:57 …)을 옮긴 뒤 지금 기준으로 '오늘/어제/이번 주' 묶음·시각을 계산, 아직 안 온 알림은 숨김.
 *     출석 인증 알림은 실제 수업(data/today classesOn)의 인증 창이 열린 시각에 생김.
 *   · 학식: 이번 주 월–금(주말이면 토·일까지) · 식단은 요일 기준.
 *   · 지도: 다음 수업(nextSession)·오늘 수업(classesOn) 기준으로 칩·강조 건물·바로가기를 계산.
 * ──────────────────────────────────────────────────────────── */

/* ── 알림함 ─────────────────────────────────────────────── */
export type NotiFilter = 'all' | 'attendance' | 'assignment' | 'notice' | 'board';
export type NotiTarget =
  /** key = 그 수업 회차(data/today sessionKey) — 인증 창이 열려 있고 아직 출석 전이면 PIN으로 */
  | { kind: 'attendance'; key?: string }
  | { kind: 'assignment' }
  | { kind: 'boardPost'; id: string }
  | { kind: 'courseNotice' }
  | { kind: 'academicNotice'; id: string }
  | { kind: 'board' }
  | { kind: 'calendarEvent' };

export type NotiGroup = '오늘' | '어제' | '이번 주';
export type Noti = {
  id: string;
  /** 알림이 온 시각 (시나리오 날짜를 이번 주로 옮긴 실제 Date) */
  at: Date;
  /** 지금 기준 묶음 — notificationsAt(now)가 계산 */
  group: NotiGroup;
  category: string;
  filter: Exclude<NotiFilter, 'all'> | null;
  /** 오늘·어제 = 'HH:MM', 이번 주 = 'MM.DD' (Figma 681:5798) — notificationsAt(now)가 계산 */
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

type NotiSrc = Omit<Noti, 'group' | 'time'> & {
  /** 알림함에 나타나는 시각 (없으면 at) — Figma 시각이 9:41보다 뒤인 댓글 알림용 */
  from?: Date;
};
/** 시나리오 시각 (2026-10-DD HH:MM) — shiftDeep으로 이번 주로 옮김 */
const at = (d: number, hm: string) => new Date(2026, 9, d, +hm.slice(0, 2), +hm.slice(3, 5));

/* 시각은 Figma 681:5798 그대로 = 시나리오 금 10/9 기준 '오늘'(금) · '어제'(목 10/8) · '이번 주'(월 10/5).
 * (댓글 09:57은 상태바 9:41보다 뒤 — Figma 그대로 표시하되, 9:41 화면에도 보이게 나타나는 시각(from)은 금 9:41)
 * 취업박람회 알림은 Figma에 날짜만 있어 시각은 09:00으로 둠(그날이 오늘일 때만 시각이 보임).
 * 출석 알림(Figma nt-attend 09:40 서비스디자인)은 아래 attendanceNotis가 실제 수업에서 만든다. */
const NOTI_SRC: NotiSrc[] = shiftDeep<NotiSrc[]>([
  { id: 'nt-comment', at: at(9, '09:57'), from: at(9, '09:41'), category: '게시판', filter: 'board' as const, title: '내 글에 댓글 2개가 달렸어요', body: '“서비스 분석 리포트, 분석 대상 겹쳐도…”', unread: true, highlight: true, to: { kind: 'boardPost' as const, id: 'p1' } },
  { id: 'nt-assign', at: at(9, '09:00'), category: '과제', filter: 'assignment' as const, title: '서비스 분석 리포트 오늘 마감', body: '23:59까지 · 아직 제출하지 않았어요', unread: true, highlight: true, to: { kind: 'assignment' as const } },
  { id: 'nt-course-notice', at: at(9, '08:30'), category: '공지', filter: 'notice' as const, title: '서비스디자인 새 공지', body: '오늘 수업 진행 방식 안내', unread: false, to: { kind: 'courseNotice' as const } },
  { id: 'nt-academic', at: at(8, '18:20'), category: '학사', filter: 'notice' as const, title: '2학기 중간고사 시행 안내', body: '10.19(월)–10.23(금) 시험 기간', unread: false, to: { kind: 'academicNotice' as const, id: 'n1' } },
  { id: 'nt-team', at: at(8, '13:05'), category: '팀플', filter: 'board' as const, title: 'UX 리서치 팀플 모집이 곧 마감돼요', body: '사용자 인터뷰 팀원 · D-2', unread: false, to: { kind: 'board' as const } },
  { id: 'nt-fair', at: at(5, '09:00'), category: '일정', filter: null, title: '취업박람회가 캘린더에 추가됐어요', body: '10.12(월) 14:00 · 학생회관 대강당', unread: false, to: { kind: 'calendarEvent' as const } },
]);

/** 인증 창이 열린 시각 */
const opensAt = (s: ClassSession) => new Date(s.day.getFullYear(), s.day.getMonth(), s.day.getDate(), 0, s.opensMin);
/** Figma 681:5798 '서비스디자인 출석 인증이 열렸어요'(시나리오 금) — 읽음 기록 키를 Figma 때와 같게 */
const FIGMA_ATTEND_KEY = classesOn(SCENARIO_DAY).find((s) => s.courseId === 'service-design')?.key;

/**
 * 출석 인증 알림 — 실제 수업의 인증 창이 열린 시각(시작 20분 전)에 생김.
 * 대상: 오늘 · 어제 수업 + (주말이면) 이번 주 금요일 수업 — 금요일 시나리오 알림(댓글·과제…)과 같이 지난 알림으로 남김.
 * 오늘 것만 안 읽음·강조(Figma: 오늘 확인할 알림), 지난 날 것은 Figma '어제' 묶음처럼 읽은 상태.
 */
function attendanceNotis(now: Date): NotiSrc[] {
  const days = [now, new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)];
  if (dayDiff(SCENARIO_DAY, now) > 1) days.push(SCENARIO_DAY);
  return days
    .flatMap((d) => classesOn(d))
    .filter((s) => opensAt(s).getTime() <= now.getTime())
    .map((s) => {
      const today = sameDay(s.day, now);
      return {
        id: s.key === FIGMA_ATTEND_KEY ? 'nt-attend' : `nt-attend:${s.key}`,
        at: opensAt(s),
        category: '출석',
        filter: 'attendance' as const,
        title: `${s.course.name} 출석 인증이 열렸어요`,
        body: `${s.course.room} · ${s.closes}까지`,
        unread: today,
        highlight: today,
        to: { kind: 'attendance' as const, key: s.key },
      };
    });
}

const groupOf = (d: Date, now: Date): NotiGroup => {
  const n = dayDiff(d, now);
  return n <= 0 ? '오늘' : n === 1 ? '어제' : '이번 주';
};

/**
 * 지금 기준 알림함 — 이미 온 알림만(최신순), 묶음·시각 글자는 지금 기준으로 계산.
 * 강조(파랑·굵게)는 오늘 온 알림만 (Figma '오늘 확인이 필요한 알림').
 */
export function notificationsAt(now: Date): Noti[] {
  return [...NOTI_SRC, ...attendanceNotis(now)]
    .filter((n) => (n.from ?? n.at).getTime() <= now.getTime())
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .map(({ from: _from, ...n }) => {
      const group = groupOf(n.at, now);
      return { ...n, group, time: group === '이번 주' ? fmtMD(n.at) : fmtHM(n.at), highlight: !!n.highlight && group === '오늘' };
    });
}
/** 앱을 연 순간 기준 알림 — 탭 헤더 종 점(app/useUnread) 호환용. 화면은 notificationsAt(useNow()) */
export const NOTIFICATIONS: Noti[] = notificationsAt(LOAD_NOW);
export const NOTI_GROUPS = ['오늘', '어제', '이번 주'] as const;

/* ── 학식 ───────────────────────────────────────────────── */
export type CafeteriaId = 'student' | 'staff' | 'dorm';
export const CAFETERIAS: { value: CafeteriaId; label: string; place: string }[] = [
  { value: 'student', label: '학생식당', place: '학생식당 1층' },
  { value: 'staff', label: '교직원식당', place: '학생회관 2층' },
  { value: 'dorm', label: '기숙사식당', place: '기숙사 1층' },
];

export type MealDow = '월' | '화' | '수' | '목' | '금';
export type MealDay = { date: Date; m: number; d: number; dow: (typeof DOW_KO)[number] };
const mealDay = (scenD: number): MealDay => {
  const date = shiftDate(new Date(2026, 9, scenD));
  return { date, m: date.getMonth() + 1, d: date.getDate(), dow: DOW_KO[date.getDay()] };
};
/** 이번 주 월–금 (시나리오 10/5 – 10/9 → 이번 주로 옮김) */
export const MEAL_DAYS: MealDay[] = [5, 6, 7, 8, 9].map(mealDay);
/** 이번 주 토·일 — 주말에만 요일 줄에 붙음(운영 안 함) */
export const MEAL_WEEKEND: MealDay[] = [10, 11].map(mealDay);
/** 실제 오늘 날짜·월 (시나리오 9 · 10) */
export const MEAL_TODAY = NOW.getDate();
export const MEAL_MONTH = NOW.getMonth() + 1;
/** 주말 빈 상태 문구 (홈 학식 카드와 같은 문구) */
export const MEAL_CLOSED_WEEKEND = '주말에는 학생식당을 운영하지 않아요';
export const mealClosedText = (cafeLabel: string) => `주말에는 ${cafeLabel}을 운영하지 않아요`;

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

/** 식단[요일][식당] — 금 학생식당은 Figma 681:5684 그대로, 나머지는 가상 식단 (이번 주 = 시나리오 주라 요일로 찾음) */
export const MENUS: Record<MealDow, Record<CafeteriaId, Meal[]>> = {
  월: {
    student: [L('제육덮밥', '미소된장국 · 단무지 · 배추김치'), D('짜장면', '군만두 · 단무지 · 양파')],
    staff: [SL('갈비탕', '잡곡밥 · 깍두기 · 숙주나물'), D('비빔밥', '된장찌개 · 계란후라이')],
    dorm: [L('카레라이스', '미니돈까스 · 샐러드 · 배추김치'), D('닭갈비덮밥', '어묵국 · 깍두기')],
  },
  화: {
    student: [L('치킨마요덮밥', '유부장국 · 단무지 · 배추김치'), D('순두부찌개', '쌀밥 · 계란말이 · 김구이')],
    staff: [SL('생선구이 정식', '된장국 · 시금치나물 · 깍두기'), D('김치찌개', '쌀밥 · 두부조림')],
    dorm: [L('돈부리', '미소된장국 · 샐러드'), D('떡볶이', '튀김 · 순대 · 어묵국')],
  },
  수: {
    student: [L('함박스테이크', '크림스프 · 양배추 샐러드 · 피클'), D('콩나물국밥', '깍두기 · 김구이')],
    staff: [SL('불고기 정식', '미역국 · 잡채 · 배추김치'), D('잔치국수', '김밥 · 단무지')],
    dorm: [L('오므라이스', '미니우동 · 단무지'), D('부대찌개', '쌀밥 · 계란찜')],
  },
  목: {
    student: [L('비빔국수', '군만두 · 단무지 · 요구르트', [14, 20, 28, 42, 46, 38, 22, 14].map((h) => h / 64), '12:15–12:40'), D('돼지국밥', '부추무침 · 깍두기')],
    staff: [SL('닭볶음탕', '쌀밥 · 계란말이 · 깍두기'), D('냉모밀', '유부초밥 · 단무지')],
    dorm: [L('참치김치볶음밥', '계란국 · 깍두기'), D('치킨까스', '양배추 샐러드 · 크림스프')],
  },
  금: {
    student: [L('돈까스', '우동 · 단무지 · 깍두기 · 요구르트'), D('김치볶음밥', '미역국 · 계란후라이 · 깍두기')],
    staff: [SL('소고기무국 정식', '잡곡밥 · 고등어구이 · 배추김치'), D('제육쌈밥', '된장국 · 쌈채소')],
    dorm: [L('마파두부덮밥', '계란국 · 단무지'), D('쫄면', '김밥 · 어묵국')],
  },
};
/** 그날 식단 — 주말(토·일)은 null = 운영 안 함 ('주말에는 학생식당을 운영하지 않아요'). 홈 학식 카드도 이걸로 읽으면 됨 */
export function mealsOn(date: Date, cafe: CafeteriaId = 'student'): Meal[] | null {
  const dow = DOW_KO[date.getDay()];
  return dow in MENUS ? MENUS[dow as MealDow][cafe] : null;
}

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

/** 이번 학기 최근 공지 3건 — 다른 섹션(학교 연동 카운트 SYNC_COUNTS)이 개수를 읽으므로 3건 유지
 *  날짜(목록·메타·한눈에 보기·본문)는 시나리오 날짜 → 이번 주로 옮김(shiftDeep, 요일 글자는 주 단위라 그대로 맞음) */
export const ACADEMIC_NOTICES: AcademicNotice[] = shiftDeep<AcademicNotice[]>([
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
]);

/** 지난 공지 (Figma 688:6810 목록 4–7행) — 상세는 같은 템플릿의 가상 안내, 원문은 학교 포털로 */
const portalNotice = (n: Omit<AcademicNotice, 'secondary' | 'body'> & { lead: string }): AcademicNotice => ({
  ...n,
  body: `${n.lead}\n\n· 자세한 일정과 기준은 학교 포털 원문 공지를 확인해 주세요.\n· 내용이 바뀌면 WivU 알림으로 다시 안내됩니다.`,
  secondary: { label: '원문 보기', action: 'portal' },
});
export const PAST_NOTICES: AcademicNotice[] = shiftDeep([
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
]);

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
  /** 안내 시작 시 건물 입구까지 남은 분 (Figma 702:8726 '안내 중 · 2분 남음'). 없으면 walk의 절반 */
  guideMin?: number;
  /** 현재 위치 → 건물 입구 경로 (도로를 따라, 마지막 점 = 건물 벽) */
  route: Pt[];
  /** 안내 중 배너 둘째 줄 (첫 줄은 경로 첫 구간 거리로 'Nm 직진 후 ○○ 정문') */
  guide: string;
  /** 도착 배너 둘째 줄 */
  arrive: string;
  floors: { floor: string; desc: string; mine?: boolean }[];
  /** 다음 수업 건물 */
  next?: boolean;
  /** 강의실이 여럿인 건물 — 강의실별 핀·시트·안내 문구 (키 = core Course.room). 기본 필드 = 첫 강의실(Figma) */
  rooms?: Record<string, RoomInfo>;
};
type RoomInfo = Pick<Building, 'pin' | 'title' | 'sub' | 'guide' | 'arrive'>;

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
    guideMin: 2,
    // Figma 702:8726 경로 그대로: M 0 60 L 81 60 L 81 0 L 110 0 (원점 80,410)
    route: [ME, [ROAD_X, 470], [ROAD_X, 410], [190, 410]],
    guide: '정문으로 들어가 엘리베이터로 4층',
    arrive: '엘리베이터로 4층 · 오른쪽 세 번째 강의실',
    next: true,
    // 다음 수업이 302호(서비스디자인)·B103(모션그래픽스)일 때 — 401호(Figma)와 같은 구성의 가상 안내
    rooms: {
      '디자인관 302호': { pin: '302호 · 3층', title: '디자인관 302호', sub: '3층 · 엘리베이터에서 왼쪽 첫 번째 강의실', guide: '정문으로 들어가 엘리베이터로 3층', arrive: '엘리베이터로 3층 · 왼쪽 첫 번째 강의실' },
      '디자인관 B103': { pin: 'B103 · 지하 1층', title: '디자인관 B103', sub: '지하 1층 · 엘리베이터 앞 촬영 스튜디오 옆', guide: '정문으로 들어가 엘리베이터로 지하 1층', arrive: '엘리베이터로 지하 1층 · 촬영 스튜디오 옆 강의실' },
    },
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
/** 기본 '다음 수업' 건물 (시나리오 금 9:41 = 디자인관) — 화면은 nextBuildingId(now) */
export const NEXT_BUILDING = 'design';

/* ── 지도 실시간 (11-06): 다음 수업 = data/today nextSession(인증 창이 아직 안 열린 가장 가까운 수업) ── */
/** 수업 건물 → 지도 건물 id */
export const buildingIdOf = (c: Course) => BUILDINGS.find((b) => b.name === c.building)?.id;
const roomInfo = (b: Building, room: string): RoomInfo => b.rooms?.[room] ?? { pin: b.pin, title: b.title, sub: b.sub, guide: b.guide, arrive: b.arrive };
/** 시간표 칩 '월·수 10:30 디자인경영' (같은 시각 요일끼리 묶음) */
const scheduleChip = (c: Course) => {
  const byStart = new Map<string, string[]>();
  for (const sl of c.slots) byStart.set(sl.start, [...(byStart.get(sl.start) ?? []), sl.day]);
  return `${[...byStart].map(([st, ds]) => `${ds.join('·')} ${st}`).join(', ')} ${c.name}`;
};
/** 다음 수업 '13:00 브랜드디자인'(오늘) · '내일 10:00 서비스디자인' · '월 10:30 디자인경영' */
const whenLabel = (s: ClassSession, now: Date) => `${sameDay(s.day, now) ? '' : `${relDayLabel(s.day, now)} `}${s.start} ${s.course.name}`;

/**
 * 지금 기준 건물 시트·핀 — Figma 9:41: 디자인관 '다음 수업 · 13:00 브랜드디자인' · 정보관 '오늘 15:00 UX 리서치' · 인문관 '월·수 10:30 디자인경영'
 *  다음 수업 건물 → '다음 수업 · …' + 그 강의실 안내 / 오늘 남은 수업이 있는 건물 → '오늘 HH:MM 과목' / 그 밖 → 시간표 칩
 */
export function buildingView(b: Building, now: Date): Building {
  const mine = COURSES.filter((c) => !c.online && c.building === b.name);
  if (!mine.length) return { ...b, next: false };
  const next = nextSession(now);
  if (next && next.course.building === b.name) return { ...b, ...roomInfo(b, next.course.room), chip: `다음 수업 · ${whenLabel(next, now)}`, next: true };
  const today = classesOn(now).find((s) => s.course.building === b.name && phaseOf(s, now) !== 'ended');
  if (today) return { ...b, ...roomInfo(b, today.course.room), chip: `오늘 ${today.start} ${today.course.name}`, next: false };
  const def = mine.find((c) => c.room === b.title) ?? mine[0];
  return { ...b, ...roomInfo(b, def.room), chip: scheduleChip(def), next: false };
}
/** 지금 '다음 수업' 건물 id */
export const nextBuildingId = (now: Date) => {
  const n = nextSession(now);
  return (n && buildingIdOf(n.course)) || NEXT_BUILDING;
};

/** 경로 길이(px · 지도 1px ≈ 1m) */
export const routeLength = (pts: Pt[]) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
/** 안내 중 배너 첫 줄 — 첫 구간 거리(10m 단위) · 디자인관 81px → '80m 직진 후 디자인관 정문' */
export const guideTitle = (b: Building) => {
  const [a, c] = b.route;
  const m = Math.max(10, Math.round(Math.hypot(c[0] - a[0], c[1] - a[1]) / 10) * 10);
  return `${m}m 직진 후 ${b.name} 정문`;
};
/** 안내 중 '남은 분'의 시작값 */
export const guideMinutes = (b: Building) => b.guideMin ?? Math.max(1, Math.round(b.walk / 2));
/** 도착 위치 — 경로 끝(건물 벽)에서 8px 앞 (Figma 702:8831 me 182,410) */
export const arrivePoint = (pts: Pt[]): Pt => {
  const [x1, y1] = pts[pts.length - 1];
  const [x0, y0] = pts[pts.length - 2];
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  return [x1 - ((x1 - x0) / len) * 8, y1 - ((y1 - y0) / len) * 8];
};

/** 검색 바로가기 (오늘 수업 순) — Figma 9:41 기준 값. 화면은 mapShortcuts(now) */
export const MAP_SHORTCUTS = [
  { label: '디자인관 401호', meta: '13:00 브랜드디자인 · 다음 수업', building: 'design' },
  { label: '정보관 210호', meta: '15:00 UX 리서치', building: 'info' },
  { label: '디자인관 302호', meta: '10:00 서비스디자인', building: 'design' },
];
export type MapShortcut = (typeof MAP_SHORTCUTS)[number];
/**
 * 검색 바로가기 (지금 기준) — 오늘 수업: 아직 안 열린 수업(시작 순, 첫 칸 '다음 수업') → 지금·지난 수업 순 (Figma 9:41 순서와 같음).
 * 오늘 수업이 없는 날(목·주말·휴강)은 '다음 수업 강의실' = 다음 수업 날의 수업.
 */
export function mapShortcuts(now: Date): { head: string; items: MapShortcut[] } {
  const next = nextSession(now);
  const row = (s: ClassSession, when: string): MapShortcut => ({
    label: s.course.room,
    meta: `${when}${next && s.key === next.key ? ' · 다음 수업' : ''}`,
    building: buildingIdOf(s.course) ?? NEXT_BUILDING,
  });
  const today = classesOn(now);
  if (today.length) {
    const up = today.filter((s) => phaseOf(s, now) === 'upcoming');
    const rest = today.filter((s) => phaseOf(s, now) !== 'upcoming');
    return { head: '오늘 수업 강의실', items: [...up, ...rest].map((s) => row(s, `${s.start} ${s.course.name}`)) };
  }
  return { head: '다음 수업 강의실', items: next ? classesOn(next.day).map((s) => row(s, whenLabel(s, now))) : [] };
}
