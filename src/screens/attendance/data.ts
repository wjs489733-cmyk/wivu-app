import { COURSES, courseById, TODAY_MD, type CourseId } from '@/data/core';
import type { AttendMethod } from '@/store/app';

/* ────────────────────────────────────────────────────────────
 * 출석 섹션 데이터 — Figma v5 683:5844 · 683:5994 텍스트 기준 (이전 392:7302 · 406:8047)
 * 학기: 2026-09-01(화) 개강, 오늘 = 10.09(금) 6주차 (core NOW · TODAY_MD)
 *   4주차 추석 연휴(9.24–9.26) → 금요일 수업 휴강 · 6주차 10.05(월) 개천절 대체공휴일 → 월요일 수업 휴강
 * 출석률 = (출석 + 지각) / 진행된 수업 — 모션그래픽스 83%(4+1 / 6)
 * 출석 합계 23 · 지각 3 · 결석 2 (5과목, 오늘 출석 전 기준) — v5 요약 타일과 같음
 *   ※ v5 과목별 행의 서비스디자인 '출석 6' · 브랜드디자인 '출석 5' · 디자인경영 '출석 10'은 요약(23)과 합이 안 맞음
 *     → 이 파일 기록(4 · 3 · 9) 기준으로 표시 (Figma 갱신 필요)
 * ※ 출석 숫자의 단일 기준: 수강과목(과목 상세 '출석' 타일·출석 현황 카드)도 courseStats()를 그대로 읽는다.
 * 사이버 강의(글쓰기와 소통): 주차별 강의는 월요일 09:00에 열리고 그 주 일요일까지 들으면 출석.
 *   1–6주차 수강 완료(6주차 ~10.11, 10.07에 수강) → 7주차는 10.12(월) 오픈 · 10.18(일)까지.
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
  /** 사이버 강의: 실제로 수강한 날짜 'MM.DD' (date는 수강 마감일) */
  doneDate?: string;
  /** 사이버 강의: 강의가 열리는 날짜 'MM.DD' */
  opens?: string;
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
  // 1주차
  sess('motion-graphics', 1, '09.01', '화', '14:00', '16:50', '결석'),
  sess('design-management', 1, '09.02', '수', '10:30', '11:45', '출석', { time: '10:27', method: 'PIN' }),
  sess('service-design', 1, '09.04', '금', '10:00', '11:50', '출석', { time: '09:57', method: 'PIN' }),
  sess('brand-design', 1, '09.04', '금', '13:00', '14:50', '출석', { time: '12:56', method: 'NFC' }),
  sess('ux-research', 1, '09.04', '금', '15:00', '16:50', '출석', { time: '14:58', method: 'PIN' }),
  // 2주차
  sess('design-management', 2, '09.07', '월', '10:30', '11:45', '출석', { time: '10:29', method: 'NFC' }),
  sess('motion-graphics', 2, '09.08', '화', '14:00', '16:50', '지각', { time: '14:12', method: 'QR', lateMin: 12 }),
  sess('design-management', 2, '09.09', '수', '10:30', '11:45', '출석', { time: '10:28', method: 'PIN' }),
  sess('service-design', 2, '09.11', '금', '10:00', '11:50', '출석', { time: '09:58', method: 'PIN' }),
  sess('brand-design', 2, '09.11', '금', '13:00', '14:50', '출석', { time: '12:58', method: 'PIN' }),
  sess('ux-research', 2, '09.11', '금', '15:00', '16:50', '출석', { time: '14:57', method: 'PIN' }),
  // 3주차
  sess('design-management', 3, '09.14', '월', '10:30', '11:45', '출석', { time: '10:26', method: 'PIN' }),
  sess('motion-graphics', 3, '09.15', '화', '14:00', '16:50', '출석', { time: '13:58', method: 'PIN' }),
  sess('design-management', 3, '09.16', '수', '10:30', '11:45', '출석', { time: '10:29', method: 'NFC' }),
  sess('service-design', 3, '09.18', '금', '10:00', '11:50', '출석', { time: '09:55', method: 'NFC' }),
  sess('brand-design', 3, '09.18', '금', '13:00', '14:50', '지각', { time: '13:08', method: 'QR', lateMin: 8 }),
  sess('ux-research', 3, '09.18', '금', '15:00', '16:50', '결석'),
  // 4주차 (9.25(금) 추석 연휴 휴강)
  sess('design-management', 4, '09.21', '월', '10:30', '11:45', '출석', { time: '10:27', method: 'PIN' }),
  sess('motion-graphics', 4, '09.22', '화', '14:00', '16:50', '출석', { time: '13:57', method: 'NFC' }),
  sess('design-management', 4, '09.23', '수', '10:30', '11:45', '지각', { time: '10:41', method: 'QR', lateMin: 11 }),
  // 5주차
  sess('design-management', 5, '09.28', '월', '10:30', '11:45', '출석', { time: '10:28', method: 'PIN' }),
  sess('motion-graphics', 5, '09.29', '화', '14:00', '16:50', '출석', { time: '13:59', method: 'PIN' }),
  sess('design-management', 5, '09.30', '수', '10:30', '11:45', '출석', { time: '10:25', method: 'NFC' }),
  sess('service-design', 5, '10.02', '금', '10:00', '11:50', '출석', { time: '09:59', method: 'PIN' }),
  sess('brand-design', 5, '10.02', '금', '13:00', '14:50', '출석', { time: '12:57', method: 'NFC' }),
  sess('ux-research', 5, '10.02', '금', '15:00', '16:50', '출석', { time: '14:59', method: 'QR' }),
  // 6주차 (10.05(월) 대체공휴일 휴강)
  sess('motion-graphics', 6, '10.06', '화', '14:00', '16:50', '출석', { time: '13:56', method: 'PIN' }),
  sess('design-management', 6, '10.07', '수', '10:30', '11:45', '출석', { time: '10:27', method: 'PIN' }),
  // 사이버 강의(글쓰기와 소통) — 출석 탭 목록엔 없음(Figma), 상세 라우트용 (date = 수강 마감일)
  sess('writing', 1, '09.06', '일', '00:00', '23:59', '출석', { time: '21:40', doneDate: '09.06', opens: '09.01' }),
  sess('writing', 2, '09.13', '일', '00:00', '23:59', '출석', { time: '22:10', doneDate: '09.09', opens: '09.07' }),
  sess('writing', 3, '09.20', '일', '00:00', '23:59', '출석', { time: '20:30', doneDate: '09.17', opens: '09.14' }),
  sess('writing', 4, '09.27', '일', '00:00', '23:59', '출석', { time: '21:05', doneDate: '09.23', opens: '09.21' }),
  sess('writing', 5, '10.04', '일', '00:00', '23:59', '출석', { time: '22:40', doneDate: '09.30', opens: '09.28' }),
  sess('writing', 6, '10.11', '일', '00:00', '23:59', '출석', { time: '21:15', doneDate: '10.07', opens: '10.05' }),
];

/** 오늘(금 10.09) 수업 + 다음 예정 수업 */
const TODAY_AND_NEXT: Session[] = [
  sess('service-design', 6, TODAY_MD, '금', '10:00', '11:50', '인증 가능'),
  sess('brand-design', 6, TODAY_MD, '금', '13:00', '14:50', '오늘'),
  sess('ux-research', 6, TODAY_MD, '금', '15:00', '16:50', '오늘'),
  sess('design-management', 7, '10.12', '월', '10:30', '11:45', '예정'),
  sess('motion-graphics', 7, '10.13', '화', '14:00', '16:50', '예정'),
  sess('service-design', 7, '10.16', '금', '10:00', '11:50', '예정'),
  sess('brand-design', 7, '10.16', '금', '13:00', '14:50', '예정'),
  sess('ux-research', 7, '10.16', '금', '15:00', '16:50', '예정'),
  sess('writing', 7, '10.18', '일', '00:00', '23:59', '예정', { opens: '10.12' }),
];

/** 학기 총 수업 횟수 (15주 · 주2회 과목은 개강 주 월요일 제외) */
export const TOTAL_SESSIONS: Record<CourseId, number> = {
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
  return sess('service-design', 6, TODAY_MD, '금', '10:00', '11:50', '출석', { time: t.time ?? '10:01', method: t.method ?? 'PIN' });
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
  const upcoming = TODAY_AND_NEXT.filter((s) => s.courseId === id && !(t.complete && s.courseId === 'service-design' && s.date === TODAY_MD));
  const today = upcoming.filter((s) => s.date === TODAY_MD);
  const next = upcoming.filter((s) => s.date !== TODAY_MD).slice(0, 1);
  return [...past, ...today, ...next].sort((a, b) => (a.key < b.key ? -1 : 1));
}

export function nextSession(id: CourseId, t: TodayState) {
  return courseSessions(id, t).find((s) => s.status === '예정' || s.status === '오늘' || s.status === '인증 가능');
}

/** 기록 행 보조 문구 (v5 683:5994): '13:58 PIN' / '인증 기록 없음' / '14:12 QR · 12분 지각' / '14:00 수업 예정' */
export function recordMeta(r: Session, detail = false) {
  const online = courseById(r.courseId).online;
  if (r.status === '결석') return '인증 기록 없음';
  if (r.status === '출석' || r.status === '지각') {
    if (online) return `${r.doneDate ?? r.date} ${r.time} 수강 완료`;
    return [`${r.time} ${r.method}`, detail && r.lateMin ? `${r.lateMin}분 지각` : null].filter(Boolean).join(' · ');
  }
  if (online) return r.opens ? `${r.opens} 09:00 오픈 예정` : `${r.date} (${r.dow})까지 수강`;
  if (r.status === '인증 가능') return `${r.start} 수업 · ${closesAt(r.start)}까지 인증`;
  return `${r.start} 수업 예정`;
}

/** 이의 신청 시트 회차 보조 문구 (v5 692:7904): '결석 · 인증 기록 없음' / '지각 · 14:12 QR 인증' */
export const appealMeta = (r: Session) => `${r.status} · ${r.status === '결석' ? '인증 기록 없음' : `${r.time} ${r.method} 인증`}`;

/** 출석 탭 '오늘 수업' (v5 683:5844) — 오늘 수업 3개, 서비스디자인은 출석하면 기록으로 바뀜 */
export function todaySessions(t: TodayState): Session[] {
  const today = todayRecord(t);
  return TODAY_AND_NEXT.filter((x) => x.date === TODAY_MD).map((x) => (today && x.courseId === today.courseId ? today : x));
}

/** 'MM.DD' → '10.12(월)' */
export const shortDay = (r: Pick<Session, 'date' | 'dow'>) => `${Number(r.date.slice(0, 2))}.${Number(r.date.slice(3))}(${r.dow})`;
/** 출석 인증 마감 = 시작 + 10분 */
export const closesAt = (start: string) => {
  const [h, m] = start.split(':').map(Number);
  const t = h * 60 + m + 10;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

/** 과목 상세(수강과목) '출석 현황' 카드 아래 줄 — 출석 데이터에서 파생 */
export function nextAttendLabel(id: CourseId, t: TodayState) {
  const n = nextSession(id, t);
  if (!n) return '이번 학기 수업이 모두 끝났어요';
  if (courseById(id).online) return `${n.week}주차 강의 · ${n.opens ? `${shortDay({ date: n.opens, dow: '월' })} 오픈` : `${shortDay(n)}까지`}`;
  if (n.status === '인증 가능' || n.status === '오늘') return `다음 출석 · 오늘 ${n.start} (${closesAt(n.start)}까지 인증)`;
  return `다음 출석 · ${shortDay(n)} ${n.start}`;
}

/** 사이버 강의 진도 — 수강 완료 주차 / 전체 주차 */
export function onlineProgress(id: CourseId, t: TodayState) {
  const st = courseStats(id, t);
  const n = nextSession(id, t);
  const progress = Math.round((st.present / TOTAL_SESSIONS[id]) * 100);
  const label = `${st.present}주차 강의 수강 완료${n?.opens ? ` · ${n.week}주차 ${Number(n.opens.slice(0, 2))}.${Number(n.opens.slice(3))} 오픈` : ''}`;
  return { progress, label };
}

export const courseName = (id: CourseId) => courseById(id).name;
export const isAttendanceCourse = (id: string): id is CourseId => COURSES.some((c) => c.id === id);
