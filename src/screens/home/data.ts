import { P } from '@/app/paths';
import { addDays, dayDiff, dayStart, DOW_KO, fmtHM, fmtISO, fmtLongDay, hmToMin, mdToDate, minOfDay, sameDay, shiftDate, shiftDeep, shiftText } from '@/data/clock';
import { SCENARIO_DAY, SCENARIO_FREE_DAY, SEMESTER_WEEK, TODAY_LABEL, courseById, type CourseId } from '@/data/core';
import { ALL_NOTICES, MEAL_CLOSED_WEEKEND, MEAL_TIME, buildingIdOf, mealsOn } from '@/screens/info/data';
import { classesOn, isFreeDay, isHoliday, minutesLeft, nextSession, phaseOf, relDayLabel, windowElapsed, type ClassSession } from '@/data/today';
import type { AttendMethod } from '@/store/app';
import { ASSIGNMENT_LIST, type CourseAssignment } from '@/screens/courses/data';
import type { CalEvent } from '@/screens/timetable/data';

/* ────────────────────────────────────────────────────────────
 * 홈 데이터 — Figma v5 '02 홈 (v5)' 674:4748 · 675:4839 · 692:6804 문구 그대로
 * 11-06 실시간 전환: 날짜·요일·지금 시각은 실제 기기 시각 (data/clock · data/today). 분 단위 상태는 아래 순수 함수(now 인자)로 계산.
 *  · 시나리오 금요일(core SCENARIO_DAY) = Figma 674:4748·675:4839 → '오늘 할 일'은 Figma 4건 그대로
 *    (10:00 서비스디자인 / 13:00 브랜드디자인 / 14:00 교내 취업박람회(일정) / 23:59 서비스 분석 리포트).
 *    박람회 줄은 Figma 문구 '학생회관 대강당 · 사전 신청 완료' 고정 (공강 프레임·캘린더 e1은 월 14:00 — Figma끼리 다름)
 *    '내일 할 일 2개 더보기'(Figma 문구)로 펼치는 2줄은 Figma에 없는 내용 → 내일(토) 할 일로 채움
 *  · 시나리오 목요일(core SCENARIO_FREE_DAY) = Figma 692:6804 → 공강 목록 그대로 (날짜만 이번 주로 옮김)
 *  · 그 밖의 날(월 휴강·화·수·토·일)은 실제 시간표(classesOn)·캘린더 일정(시간표 스토어)·과제 마감(courses ASSIGNMENT_LIST)으로 만든다
 * ──────────────────────────────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, '0');

/** 공강 변형(/home/free-day) = 이번 주 목요일 9:41 (Figma '홈 · 공강 (목)') */
export const FREE_DAY = SCENARIO_FREE_DAY;
/** '10월 9일 금요일 · 개강 6주차' — 실제 오늘 */
export const DATE_LINE = { today: `${TODAY_LABEL} · 개강 ${SEMESTER_WEEK}주차`, free: `${fmtLongDay(FREE_DAY)} · 개강 ${SEMESTER_WEEK}주차` };

/* ── 오늘 수업 캐러셀 ─────────────────────────────────────── */
/** 카드 종류: now = 인증 가능(674:4748 첫 카드) · done = 출석 완료(675:4839) · later = 창 전(둘째·셋째 카드) · closed = 창 닫힘 + 기록 없음 */
export type CardKind = 'now' | 'done' | 'later' | 'closed';

export type ClassCard = {
  /** 수업 회차 키 'YYYY-MM-DD|courseId' (store attended) */
  key: string;
  kind: CardKind;
  id: CourseId;
  name: string;
  /** '10:00–11:50 · 디자인관 302호 · 김OO 교수' */
  meta: string;
  start: string;
  room: string;
  opens: string;
  closes: string;
  /** 지금 인증 가능 창 안에서 지난 비율 0–1 (창 밖이면 0) */
  elapsed: number;
  badge: string;
  status: string;
  action?: { label: string; to: string; mode: 'push' | 'tab' };
};

/** 강의실 지도 — 그 수업 건물을 열어 둠 (지도 ?b=<건물 id>) */
export const mapFor = (courseId: CourseId) => {
  const b = buildingIdOf(courseById(courseId));
  return b ? `${P.campusMap}?b=${b}` : P.campusMap;
};
const roomAction = (courseId: CourseId): ClassCard['action'] => ({ label: '강의실 위치 보기', to: mapFor(courseId), mode: 'push' });
const TIMETABLE_ACTION: ClassCard['action'] = { label: '시간표에서 보기', to: P.timetable, mode: 'tab' };

export type AttendedMap = Record<string, { method: AttendMethod; time: string }>;

/** 오늘 남은 수업 카드 (끝난 수업은 뺌) — 매 분 다시 계산 */
export function classCards(now: Date, attended: AttendedMap): ClassCard[] {
  const all = classesOn(now);
  // '오늘 마지막 수업'은 수업이 둘 이상인 날의 마지막 회차 (Figma 셋째 카드)
  const lastKey = all.length > 1 ? all[all.length - 1].key : null;
  return all
    .filter((x) => phaseOf(x, now) !== 'ended')
    .map((x): ClassCard => {
      const phase = phaseOf(x, now);
      const base = {
        key: x.key,
        id: x.courseId,
        name: x.course.name,
        meta: `${x.start}–${x.end} · ${x.course.room} · ${x.course.professor} 교수`,
        start: x.start,
        room: x.course.room,
        opens: x.opens,
        closes: x.closes,
        elapsed: 0,
      };
      // 출석 완료는 수업이 끝날 때까지 파란 카드 유지
      const rec = attended[x.key];
      if (rec) return { ...base, kind: 'done', badge: '출석 완료', status: `${rec.time} ${rec.method} 인증` };
      if (phase === 'open') {
        const left = minutesLeft(x, now);
        return { ...base, kind: 'now', badge: '출석 가능', status: left > 0 ? `${left}분 남음` : '곧 마감', elapsed: windowElapsed(x, now) };
      }
      if (phase === 'inClass') {
        return { ...base, kind: 'closed', badge: '인증 마감', status: '수업 중', action: { label: '이의 신청', to: `${P.attendanceCourse(x.courseId)}?sheet=appeal`, mode: 'push' } };
      }
      const last = x.key === lastKey;
      return { ...base, kind: 'later', badge: last ? '오늘 마지막 수업' : '다음 수업', status: `${x.start} 시작`, action: last ? TIMETABLE_ACTION : roomAction(x.courseId) };
    });
}

/** 공강 카드 (692:6804 패턴) — 수업 없는 날(목·주말) · 휴강일 · 오늘 수업이 다 끝남 */
export type FreeCard = {
  badge: string;
  title: string;
  /** text = '금 10:00 서비스디자인 · 디자인관 302호' · auth = '09:40부터 인증' */
  next: { text: string; auth: string; courseId: CourseId; tomorrow: boolean } | null;
  button: string;
};
export function freeCard(now: Date): FreeCard {
  const t = classesOn(now).length
    ? { badge: '오늘 수업 끝', title: '오늘 수업이 모두 끝났어요' }
    : isHoliday(now)
      ? { badge: '오늘은 휴강', title: '휴강일이라 수업이 없어요' }
      : { badge: '오늘은 공강', title: '오늘은 수업이 없어요' };
  const n = nextSession(now);
  const next = n && {
    text: `${DOW_KO[n.day.getDay()]} ${n.start} ${n.course.name} · ${n.course.room}`,
    auth: `${n.opens}부터 인증`,
    courseId: n.courseId,
    tomorrow: dayDiff(now, n.day) === 1,
  };
  return { ...t, next, button: next?.tomorrow ? '내일 시간표 보기' : '시간표 보기' };
}

/* ── 공지 한 줄 ───────────────────────────────────────────── */
/** 학사 공지 최신 1건 — 정보 섹션 공지(ALL_NOTICES) 중 base 날까지 올라온 것만 (게시일이 그날 이후면 아직 없음 · 총괄 공통 규칙,
 *  /home은 실제 오늘 = 정보 섹션 ACADEMIC_NOTICES 첫 항목과 같음 · /home/free-day 데모는 목요일 기준)
 *  n1(중간고사)은 Figma 한 줄 문구 '2학기 중간고사 시행 안내 · 10.19–10.23' 그대로. 월–수엔 n1 대신 그때까지 올라온 최신 공지 */
export function noticeLine(base: Date): { id: string; text: string } {
  const posted = ALL_NOTICES.filter((n) => dayDiff(mdToDate(n.date, base), base) >= 0).sort((a, b) => mdToDate(b.date, base).getTime() - mdToDate(a.date, base).getTime());
  const n = posted[0] ?? ALL_NOTICES[0];
  return n.id === 'n1' ? { id: 'n1', text: shiftText('2학기 중간고사 시행 안내 · 10.19–10.23') } : { id: n.id, text: n.short };
}

/* ── 오늘 할 일 ───────────────────────────────────────────── */
export type TodoItem = {
  key?: string;
  time: string;
  type: '수업' | '일정' | '제출';
  title: string;
  meta: string;
  to: string;
  /** 출석 상태(출석 완료 · 결석)를 붙일 오늘 수업 회차 */
  attend?: ClassSession;
  /** 제출 상태 연동 과제 */
  assignment?: { courseId: CourseId; aid: string; doneMeta: string };
  /** 사전 신청 연동 일정 (시간표 스토어 applied) */
  eventId?: string;
  /** 메타를 빨강으로 (미제출 · 오늘·내일 마감) */
  urgent?: boolean;
};

const SCENARIO_SESSIONS = classesOn(SCENARIO_DAY);
const scenarioSession = (id: CourseId) => SCENARIO_SESSIONS.find((x) => x.courseId === id);

/** 시나리오 금요일 — Figma 674:4748 4건 그대로 + '내일 할 일 2개 더보기' */
export const TODO_TODAY: TodoItem[] = [
  { time: '10:00', type: '수업', title: '서비스디자인', meta: '디자인관 302호', to: P.course('service-design'), attend: scenarioSession('service-design') },
  { time: '13:00', type: '수업', title: '브랜드디자인', meta: '디자인관 401호', to: P.course('brand-design'), attend: scenarioSession('brand-design') },
  { time: '14:00', type: '일정', title: '교내 취업박람회', meta: '학생회관 대강당 · 사전 신청 완료', to: P.calendarEvent('e1') },
  { time: '23:59', type: '제출', title: '서비스 분석 리포트', meta: '서비스디자인 · 아직 제출하지 않았어요', to: P.assignment(), assignment: { courseId: 'service-design', aid: 'a1', doneMeta: '서비스디자인 · 제출 완료' }, urgent: true },
];
/** 펼치면 보이는 내일(토) 할 일 — Figma에 펼친 상태가 없어 다가오는 과제 준비로 구성 */
export const TODO_TOMORROW: TodoItem[] = [
  { time: '내일', type: '일정', title: '인터뷰 계획서 팀 회의', meta: '토 14:00 · UX 리서치 팀 과제', to: P.assignment('ux-research', 'a2') },
  { time: '내일', type: '일정', title: '브랜드 무드보드 자료 정리', meta: '목 23:59 마감 · 브랜드디자인', to: P.assignment('brand-design', 'a1'), assignment: { courseId: 'brand-design', aid: 'a1', doneMeta: '브랜드디자인 · 제출 완료' } },
];

/** 시나리오 목요일(공강) — Figma 692:6804 이번 주 마감·일정 (날짜만 이번 주로 옮김) */
export const TODO_FREE: TodoItem[] = shiftDeep<TodoItem[]>([
  { time: '내일', type: '제출', title: '서비스 분석 리포트', meta: '금 23:59 마감 · 아직 제출하지 않았어요', to: P.assignment(), assignment: { courseId: 'service-design', aid: 'a1', doneMeta: '금 23:59 마감 · 제출 완료' }, urgent: true },
  { time: '10.12', type: '일정', title: '교내 취업박람회', meta: '월 14:00 · 학생회관 대강당', to: P.calendarEvent('e1'), eventId: 'e1' },
  { time: '10.15', type: '제출', title: '브랜드 무드보드', meta: '목 23:59 마감 · 브랜드디자인', to: P.assignment('brand-design', 'a1'), assignment: { courseId: 'brand-design', aid: 'a1', doneMeta: '브랜드디자인 · 제출 완료' } },
  { time: '10.16', type: '제출', title: '인터뷰 계획서', meta: '금 23:59 마감 · UX 리서치 팀 과제', to: P.assignment('ux-research', 'a2'), assignment: { courseId: 'ux-research', aid: 'a2', doneMeta: 'UX 리서치 · 제출 완료' } },
]);

/* 실제로 만드는 목록 (시나리오 금·목이 아닌 날) */
type Row = TodoItem & { sort: number };
type Mode = 'today' | 'tomorrow' | 'week';
/** 메타 앞 일시 — 시각 칸이 '내일'·날짜면 요일 + 시각('금 23:59'), '오늘'·요일이면 시각만 */
const when = (day: Date, hm: string, label: string) => (label === '내일' || label.includes('.') ? `${DOW_KO[day.getDay()]} ${hm}` : hm);

function classRow(x: ClassSession, mode: Mode, label: string): Row {
  const room = x.course.room + (x.makeup ? ' · 보강' : '');
  return {
    key: `c-${x.key}`,
    time: mode === 'today' ? x.start : label,
    type: '수업',
    title: x.course.name,
    meta: mode === 'today' ? room : `${when(x.day, x.start, label)} · ${room}`,
    to: P.course(x.courseId),
    attend: mode === 'today' ? x : undefined,
    sort: x.startMin,
  };
}

/** 그날 일정인지 (공휴일·과제 마감 일정은 뺌 — 과제는 ASSIGNMENT_LIST에서) */
const eventOn = (e: CalEvent, iso: string) => !e.holiday && !e.deadline && (e.span ? iso >= e.span[0] && iso <= e.span[1] : e.date === iso);
function eventRow(e: CalEvent, day: Date, mode: Mode, label: string): Row {
  const allDay = !!e.allDay || !!e.span || !e.start;
  const hm = allDay ? '종일' : e.start!;
  const place = e.place ?? e.meta ?? '';
  return {
    key: `e-${e.id}`,
    time: mode === 'today' ? hm : label,
    type: '일정',
    title: e.short ?? e.title,
    meta: mode === 'today' ? place : [when(day, allDay ? '하루 종일' : hm, label), place].filter(Boolean).join(' · '),
    to: P.calendarEvent(e.id),
    eventId: e.apply ? e.id : undefined,
    sort: allDay ? -1 : hmToMin(hm),
  };
}

function dueRow(a: CourseAssignment, now: Date, mode: Mode, label: string): Row {
  const course = courseById(a.courseId).name;
  const hm = fmtHM(a.due);
  const soon = dayDiff(now, a.due) <= 1;
  const head = mode === 'today' ? course : `${when(a.due, hm, label)} 마감`;
  const detail = mode === 'today' ? '' : ` · ${course}${a.kind === '팀 과제' ? ' 팀 과제' : ''}`;
  return {
    key: `a-${a.courseId}-${a.id}`,
    time: mode === 'today' ? hm : label,
    type: '제출',
    title: a.title,
    meta: soon ? `${head} · 아직 제출하지 않았어요` : `${head}${detail}`,
    to: P.assignment(a.courseId, a.id),
    assignment: { courseId: a.courseId, aid: a.id, doneMeta: `${head} · 제출 완료` },
    urgent: soon || undefined,
    sort: minOfDay(a.due),
  };
}

const strip = ({ sort: _sort, ...it }: Row): TodoItem => it;

/** 그날 할 일 — 수업 · 일정 · 제출 마감, 시각순. 'tomorrow'면 시각 칸에 '내일' */
export function todoOn(day: Date, now: Date, events: CalEvent[], mode: 'today' | 'tomorrow'): TodoItem[] {
  const iso = fmtISO(day);
  const label = mode === 'today' ? '오늘' : '내일';
  const rows: Row[] = [
    ...classesOn(day).map((x) => classRow(x, mode, label)),
    ...events.filter((e) => eventOn(e, iso)).map((e) => eventRow(e, day, mode, label)),
    ...ASSIGNMENT_LIST.filter((a) => !a.closed && sameDay(a.due, day)).map((a) => dueRow(a, now, mode, label)),
  ];
  return rows.sort((a, b) => a.sort - b.sort).map(strip);
}

/** 수업 없는 날(주말·휴강) — 공강 프레임처럼 다가오는 7일 마감·일정 (시각 칸 = 오늘·내일·요일, relDayLabel) */
export function todoWeek(now: Date, events: CalEvent[]): TodoItem[] {
  const out: TodoItem[] = [];
  const seen = new Set<string>();
  const nowMin = minOfDay(now);
  for (let d = 0; d < 7; d++) {
    const day = addDays(dayStart(now), d);
    const iso = fmtISO(day);
    const label = relDayLabel(day, now);
    // 오늘 이미 시작한 시각 일정은 뺌 · 여러 날 일정은 한 번만
    const evs = events.filter((e) => eventOn(e, iso) && !seen.has(e.id) && !(d === 0 && !e.allDay && !e.span && e.start && hmToMin(e.start) < nowMin));
    evs.forEach((e) => seen.add(e.id));
    const rows: Row[] = [
      ...evs.map((e) => eventRow(e, day, 'week', label)),
      ...ASSIGNMENT_LIST.filter((a) => !a.closed && sameDay(a.due, day) && a.due.getTime() >= now.getTime()).map((a) => dueRow(a, now, 'week', label)),
    ];
    out.push(...rows.sort((a, b) => a.sort - b.sort).map(strip));
  }
  return out;
}

export type TodoPlan = { kind: 'day'; items: TodoItem[]; tomorrow: TodoItem[] } | { kind: 'week'; items: TodoItem[] };
/** 오늘 할 일 구성 — 시나리오 금·목은 Figma 목록, 그 밖은 실제 */
export function todoPlan(now: Date, events: CalEvent[]): TodoPlan {
  if (sameDay(now, SCENARIO_DAY)) return { kind: 'day', items: TODO_TODAY, tomorrow: TODO_TOMORROW };
  if (sameDay(now, SCENARIO_FREE_DAY)) return { kind: 'week', items: TODO_FREE };
  if (isFreeDay(now)) return { kind: 'week', items: todoWeek(now, events) };
  return { kind: 'day', items: todoOn(now, now, events, 'today'), tomorrow: todoOn(addDays(dayStart(now), 1), now, events, 'tomorrow') };
}

/** 오늘 수업 줄의 출석 상태 — 완료 = attended[key] · 창이 닫혔는데 기록 없음 = 인증 마감 (결석으로 세지 않음 · 총괄 11-06) */
export function attendMark(x: ClassSession, now: Date, attended: AttendedMap): '출석 완료' | '인증 마감' | null {
  if (attended[x.key]) return '출석 완료';
  const p = phaseOf(x, now);
  return p === 'inClass' || p === 'ended' ? '인증 마감' : null;
}

/* ── 마감 임박 과제 ───────────────────────────────────────── */
export type DeadlineCard = { courseId: CourseId; aid: string; title: string; course: string; meta: string; due: Date; to: string };
export const DEADLINES: DeadlineCard[] = [
  { courseId: 'service-design', aid: 'a1', title: '서비스 분석 리포트', course: '서비스디자인', meta: '미제출', due: shiftDate(new Date(2026, 9, 9, 23, 59)), to: P.assignment() },
  { courseId: 'brand-design', aid: 'a1', title: '브랜드 무드보드', course: '브랜드디자인', meta: '미제출', due: shiftDate(new Date(2026, 9, 15, 23, 59)), to: P.assignment('brand-design', 'a1') },
  { courseId: 'ux-research', aid: 'a2', title: '인터뷰 계획서', course: 'UX 리서치', meta: '팀 과제', due: shiftDate(new Date(2026, 9, 16, 23, 59)), to: P.assignment('ux-research', 'a2') },
];
/** 지금 이후 마감만 */
export const upcomingDeadlines = (now: Date) => DEADLINES.filter((d) => d.due.getTime() >= now.getTime());
/** 마감 배지: 오늘 = Error '오늘 23:59' · 내일 = Warning '내일 23:59' · 그 뒤 = Neutral 'D-n' */
export function dueBadge(due: Date, base: Date): { label: string; tone: 'dangerSoft' | 'warningSoft' | 'neutral' } {
  const d = dayDiff(base, due);
  const hm = `${pad(due.getHours())}:${pad(due.getMinutes())}`;
  if (d <= 0) return { label: `오늘 ${hm}`, tone: 'dangerSoft' };
  if (d === 1) return { label: `내일 ${hm}`, tone: 'warningSoft' };
  return { label: `D-${d}`, tone: 'neutral' };
}

/* ── 내 메뉴 ──────────────────────────────────────────────── */
/** v5에서 목적지가 바뀐 메뉴 (공용 카탈로그 data/quickMenu.ts는 읽기 전용 → 홈에서만 덮어씀) */
export const MENU_OVERRIDE: Record<string, { path: string; mode: 'push' | 'modal' | 'tab' }> = {
  notice: { path: P.notices, mode: 'push' }, // v5: 공지 → 학사 공지 목록(688:6810)
};

/* ── 오늘의 학식 ──────────────────────────────────────────── */
export const MEAL = {
  title: '돈까스 (5,500원)',
  meta: '중식 | 11:30–13:30 · 학생식당 1층',
  peakLabel: '12:10 가장 붐빔',
  /** 15분 단위 혼잡도 (11:30–13:15 · 7칸) — Figma 막대 높이 12·18·30·52·40·22·12 / 56 */
  crowd: [12, 18, 30, 52, 40, 22, 12],
  peak: 3,
  axis: ['11:30', '12:00', '12:30', '13:00'],
};
export type HomeMeal = typeof MEAL;
/** 주말 학식 빈 상태 — 정보 섹션 문구 그대로 */
export const MEAL_CLOSED = { title: MEAL_CLOSED_WEEKEND, meta: `평일 중식 ${MEAL_TIME['중식'].range} · 학생식당 1층` };
/** 오늘의 학식 — 정보 섹션 식단(mealsOn, 학생식당)에서 읽음. 중식이 끝나면(13:30) 석식. 주말 = null(운영 안 함)
 *  금 학생식당 중식(Figma 674:4748 '돈까스')은 홈 Figma 막대(7칸) 그대로, 나머지는 학식 화면 혼잡도(8칸)를 56 높이로 */
export function homeMeal(now: Date): HomeMeal | null {
  const meals = mealsOn(now);
  if (!meals?.length) return null;
  const lunch = meals.find((m) => m.kind === '중식') ?? meals[0];
  const dinner = meals.find((m) => m.kind === '석식');
  const lunchEnd = hmToMin(MEAL_TIME['중식'].range.split('–')[1]);
  const m = dinner && minOfDay(now) >= lunchEnd ? dinner : lunch;
  if (m === mealsOn(SCENARIO_DAY)?.[0]) return MEAL;
  const t = MEAL_TIME[m.kind];
  return {
    title: `${m.main} (${m.price})`,
    meta: `${m.kind} | ${t.range} · 학생식당 1층`,
    peakLabel: `${m.peak.split('–')[0]} 가장 붐빔`,
    crowd: m.crowd.map((v) => Math.round(v * 56)),
    peak: m.crowd.indexOf(Math.max(...m.crowd)),
    axis: t.axis,
  };
}

/* ── 꺼져 있는 블록 (홈 편집에서 켤 때) ───────────────────── */
/** 다음 강의실 — 다음 수업(인증 창이 아직 안 열린 가장 가까운 회차). 금 9:41 → '디자인관 401호 · 13:00 브랜드디자인 · 도보 4분' */
export function nextRoom(now: Date): { room: string; meta: string; to: string } {
  const n = nextSession(now);
  if (!n) return { room: '다음 수업이 없어요', meta: '', to: P.campusMap };
  const to = mapFor(n.courseId);
  return sameDay(n.day, now)
    ? { room: n.course.room, meta: `${n.start} ${n.course.name} · 도보 4분`, to }
    : { room: n.course.room, meta: `${relDayLabel(n.day, now)} ${n.start} ${n.course.name}`, to };
}
export const LIBRARY_ROOMS = [
  { name: '제1열람실', left: 42, total: 120 },
  { name: '제2열람실', left: 8, total: 80 },
  { name: '노트북 열람실', left: 15, total: 60 },
];
/** 도서관 좌석 기준 시각 — 10분 단위로 내림 (9:41 → '09:40 기준') */
export const libraryAsOf = (now: Date) => {
  const m = Math.floor(minOfDay(now) / 10) * 10;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)} 기준`;
};
