import { addDays, dayDiff, dayStart, DOW_KO, fmtHM, fmtISO, fmtMD, hmToMin, minOfDay, sd } from './clock';
import { COURSES, type Course, type CourseId } from './core';

/* ────────────────────────────────────────────────────────────
 * 오늘 수업 엔진 (실시간) — 홈 · 출석 · 시간표 · 수강과목이 같이 쓴다
 * 수업은 요일별 시간표(core COURSES.slots)를 따른다: 월·수 디자인경영 / 화 모션그래픽스 / 목 공강 / 금 3과목 / 토·일 없음.
 * 출석 인증 창: 수업 시작 20분 전 ~ 시작 10분 후 (v5 카드 '09:40 인증 시작 · 10:10 마감')
 * 이번 주(= 시나리오 6주차) 예외: 월요일(시나리오 10.05 대체공휴일) 휴강 · 화요일 10:30 디자인경영 보강
 *   (출석 기록 attendance/data.ts의 6주차 휴강·보강과 같은 날 — 목요일은 Figma '홈 · 공강 (목)'대로 수업 없음)
 * ──────────────────────────────────────────────────────────── */

export const OPEN_BEFORE = 20;
export const CLOSE_AFTER = 10;

export type ClassSession = {
  courseId: CourseId;
  course: Course;
  /** 수업 날 0시 */
  day: Date;
  start: string;
  end: string;
  startMin: number;
  endMin: number;
  /** 인증 창 (분) */
  opensMin: number;
  closesMin: number;
  /** 'HH:MM' */
  opens: string;
  closes: string;
  /** 'YYYY-MM-DD|courseId' — 출석 완료 저장 키 (store attended) */
  key: string;
  /** 휴강 보강 회차 */
  makeup?: boolean;
};

/** 휴강일 (시나리오 날짜 → 이번 주로 옮김) */
const HOLIDAYS = ['10.05'].map(sd);
/** 정규 시간표 밖 보강 수업 (시나리오 날짜 → 이번 주로 옮김) */
const EXTRA: { md: string; courseId: CourseId; start: string; end: string }[] = [
  { md: sd('10.06'), courseId: 'design-management', start: '10:30', end: '11:45' },
];
/** 그날이 휴강일인지 */
export const isHoliday = (d: Date) => HOLIDAYS.includes(fmtMD(d));

const hm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

export const sessionKey = (day: Date, courseId: CourseId) => `${fmtISO(day)}|${courseId}`;

/** 그날 수업 (시작 순) — 사이버 강의 제외 */
export function classesOn(date: Date): ClassSession[] {
  const day = dayStart(date);
  const dow = DOW_KO[day.getDay()];
  const out: ClassSession[] = [];
  const add = (c: Course, start: string, end: string, makeup?: boolean) => {
    const startMin = hmToMin(start);
    out.push({
      courseId: c.id,
      course: c,
      day,
      start,
      end,
      startMin,
      endMin: hmToMin(end),
      opensMin: startMin - OPEN_BEFORE,
      closesMin: startMin + CLOSE_AFTER,
      opens: hm(startMin - OPEN_BEFORE),
      closes: hm(startMin + CLOSE_AFTER),
      key: sessionKey(day, c.id),
      ...(makeup ? { makeup } : {}),
    });
  };
  if (!isHoliday(day)) {
    for (const c of COURSES) {
      if (c.online) continue;
      for (const sl of c.slots) if (sl.day === dow) add(c, sl.start, sl.end);
    }
  }
  const md = fmtMD(day);
  for (const x of EXTRA) if (x.md === md) add(COURSES.find((c) => c.id === x.courseId)!, x.start, x.end, true);
  return out.sort((a, b) => a.startMin - b.startMin);
}

/**
 * 지금 기준 수업 단계
 *  upcoming = 인증 창 전 · open = 인증 가능 · inClass = 창은 닫히고 수업 중 · ended = 수업 끝
 */
export type ClassPhase = 'upcoming' | 'open' | 'inClass' | 'ended';
export function phaseOf(s: ClassSession, now: Date): ClassPhase {
  const dd = dayDiff(now, s.day);
  if (dd > 0) return 'upcoming';
  if (dd < 0) return 'ended';
  const m = minOfDay(now);
  if (m < s.opensMin) return 'upcoming';
  if (m <= s.closesMin) return 'open';
  if (m < s.endMin) return 'inClass';
  return 'ended';
}
/** 인증 창에서 남은 분 / 지난 비율 */
export const minutesLeft = (s: ClassSession, now: Date) => Math.max(0, s.closesMin - minOfDay(now));
export const windowElapsed = (s: ClassSession, now: Date) => Math.min(1, Math.max(0, (minOfDay(now) - s.opensMin) / (s.closesMin - s.opensMin)));

/** 지금 인증 가능한 수업 (없으면 null) */
export function openSession(now: Date): ClassSession | null {
  return classesOn(now).find((s) => phaseOf(s, now) === 'open') ?? null;
}

/** 아직 끝나지 않은 오늘 수업 */
export const remainingToday = (now: Date) => classesOn(now).filter((s) => phaseOf(s, now) !== 'ended');

/** 지금 이후 가장 가까운 '인증 창이 아직 안 열린' 수업 (오늘 포함, 최대 14일 뒤까지) */
export function nextSession(now: Date): ClassSession | null {
  for (let i = 0; i <= 14; i++) {
    const s = classesOn(addDays(now, i)).find((x) => phaseOf(x, now) === 'upcoming');
    if (s) return s;
  }
  return null;
}

/** 수업이 없는 날(목·토·일 · 휴강일)인지 */
export const isFreeDay = (d: Date) => classesOn(d).length === 0;
export const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

/** '오늘' · '내일' · '월' (이번 주 안) · '10.12' 처럼 가까운 날 이름 */
export function relDayLabel(day: Date, now: Date): string {
  const d = dayDiff(now, day);
  if (d === 0) return '오늘';
  if (d === 1) return '내일';
  if (d > 1 && d < 7) return DOW_KO[day.getDay()];
  return `${String(day.getMonth() + 1).padStart(2, '0')}.${String(day.getDate()).padStart(2, '0')}`;
}

export { fmtHM };
