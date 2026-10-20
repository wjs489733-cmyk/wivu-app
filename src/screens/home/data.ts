import { P } from '@/app/paths';
import { COURSES, NOW, SEMESTER_WEEK, TODAY_CLASSES, TODAY_LABEL, type CourseId } from '@/data/core';

/* ────────────────────────────────────────────────────────────
 * 홈 데이터 — Figma v5 '02 홈 (v5)' 674:4748 · 675:4839 · 692:6804 문구 그대로
 * 기준 core NOW = 10.09(금) 9:41 · 6주차. Figma끼리 어긋난 값은 core 기준으로 맞춤:
 *  · 취업박람회는 10.12(월) 14:00 (core ACADEMIC_SCHEDULE · 공강 프레임 기준) → 오늘 할 일 3번째 줄은 15:00 UX 리서치,
 *    박람회는 '더보기'로 펼치는 다가오는 할 일로 옮김 (오늘 프레임 '14:00 교내 취업박람회'와 다름)
 *  · D-day는 기준 날짜에서 계산 (공강 10/8 기준 인터뷰 계획서 10/16 = D-8 · Figma는 D-7)
 * ──────────────────────────────────────────────────────────── */

const DOW = ['일', '월', '화', '수', '목', '금', '토'] as const;
const pad = (n: number) => String(n).padStart(2, '0');
const toMin = (hm: string) => {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
};
const toHm = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
const dayDiff = (a: Date, b: Date) => Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime() - new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()) / 86400000);

/** 공강 변형 = 전날 목 10/8 */
export const FREE_DAY = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 1, 9, 41);
const dateLabel = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일 ${DOW[d.getDay()]}요일`;
/** '10월 9일 금요일 · 개강 6주차' */
export const DATE_LINE = { today: `${TODAY_LABEL} · 개강 ${SEMESTER_WEEK}주차`, free: `${dateLabel(FREE_DAY)} · 개강 ${SEMESTER_WEEK}주차` };

/* ── 오늘 수업 캐러셀 ─────────────────────────────────────── */
/** 출석 인증 시간: 수업 시작 20분 전 ~ 시작 10분 후 (v5 카드 '09:40 인증 시작 · 10:10 마감') */
const OPEN_BEFORE = 20;
const CLOSE_AFTER = 10;
const NOW_MIN = NOW.getHours() * 60 + NOW.getMinutes();

export type ClassCard = {
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
  minutesLeft: number;
  badge: string;
  status: string;
  action?: { label: string; to: string; mode: 'push' | 'tab' };
};

const BADGES: Record<number, { badge: string; action?: ClassCard['action'] }> = {
  1: { badge: '다음 수업', action: { label: '강의실 위치 보기', to: P.campusMap, mode: 'push' } },
  2: { badge: '오늘 마지막 수업', action: { label: '시간표에서 보기', to: P.timetable, mode: 'tab' } },
};

export const CLASS_CARDS: ClassCard[] = TODAY_CLASSES.map((id, i) => {
  const c = COURSES.find((x) => x.id === id)!;
  const slot = c.slots[0];
  const open = toMin(slot.start) - OPEN_BEFORE;
  const close = toMin(slot.start) + CLOSE_AFTER;
  const inWindow = NOW_MIN >= open && NOW_MIN <= close;
  return {
    id,
    name: c.name,
    meta: `${slot.start}–${slot.end} · ${c.room} · ${c.professor} 교수`,
    start: slot.start,
    room: c.room,
    opens: toHm(open),
    closes: toHm(close),
    elapsed: inWindow ? (NOW_MIN - open) / (close - open) : 0,
    minutesLeft: Math.max(0, close - NOW_MIN),
    badge: i === 0 ? '출석 가능' : BADGES[i].badge,
    status: i === 0 ? `${close - NOW_MIN}분 남음` : `${slot.start} 시작`,
    action: BADGES[i]?.action,
  };
});

/** 공강 카드 '다음 수업  금 10:00 서비스디자인 · 디자인관 302호' */
const firstClass = COURSES.find((x) => x.id === TODAY_CLASSES[0])!;
export const FREE_NEXT = { label: '다음 수업', text: `${firstClass.slots[0].day} ${firstClass.slots[0].start} ${firstClass.name} · ${firstClass.room}` };

/* ── 공지 한 줄 ───────────────────────────────────────────── */
export const NOTICE_LINE = { id: 'n1', text: '2학기 중간고사 시행 안내 · 10.19–10.23' };

/* ── 오늘 할 일 ───────────────────────────────────────────── */
export type TodoItem = {
  time: string;
  type: '수업' | '일정' | '제출';
  title: string;
  meta: string;
  to: string;
  /** 출석 완료 표시 대상 수업 */
  attendCourse?: CourseId;
  /** 제출 상태 연동 과제 */
  assignment?: { courseId: CourseId; aid: string; doneMeta: string };
  /** 사전 신청 연동 일정 (시간표 스토어 applied) */
  eventId?: string;
  /** 메타를 빨강으로 (미제출 · 오늘·내일 마감) */
  urgent?: boolean;
};

const FAIR: TodoItem = { time: '10.12', type: '일정', title: '교내 취업박람회', meta: '월 14:00 · 학생회관 대강당', to: P.calendarEvent('e1'), eventId: 'e1' };
const MOODBOARD: TodoItem = { time: '10.15', type: '제출', title: '브랜드 무드보드', meta: '목 23:59 마감 · 브랜드디자인', to: P.assignment('brand-design', 'a1'), assignment: { courseId: 'brand-design', aid: 'a1', doneMeta: '브랜드디자인 · 제출 완료' } };
const INTERVIEW: TodoItem = { time: '10.16', type: '제출', title: '인터뷰 계획서', meta: '금 23:59 마감 · UX 리서치 팀 과제', to: P.assignment('ux-research', 'a2'), assignment: { courseId: 'ux-research', aid: 'a2', doneMeta: 'UX 리서치 · 제출 완료' } };

/** 오늘(금 10/9) — 시간순 4건 + '더보기'로 다가오는 할 일 */
export const TODO_TODAY: TodoItem[] = [
  { time: '10:00', type: '수업', title: '서비스디자인', meta: '디자인관 302호', to: P.course('service-design'), attendCourse: 'service-design' },
  { time: '13:00', type: '수업', title: '브랜드디자인', meta: '디자인관 401호', to: P.course('brand-design') },
  { time: '15:00', type: '수업', title: 'UX 리서치', meta: '정보관 210호', to: P.course('ux-research') },
  { time: '23:59', type: '제출', title: '서비스 분석 리포트', meta: '서비스디자인 · 아직 제출하지 않았어요', to: P.assignment(), assignment: { courseId: 'service-design', aid: 'a1', doneMeta: '서비스디자인 · 제출 완료' }, urgent: true },
];
export const TODO_TODAY_MORE: TodoItem[] = [FAIR, MOODBOARD];

/** 공강(목 10/8) — 이번 주 마감·일정 */
export const TODO_FREE: TodoItem[] = [
  { time: '내일', type: '제출', title: '서비스 분석 리포트', meta: '금 23:59 마감 · 아직 제출하지 않았어요', to: P.assignment(), assignment: { courseId: 'service-design', aid: 'a1', doneMeta: '금 23:59 마감 · 제출 완료' }, urgent: true },
  FAIR,
  MOODBOARD,
  INTERVIEW,
];

/* ── 마감 임박 과제 ───────────────────────────────────────── */
export type DeadlineCard = { courseId: CourseId; aid: string; title: string; course: string; meta: string; due: Date; to: string };
export const DEADLINES: DeadlineCard[] = [
  { courseId: 'service-design', aid: 'a1', title: '서비스 분석 리포트', course: '서비스디자인', meta: '미제출', due: new Date(2026, 9, 9, 23, 59), to: P.assignment() },
  { courseId: 'brand-design', aid: 'a1', title: '브랜드 무드보드', course: '브랜드디자인', meta: '미제출', due: new Date(2026, 9, 15, 23, 59), to: P.assignment('brand-design', 'a1') },
  { courseId: 'ux-research', aid: 'a2', title: '인터뷰 계획서', course: 'UX 리서치', meta: '팀 과제', due: new Date(2026, 9, 16, 23, 59), to: P.assignment('ux-research', 'a2') },
];
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

/* ── 꺼져 있는 블록 (홈 편집에서 켤 때) ───────────────────── */
export const NEXT_ROOM = {
  today: { room: '디자인관 401호', meta: '13:00 브랜드디자인 · 도보 4분' },
  free: { room: '디자인관 302호', meta: '내일 10:00 서비스디자인' },
};
export const LIBRARY_ROOMS = [
  { name: '제1열람실', left: 42, total: 120 },
  { name: '제2열람실', left: 8, total: 80 },
  { name: '노트북 열람실', left: 15, total: 60 },
];
