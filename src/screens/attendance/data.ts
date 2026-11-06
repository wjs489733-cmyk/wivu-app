import { COURSES, courseById, type CourseId } from '@/data/core';
import { addDays, dayDiff, DOW_KO, fmtHM, fmtISO, fmtMD, hmToMin, mdToDate, now as clockNow, sameDay, sd, shiftDate, TIME_FIXED } from '@/data/clock';
import { classesOn, isHoliday, nextSession as nextClass, openSession, phaseOf, type ClassSession } from '@/data/today';
import { useApp, type AttendMethod } from '@/store/app';

/* ────────────────────────────────────────────────────────────
 * 출석 섹션 데이터 — Figma v5 683:5844 · 683:5994 텍스트 기준 (이전 392:7302 · 406:8047)
 * 학기: 2026-09-01(화) 개강, 시나리오 '오늘' = 10.09(금) 6주차 (core SCENARIO_DAY)
 *   4주차 9.25(금) 휴강 → 금요일 수업 휴강 · 6주차 10.05(월) 휴강 → 월요일 수업 휴강 (today.ts isHoliday)
 * 출석률 = (출석 + 지각) / 진행된 수업 — 모션그래픽스 83%(4+1 / 6)
 * 과목별 행 = v5 683:5844 그대로: 서비스디자인 출석 6 · 브랜드디자인 출석 5 · 지각 1 · UX 리서치 출석 3 · 결석 1 ·
 *   디자인경영 출석 10 · 지각 1 · 모션그래픽스 출석 4 · 지각 1 · 결석 1
 *   → 휴강(9.25 · 10.5) 보강 회차(makeup)를 넣어 과목 상세 기록과 숫자가 맞게 함
 * 상단 요약 23 · 3 · 2 (v5 요약 타일) = 정규 회차 기준 — 보강 회차는 요약에서 뺀다 (totals)
 *   ※ v5 요약(23)은 v5 과목별 행 합(28)과 다름 → 요약은 '정규 회차' 규칙으로 맞춤 (Figma 정리 시 확인 필요)
 * ※ 출석 숫자의 단일 기준: 수강과목(과목 상세 '출석' 타일·출석 현황 카드)도 courseStats()를 그대로 읽는다.
 * 사이버 강의(글쓰기와 소통): 주차별 강의는 월요일 09:00에 열리고 그 주 일요일까지 들으면 출석.
 *   1–6주차 수강 완료(6주차 ~10.11, 10.07 21:15에 수강) → 7주차는 10.12(월) 오픈 · 10.18(일)까지.
 *
 * 11-06 실시간 전환 (data/clock.ts · data/today.ts)
 *   · 날짜: 시나리오 주(10.05–10.11)를 실제 이번 주로 옮김 — 모든 날짜는 sess()에서 shiftDate / sd()로 옮기고 정렬 키도 옮긴 날짜로 계산
 *   · 이번 주 · 다음 주 수업 = today.ts classesOn() (요일 시간표 + 월 휴강 + 화 10:30 디자인경영 보강)
 *   · 회차 상태 (브리프 규칙 4): 오늘 이전 = 기록(아래 PAST, 없으면 '출석' · 시작 3분 전 · PIN)
 *       오늘 = phaseOf(now) + store attended[key] → 창 전 '오늘' · 창 안 '인증 가능' · 완료 '출석' · 창 닫힘 + 기록 없음 '결석'(인증 마감)
 *       이후 = '예정'
 *   · 숫자(요약·과목별)도 now 기준 — ?now=2026-10-09T09:41 이면 원래 Figma 숫자 그대로
 * ──────────────────────────────────────────────────────────── */

export type RecordStatus = '출석' | '지각' | '결석';
export type SessionStatus = RecordStatus | '예정' | '오늘' | '인증 가능';

export type Session = {
  courseId: CourseId;
  week: number;
  /** 'MM.DD' (이번 주로 옮긴 실제 날짜) */
  date: string;
  /** 수업 날 0시 (사이버 강의는 수강 마감일) */
  day: Date;
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
  /** 사이버 강의: 강의가 이미 열려 수강 기간 중 */
  opened?: boolean;
  /** 휴강 보강 회차 — 기록 행에 '보강'으로 보이고, 출석 탭 상단 요약(정규 회차)에서는 빠진다 */
  makeup?: boolean;
  /** 오늘 수업인데 인증 창이 닫혔고 기록이 없음 → '결석'으로 세고 배지는 '인증 마감' */
  missed?: boolean;
  /** 정렬용 (YYYYMMDD + 시작 시각, 옮긴 날짜 기준) */
  key: string;
};

type Attended = Record<string, { method: AttendMethod; time: string }>;

const pad2 = (n: number) => String(n).padStart(2, '0');
const hm = (min: number) => `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`;
/** 시나리오 'MM.DD' → 이번 주로 옮긴 날 0시 */
const scen = (md: string) => {
  const [m, d] = md.split('.').map(Number);
  return shiftDate(new Date(2026, m - 1, d));
};
const sortKey = (day: Date, start: string) => fmtISO(day).replace(/-/g, '') + start.replace(':', '');
const atTime = (day: Date, t: string) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(hmToMin(t) / 60), hmToMin(t) % 60);

/** 시나리오 날짜로 적은 회차 → 옮긴 날짜의 회차 (날짜 · 수강일 · 오픈일 · 정렬 키 모두 옮김) */
const sess = (courseId: CourseId, week: number, md: string, dow: Session['dow'], start: string, end: string, status: SessionStatus, extra: Partial<Session> = {}): Session => {
  const day = scen(md);
  return {
    courseId,
    week,
    date: fmtMD(day),
    day,
    dow,
    start,
    end,
    status,
    key: sortKey(day, start),
    ...extra,
    ...(extra.doneDate ? { doneDate: sd(extra.doneDate) } : {}),
    ...(extra.opens ? { opens: sd(extra.opens) } : {}),
  };
};

/** 출석 기록 (시나리오 금 10.09 9:41 시점까지) — 이번 주(6주차) 기록은 그날이 오늘보다 앞일 때만 쓴다 */
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
  // 4주차 (9.25(금) 휴강)
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
  // 6주차 (10.05(월) 휴강) — 이번 주. 화 10:30 디자인경영 보강(today.ts EXTRA와 같은 날 · 목요일은 Figma '홈 · 공강 (목)'대로 수업 없음)
  sess('design-management', 6, '10.06', '화', '10:30', '11:45', '출석', { time: '10:26', method: 'PIN', makeup: true }),
  sess('motion-graphics', 6, '10.06', '화', '14:00', '16:50', '출석', { time: '13:56', method: 'PIN' }),
  sess('design-management', 6, '10.07', '수', '10:30', '11:45', '출석', { time: '10:27', method: 'PIN' }),
  // 보강 (v5 과목별 숫자에 맞춤) — 9.25 휴강 금요일 과목은 5주차 수·목에 2회 나눠 보강
  sess('brand-design', 4, '09.30', '수', '13:00', '14:50', '출석', { time: '12:55', method: 'NFC', makeup: true }),
  sess('service-design', 4, '09.30', '수', '15:00', '16:50', '출석', { time: '14:56', method: 'PIN', makeup: true }),
  sess('brand-design', 4, '10.01', '목', '13:00', '14:50', '출석', { time: '12:58', method: 'PIN', makeup: true }),
  sess('service-design', 4, '10.01', '목', '15:00', '16:50', '출석', { time: '14:57', method: 'NFC', makeup: true }),
  // 사이버 강의(글쓰기와 소통) — 출석 탭 목록엔 없음(Figma), 상세 라우트용 (date = 수강 마감일)
  sess('writing', 1, '09.06', '일', '00:00', '23:59', '출석', { time: '21:40', doneDate: '09.06', opens: '09.01' }),
  sess('writing', 2, '09.13', '일', '00:00', '23:59', '출석', { time: '22:10', doneDate: '09.09', opens: '09.07' }),
  sess('writing', 3, '09.20', '일', '00:00', '23:59', '출석', { time: '20:30', doneDate: '09.17', opens: '09.14' }),
  sess('writing', 4, '09.27', '일', '00:00', '23:59', '출석', { time: '21:05', doneDate: '09.23', opens: '09.21' }),
  sess('writing', 5, '10.04', '일', '00:00', '23:59', '출석', { time: '22:40', doneDate: '09.30', opens: '09.28' }),
  sess('writing', 6, '10.11', '일', '00:00', '23:59', '출석', { time: '21:15', doneDate: '10.07', opens: '10.05' }),
];

/** 이번 주(= 6주차) 월요일 */
const WEEK_MON = scen('10.05');
const THIS_WEEK = 6;
/** 지난주까지의 기록 (이번 주 기록은 아래에서 오늘과 비교해 다시 정함) */
const HISTORY = PAST.filter((r) => dayDiff(r.day, WEEK_MON) > 0);
/** 이번 주 오프라인 기록 (오늘보다 앞선 날에만 씀) */
const WEEK_LOG = PAST.filter((r) => r.courseId !== 'writing' && dayDiff(WEEK_MON, r.day) >= 0);
/** 이번 주 · 다음 주 오프라인 수업 — today.ts classesOn() 그대로 (날짜 단위라 모듈에서 한 번만) */
const WEEK_CLASSES = Array.from({ length: 14 }, (_, i) => classesOn(addDays(WEEK_MON, i)).map((cs) => ({ cs, week: THIS_WEEK + Math.floor(i / 7) }))).flat();
/** 사이버 강의 이번 주(6주차) 기록 · 다음 주(7주차) 강의 */
const ONLINE_W6 = PAST.find((r) => r.courseId === 'writing' && r.week === THIS_WEEK)!;
const ONLINE_W7 = sess('writing', 7, '10.18', '일', '00:00', '23:59', '예정', { opens: '10.12' });

/** 오프라인 수업 회차 하나의 지금 상태 (브리프 규칙 4) */
function liveClass(cs: ClassSession, week: number, now: Date, attended: Attended): Session {
  const base = {
    courseId: cs.courseId,
    week,
    date: fmtMD(cs.day),
    day: cs.day,
    dow: DOW_KO[cs.day.getDay()],
    start: cs.start,
    end: cs.end,
    key: sortKey(cs.day, cs.start),
    ...(cs.makeup ? { makeup: true } : {}),
  };
  const dd = dayDiff(now, cs.day);
  if (dd > 0) return { ...base, status: '예정' };
  const rec = attended[cs.key];
  if (rec) return { ...base, status: '출석', time: rec.time, method: rec.method };
  if (dd < 0) {
    const log = WEEK_LOG.find((r) => r.courseId === cs.courseId && r.date === base.date && r.start === cs.start);
    if (log) return { ...base, status: log.status, time: log.time, method: log.method, ...(log.lateMin ? { lateMin: log.lateMin } : {}) };
    return { ...base, status: '출석', time: hm(cs.startMin - 3), method: 'PIN' };
  }
  const ph = phaseOf(cs, now);
  if (ph === 'upcoming') return { ...base, status: '오늘' };
  if (ph === 'open') return { ...base, status: '인증 가능' };
  return { ...base, status: '결석', missed: true };
}

/** 사이버 강의 이번 주: 수강한 시각이 지났으면 '출석', 아니면 수강 기간(열렸으면 opened) */
function liveOnline(now: Date): Session[] {
  const doneAt = atTime(mdToDate(ONLINE_W6.doneDate!), ONLINE_W6.time!);
  if (now.getTime() >= doneAt.getTime()) return [ONLINE_W6, ONLINE_W7];
  const opensAt = atTime(mdToDate(ONLINE_W6.opens!), '09:00');
  const w6: Session = { ...ONLINE_W6, status: '예정', opened: now.getTime() >= opensAt.getTime() };
  delete w6.time;
  delete w6.method;
  delete w6.doneDate;
  return [w6, ONLINE_W7];
}

const byKey = (a: Session, b: Session) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
let memo: { min: number; a: Attended; v: Session[] } | null = null;
/** 학기 전체 회차 (지난 기록 + 이번 주·다음 주 수업, 지금 상태) — 같은 분·같은 기록이면 다시 계산 안 함 */
function live(now: Date, attended: Attended): Session[] {
  const min = Math.floor(now.getTime() / 60000);
  if (memo && memo.min === min && memo.a === attended) return memo.v;
  const v = [...HISTORY, ...WEEK_CLASSES.map(({ cs, week }) => liveClass(cs, week, now, attended)), ...liveOnline(now)].sort(byKey);
  memo = { min, a: attended, v };
  return v;
}

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

/**
 * 출석 상태 입력. complete · method · time = 호환용(마지막 출석 완료) — 계산에는 attended(수업별 기록)만 쓴다.
 * attended를 안 주면 스토어 값을 그대로 읽음 (수강과목 화면 호환).
 */
export type TodayState = { complete: boolean; method: AttendMethod | null; time: string | null; attended?: Attended };
const attendedOf = (t: TodayState) => t.attended ?? useApp.getState().attended;

const isRecord = (s: SessionStatus): s is RecordStatus => s === '출석' || s === '지각' || s === '결석';

/** 모든 출석 기록 (최신순) — 지금(now) 기준 */
export function allRecords(t: TodayState, includeOnline = false, now: Date = clockNow()): Session[] {
  return live(now, attendedOf(t))
    .filter((r) => isRecord(r.status) && (includeOnline || r.courseId !== 'writing'))
    .slice()
    .sort((a, b) => byKey(b, a));
}

export type CourseStats = { present: number; late: number; absent: number; held: number; remaining: number; rate: number };

export function courseStats(id: CourseId, t: TodayState, now: Date = clockNow()): CourseStats {
  const recs = allRecords(t, true, now).filter((r) => r.courseId === id);
  const present = recs.filter((r) => r.status === '출석').length;
  const late = recs.filter((r) => r.status === '지각').length;
  const absent = recs.filter((r) => r.status === '결석').length;
  const held = present + late + absent;
  const rate = held ? Math.round(((present + late) / held) * 100) : 100;
  return { present, late, absent, held, remaining: TOTAL_SESSIONS[id] - held, rate };
}

/** 출석 탭 상단 요약 — 정규 회차만 (보강 제외) · v5 23 · 3 · 2 */
export function totals(t: TodayState, now: Date = clockNow()) {
  const recs = allRecords(t, false, now).filter((r) => !r.makeup && ATTENDANCE_COURSES.includes(r.courseId));
  return {
    present: recs.filter((r) => r.status === '출석').length,
    late: recs.filter((r) => r.status === '지각').length,
    absent: recs.filter((r) => r.status === '결석').length,
  };
}

/** 과목 상세 '회차별 기록' — 지난 회차 + 오늘 + 다음 1회 */
export function courseSessions(id: CourseId, t: TodayState, now: Date = clockNow()): Session[] {
  const mine = live(now, attendedOf(t)).filter((r) => r.courseId === id);
  const past = mine.filter((r) => isRecord(r.status));
  const upcoming = mine.filter((r) => !isRecord(r.status));
  const today = upcoming.filter((r) => sameDay(r.day, now));
  const next = upcoming.filter((r) => dayDiff(now, r.day) > 0).slice(0, 1);
  return [...past, ...today, ...next].sort(byKey);
}

export function nextSession(id: CourseId, t: TodayState, now: Date = clockNow()) {
  return courseSessions(id, t, now).find((s) => s.status === '예정' || s.status === '오늘' || s.status === '인증 가능');
}

/** 기록 행 보조 문구 (v5 683:5994): '13:58 PIN' / '인증 기록 없음' / '14:12 QR · 12분 지각' / '14:00 수업 예정' */
export function recordMeta(r: Session, detail = false) {
  const online = courseById(r.courseId).online;
  if (r.missed) return MISSED_TEXT;
  if (r.status === '결석') return '인증 기록 없음';
  if (r.status === '출석' || r.status === '지각') {
    if (online) return `${r.doneDate ?? r.date} ${r.time} 수강 완료`;
    return [`${r.time} ${r.method}`, detail && r.lateMin ? `${r.lateMin}분 지각` : null].filter(Boolean).join(' · ');
  }
  if (online) return r.opens && !r.opened ? `${r.opens} 09:00 오픈 예정` : `${r.date} (${r.dow})까지 수강`;
  if (r.status === '인증 가능') return `${r.start} 수업 · ${closesAt(r.start)}까지 인증`;
  return `${r.start} 수업 예정`;
}

/** 이의 신청 시트 회차 보조 문구 (v5 692:7904): '결석 · 인증 기록 없음' / '지각 · 14:12 QR 인증' / '인증 마감 · 출석 인증 시간이 지났어요' */
export const appealMeta = (r: Session) => (r.missed ? `${MISSED_BADGE} · ${MISSED_TEXT}` : `${r.status} · ${r.status === '결석' ? '인증 기록 없음' : `${r.time} ${r.method} 인증`}`);

/** 출석 탭 '오늘 수업' (v5 683:5844) — 실제 오늘 수업(today.ts classesOn 순서) · 지금 상태 */
export function todaySessions(t: TodayState, now: Date = clockNow()): Session[] {
  return live(now, attendedOf(t)).filter((r) => r.courseId !== 'writing' && sameDay(r.day, now));
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
export function nextAttendLabel(id: CourseId, t: TodayState, now: Date = clockNow()) {
  const n = nextSession(id, t, now);
  if (!n) return '이번 학기 수업이 모두 끝났어요';
  if (courseById(id).online) return `${n.week}주차 강의 · ${n.opens && !n.opened ? `${shortDay({ date: n.opens, dow: '월' })} 오픈` : `${shortDay(n)}까지`}`;
  if (n.status === '인증 가능' || n.status === '오늘') return `다음 출석 · 오늘 ${n.start} (${closesAt(n.start)}까지 인증)`;
  return `다음 출석 · ${shortDay(n)} ${n.start}`;
}

/** 사이버 강의 진도 — 수강 완료 주차 / 전체 주차 */
export function onlineProgress(id: CourseId, t: TodayState, now: Date = clockNow()) {
  const st = courseStats(id, t, now);
  const n = nextSession(id, t, now);
  const md = (x: string) => `${Number(x.slice(0, 2))}.${Number(x.slice(3))}`;
  const tail = !n ? '' : n.opens && !n.opened ? ` · ${n.week}주차 ${md(n.opens)} 오픈` : ` · ${n.week}주차 ${shortDay(n)}까지 수강`;
  const progress = Math.round((st.present / TOTAL_SESSIONS[id]) * 100);
  return { progress, label: `${st.present}주차 강의 수강 완료${tail}` };
}

export const courseName = (id: CourseId) => courseById(id).name;
export const isAttendanceCourse = (id: string): id is CourseId => COURSES.some((c) => c.id === id);

/* ── 지금 인증 (출석 탭 · PIN 시트 · QR · 완료) — 브리프 공통 문구 ───────── */
export const NO_OPEN_TEXT = '지금 인증할 수 있는 수업이 없어요';
export const ALL_DONE_TEXT = '오늘 수업이 모두 끝났어요';
export const MISSED_BADGE = '인증 마감';
export const MISSED_TEXT = '출석 인증 시간이 지났어요';

/** '다음 수업 금 13:00 브랜드디자인 · 12:40부터 인증' (없으면 null) */
export function nextClassLine(now: Date): string | null {
  const n = nextClass(now);
  return n ? `다음 수업 ${DOW_KO[n.day.getDay()]} ${n.start} ${n.course.name} · ${n.opens}부터 인증` : null;
}

/** 오늘 수업이 없는 날 문구 — 휴강일 / 공강(목·주말) */
export const freeDayText = (now: Date) => (isHoliday(now) ? { title: '휴강일이라 수업이 없어요', tag: '휴강' } : { title: '오늘은 수업이 없어요', tag: '공강' });

/** 지금 인증 대상: 창이 열린 수업 + 그 수업 기록 (이미 출석했으면 rec) */
export function attendTarget(now: Date, attended: Attended) {
  const s = openSession(now);
  return { session: s, rec: s ? attended[s.key] : undefined };
}

/** 완료 시각 미리보기 — 스토어 completeAttendance와 같은 규칙 (고정 9:41이면 Figma 09:52) */
const previewTime = (now: Date) => (TIME_FIXED && fmtHM(now) === '09:41' ? '09:52' : fmtHM(now));

/**
 * 출석 완료 본문에 보일 기록 — key(방금 완료한 수업) → 마지막 완료 기록 → 지금 열린 수업(미리보기) 순.
 * 없으면 null (인증할 수업도 기록도 없음).
 */
export function doneRecord(attended: Attended, key: string | undefined, now: Date): { courseId: CourseId; time: string; method: AttendMethod } | null {
  const keys = Object.keys(attended);
  const k = key ?? keys[keys.length - 1] ?? openSession(now)?.key;
  if (!k) return null;
  const courseId = k.split('|')[1] as CourseId;
  if (!isAttendanceCourse(courseId)) return null;
  const rec = attended[k];
  return { courseId, time: rec?.time ?? previewTime(now), method: rec?.method ?? 'PIN' };
}
