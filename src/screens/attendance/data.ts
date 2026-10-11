import { COURSES, courseById, type CourseId } from '@/data/core';
import type { AttendMethod } from '@/store/app';

/* ────────────────────────────────────────────────────────────
 * 출석 섹션 데이터 — Figma 392:7302 · 406:8047 텍스트 기준
 * 학기: 2026-09-01(화) 개강, 오늘 = 09.11(금) 2주차 (core NOW)
 * 출석률 = (출석 + 지각) / 진행된 수업 — Figma 모션그래픽스 50%(0+1 / 2)와 일치
 * 출석 합계 6 · 지각 1 · 결석 1 = Figma 요약 타일과 일치
 * ──────────────────────────────────────────────────────────── */

export type RecordStatus = '출석' | '지각' | '결석';
export type SessionStatus = RecordStatus | '예정' | '오늘' | '인증 가능';

export type Session = {
  courseId: CourseId;
  week: number;
  /** 'MM.DD' */
  date: string;
  dow: '월' | '화' | '수' | '목' | '금' | '토' | '일';
  start: string;
  end: string;
  status: SessionStatus;
  /** 인증 시각 */
  time?: string;
  method?: AttendMethod;
  lateMin?: number;
  /** 정렬용 (MMDD + 시작 시각) */
  key: string;
};

const sess = (courseId: CourseId, week: number, date: string, dow: Session['dow'], start: string, end: string, status: SessionStatus, extra: Partial<Session> = {}): Session => ({
  courseId,
  week,
  date,
  dow,
  start,
  end,
  status,
  key: date.replace('.', '') + start.replace(':', ''),
  ...extra,
});

/** 지난 출석 기록 (오늘 이전) — 최신순 정렬은 아래 함수에서 */
export const PAST: Session[] = [
  sess('motion-graphics', 1, '09.01', '화', '14:00', '16:50', '결석'),
  sess('design-management', 1, '09.02', '수', '10:30', '11:45', '출석', { time: '10:27', method: 'PIN' }),
  sess('service-design', 1, '09.04', '금', '10:00', '11:50', '출석', { time: '09:57', method: 'PIN' }),
  sess('brand-design', 1, '09.04', '금', '13:00', '14:50', '출석', { time: '12:56', method: 'NFC' }),
  sess('ux-research', 1, '09.04', '금', '15:00', '16:50', '출석', { time: '14:58', method: 'PIN' }),
  sess('design-management', 2, '09.07', '월', '10:30', '11:45', '출석', { time: '10:29', method: 'NFC' }),
  sess('motion-graphics', 2, '09.08', '화', '14:00', '16:50', '지각', { time: '14:12', method: 'QR', lateMin: 12 }),
  sess('design-management', 2, '09.09', '수', '10:30', '11:45', '출석', { time: '10:28', method: 'PIN' }),
  // 사이버 강의(글쓰기와 소통) — 출석 탭 목록엔 없음(Figma), 상세 라우트용
  sess('writing', 1, '09.06', '일', '00:00', '23:59', '출석', { time: '21:40' }),
];

/** 오늘(금 09.11) 수업 + 다음 예정 수업 */
const TODAY_AND_NEXT: Session[] = [
  sess('service-design', 2, '09.11', '금', '10:00', '11:50', '인증 가능'),
  sess('brand-design', 2, '09.11', '금', '13:00', '14:50', '오늘'),
  sess('ux-research', 2, '09.11', '금', '15:00', '16:50', '오늘'),
  sess('design-management', 3, '09.14', '월', '10:30', '11:45', '예정'),
  sess('motion-graphics', 3, '09.15', '화', '14:00', '16:50', '예정'),
  sess('service-design', 3, '09.18', '금', '10:00', '11:50', '예정'),
  sess('brand-design', 3, '09.18', '금', '13:00', '14:50', '예정'),
  sess('ux-research', 3, '09.18', '금', '15:00', '16:50', '예정'),
  sess('writing', 2, '09.13', '일', '00:00', '23:59', '예정'),
];

/** 학기 총 수업 횟수 (15주 · 주2회 과목은 개강 주 월요일 제외) */
const TOTAL_SESSIONS: Record<CourseId, number> = {
  'service-design': 15,
  'brand-design': 15,
  'ux-research': 15,
  'design-management': 29,
  'motion-graphics': 15,
  writing: 15,
};

/** 출석 탭 '과목별 출석' 목록 순서 (Figma: 사이버 강의 제외 5과목) */
export const ATTENDANCE_COURSES: CourseId[] = ['service-design', 'brand-design', 'ux-research', 'design-management', 'motion-graphics'];

export type TodayState = { complete: boolean; method: AttendMethod | null; time: string | null };

/** 오늘 서비스디자인 출석 완료 시 기록으로 승격 */
function todayRecord(t: TodayState): Session | null {
  if (!t.complete) return null;
  return sess('service-design', 2, '09.11', '금', '10:00', '11:50', '출석', { time: t.time ?? '10:01', method: t.method ?? 'PIN' });
}

/** 모든 출석 기록 (최신순) */
export function allRecords(t: TodayState, includeOnline = false): Session[] {
  const today = todayRecord(t);
  const list = [...PAST, ...(today ? [today] : [])].filter((r) => includeOnline || r.courseId !== 'writing');
  return list.sort((a, b) => (a.key < b.key ? 1 : -1));
}

export type CourseStats = { present: number; late: number; absent: number; held: number; remaining: number; rate: number };

export function courseStats(id: CourseId, t: TodayState): CourseStats {
  const recs = allRecords(t, true).filter((r) => r.courseId === id);
  const present = recs.filter((r) => r.status === '출석').length;
  const late = recs.filter((r) => r.status === '지각').length;
  const absent = recs.filter((r) => r.status === '결석').length;
  const held = present + late + absent;
  const rate = held ? Math.round(((present + late) / held) * 100) : 100;
  return { present, late, absent, held, remaining: TOTAL_SESSIONS[id] - held, rate };
}

export function totals(t: TodayState) {
  return ATTENDANCE_COURSES.map((id) => courseStats(id, t)).reduce(
    (a, s) => ({ present: a.present + s.present, late: a.late + s.late, absent: a.absent + s.absent }),
    { present: 0, late: 0, absent: 0 },
  );
}

/** 과목 상세 '회차별 기록' — 지난 회차 + 오늘 + 다음 1회 */
export function courseSessions(id: CourseId, t: TodayState): Session[] {
  const past = allRecords(t, true).filter((r) => r.courseId === id);
  const upcoming = TODAY_AND_NEXT.filter((s) => s.courseId === id && !(t.complete && s.courseId === 'service-design' && s.date === '09.11'));
  const today = upcoming.filter((s) => s.date === '09.11');
  const next = upcoming.filter((s) => s.date !== '09.11').slice(0, 1);
  return [...past, ...today, ...next].sort((a, b) => (a.key < b.key ? -1 : 1));
}

export function nextSession(id: CourseId, t: TodayState) {
  return courseSessions(id, t).find((s) => s.status === '예정' || s.status === '오늘' || s.status === '인증 가능');
}

/** 기록 행 보조 문구: '10:28 인증 · PIN' / '인증 기록 없음' / '14:12 인증 · QR · 12분 지각' */
export function recordMeta(r: Session, detail = false) {
  const online = courseById(r.courseId).online;
  if (r.status === '결석') return '인증 기록 없음';
  if (r.status === '출석' || r.status === '지각') {
    if (online) return `${r.date} ${r.time} 수강 완료`;
    return [`${r.time} 인증`, r.method, detail && r.lateMin ? `${r.lateMin}분 지각` : null].filter(Boolean).join(' · ');
  }
  if (online) return `${r.date} (${r.dow})까지 수강`;
  if (r.status === '인증 가능') return `${r.start} – ${r.end} · 10:10까지 인증`;
  return `${r.start} – ${r.end} 예정`;
}

export const courseName = (id: CourseId) => courseById(id).name;
export const isAttendanceCourse = (id: string): id is CourseId => COURSES.some((c) => c.id === id);
