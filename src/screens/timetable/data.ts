import { P } from '@/app/paths';
import { COURSES, NOW, courseById, type CourseId, type Weekday } from '@/data/core';
import { ASSIGNMENT_LIST } from '@/screens/courses/data';

/* ────────────────────────────────────────────────────────────
 * 시간표 · 캘린더 섹션 데이터 — Figma 392:7472 · 402:7846 · 403:7931 · 392:7540 · 404:7979 · 405:8022
 * 기준 시각: core NOW (2026-10-09 금 9:41 · 6주차). 과목은 core COURSES가 기준, 검색 카탈로그는 가상 과목.
 * ──────────────────────────────────────────────────────────── */

export const DAYS: Weekday[] = ['월', '화', '수', '목', '금'];
export const DOW = ['일', '월', '화', '수', '목', '금', '토'] as const;
export const DOW_FULL = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'] as const;

export const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
export const NOW_MIN = NOW.getHours() * 60 + NOW.getMinutes(); // 9:41 → 581

/* ── 날짜 유틸 (YYYY-MM-DD 문자열, 로컬 시간) ───────────────── */
const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseIso = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const TODAY = iso(NOW); // '2026-10-09'
export const addDays = (s: string, n: number) => {
  const d = parseIso(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};
export const dayDiff = (a: string, b: string) => Math.round((parseIso(b).getTime() - parseIso(a).getTime()) / 86400000);
export const dowOf = (s: string) => DOW[parseIso(s).getDay()];
/** '10월 12일 (월)' */
export const longDate = (s: string) => {
  const d = parseIso(s);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`;
};
/** '10.12' */
export const shortDate = (s: string) => {
  const d = parseIso(s);
  return `${d.getMonth() + 1}.${d.getDate()}`;
};
/** 'D-3' · 'D-DAY' · '종료' */
export const dday = (s: string) => {
  const n = dayDiff(TODAY, s);
  return n === 0 ? 'D-DAY' : n > 0 ? `D-${n}` : '지난 일정';
};

/* ── 시간표 과목 (core + 카탈로그) ─────────────────────────── */
export type Slot = { day: Weekday; start: string; end: string };
export type TTCourse = {
  id: string;
  name: string;
  professor: string;
  slots: Slot[];
  room: string;
  credits: number;
  kind: '전공' | '교양';
  online?: boolean;
  /** 블록 안 두 줄 표기 (Figma: '서비스⏎디자인' / '디자인관⏎302') */
  blockName: string;
  blockRoom: string;
  /** 사이버 강의 카드 보조 문구 */
  onlineNote?: string;
  /** core 수강 과목(과목 상세 라우트 있음) */
  core: boolean;
};

const BLOCK: Record<CourseId, { name: string; room: string; note?: string }> = {
  'service-design': { name: '서비스\n디자인', room: '디자인관\n302' },
  'brand-design': { name: '브랜드\n디자인', room: '디자인관\n401' },
  'ux-research': { name: 'UX\n리서치', room: '정보관\n210' },
  'design-management': { name: '디자인\n경영', room: '인문관\n305' },
  'motion-graphics': { name: '모션\n그래픽스', room: '디자인관\nB103' },
  writing: { name: '글쓰기와\n소통', room: '', note: '시간 무관 · 7주차 강의 10.12 오픈' },
};

export const CORE_COURSES: TTCourse[] = COURSES.map((c) => ({
  id: c.id,
  name: c.name,
  professor: c.professor,
  slots: c.slots,
  room: c.room,
  credits: c.credits,
  kind: c.kind,
  online: c.online,
  blockName: BLOCK[c.id].name,
  blockRoom: BLOCK[c.id].room,
  onlineNote: BLOCK[c.id].note,
  core: true,
}));

/** 수업 추가 검색 카탈로그 — 가상 과목 · 교수명 OOO 패턴. 'UX' 검색 결과 4개는 Figma 403:7931 그대로 */
export const CATALOG: TTCourse[] = [
  CORE_COURSES.find((c) => c.id === 'ux-research')!,
  { id: 'uxui-prototyping', name: 'UX/UI 프로토타이핑', professor: '최OO', slots: [{ day: '목', start: '13:00', end: '15:50' }], room: '디자인관 B201', credits: 3, kind: '전공', blockName: 'UX/UI\n프로토\n타이핑', blockRoom: '디자인관\nB201', core: false },
  { id: 'ux-writing', name: 'UX 라이팅', professor: '사이버 강의', slots: [], room: '사이버 강의', credits: 2, kind: '교양', online: true, blockName: 'UX\n라이팅', blockRoom: '', onlineNote: '시간 무관 · 1주차 강의 오픈', core: false },
  { id: 'ux-seminar', name: 'UX 세미나', professor: '윤OO', slots: [{ day: '금', start: '13:00', end: '14:15' }], room: '디자인관 401호', credits: 2, kind: '전공', blockName: 'UX\n세미나', blockRoom: '디자인관\n401', core: false },
  { id: 'typography-adv', name: '타이포그래피 심화', professor: '한OO', slots: [{ day: '수', start: '13:00', end: '15:50' }], room: '디자인관 305호', credits: 3, kind: '전공', blockName: '타이포\n그래피', blockRoom: '디자인관\n305', core: false },
  { id: 'info-design', name: '정보디자인', professor: '서OO', slots: [{ day: '화', start: '10:00', end: '11:50' }], room: '디자인관 402호', credits: 3, kind: '전공', blockName: '정보\n디자인', blockRoom: '디자인관\n402', core: false },
  { id: 'interaction-design', name: '인터랙션 디자인', professor: '오OO', slots: [{ day: '화', start: '15:00', end: '16:50' }], room: '디자인관 B201', credits: 3, kind: '전공', blockName: '인터랙션\n디자인', blockRoom: '디자인관\nB201', core: false },
  { id: 'portfolio-seminar', name: '포트폴리오 세미나', professor: '강OO', slots: [{ day: '목', start: '10:00', end: '11:50' }], room: '디자인관 301호', credits: 2, kind: '전공', blockName: '포트폴리오\n세미나', blockRoom: '디자인관\n301', core: false },
  { id: 'data-viz', name: '데이터 시각화', professor: '임OO', slots: [{ day: '월', start: '13:00', end: '14:15' }, { day: '수', start: '16:00', end: '17:15' }], room: '정보관 305호', credits: 3, kind: '전공', blockName: '데이터\n시각화', blockRoom: '정보관\n305', core: false },
  { id: 'english-talk', name: '실용 영어 회화', professor: '문OO', slots: [{ day: '월', start: '15:00', end: '16:15' }, { day: '수', start: '10:30', end: '11:45' }], room: '인문관 201호', credits: 2, kind: '교양', blockName: '실용\n영어', blockRoom: '인문관\n201', core: false },
  { id: 'digital-photo', name: '디지털 사진', professor: '조OO', slots: [{ day: '목', start: '16:00', end: '17:50' }], room: '인문관 B102', credits: 2, kind: '교양', blockName: '디지털\n사진', blockRoom: '인문관\nB102', core: false },
  { id: 'ai-design', name: '생성형 AI와 디자인', professor: '사이버 강의', slots: [], room: '사이버 강의', credits: 2, kind: '교양', online: true, blockName: 'AI와\n디자인', blockRoom: '', onlineNote: '시간 무관 · 1주차 강의 오픈', core: false },
];

export const catalogById = (id: string) => CATALOG.find((c) => c.id === id);

/* ── 시간 표기 ─────────────────────────────────────────────── */
/** '금 15:00–16:50' · '월·수 10:30–11:45' · '사이버 강의 · 시간 무관' */
export function slotText(c: Pick<TTCourse, 'slots' | 'online'>, dash = '–') {
  if (c.online || !c.slots.length) return '사이버 강의 · 시간 무관';
  const same = c.slots.every((sl) => sl.start === c.slots[0].start && sl.end === c.slots[0].end);
  if (same) return `${c.slots.map((sl) => sl.day).join('·')} ${c.slots[0].start}${dash}${c.slots[0].end}`;
  return c.slots.map((sl) => `${sl.day} ${sl.start}${dash}${sl.end}`).join(', ');
}
/** 연속 교시 표기: 110분 → '2교시 연속', 170분 → '3교시 연속' */
export function periodNote(sl: Slot) {
  const dur = toMin(sl.end) - toMin(sl.start);
  return dur >= 110 ? `${Math.round((dur + 10) / 60)}교시 연속` : null;
}

/* ── 겹침 검사 ─────────────────────────────────────────────── */
export type Conflict = { course: TTCourse; slot: Slot; with: Slot };
export function findConflicts(target: TTCourse, existing: TTCourse[]): Conflict[] {
  const out: Conflict[] = [];
  for (const sl of target.slots) {
    for (const c of existing) {
      if (c.id === target.id) continue;
      for (const o of c.slots) {
        if (o.day === sl.day && toMin(sl.start) < toMin(o.end) && toMin(o.start) < toMin(sl.end)) out.push({ course: c, slot: o, with: sl });
      }
    }
  }
  return out;
}

/** 해당 요일의 다음 수업 날짜 (오늘 이후 첫 날) */
export function nextClassDate(c: TTCourse): { date: string; slot: Slot } | null {
  for (let i = 0; i < 14; i++) {
    const d = addDays(TODAY, i);
    const sl = c.slots.find((x) => x.day === dowOf(d));
    if (!sl) continue;
    if (i === 0 && toMin(sl.end) <= NOW_MIN) continue;
    return { date: d, slot: sl };
  }
  return null;
}

/* ── 캘린더 ────────────────────────────────────────────────── */
export type Category = 'class' | 'assignment' | 'academic' | 'personal';
export const CATEGORIES: Category[] = ['class', 'assignment', 'academic', 'personal'];
/** 카테고리 색 — 디자인 규칙 §5 칩 색 매핑(학사 → brand)을 따름.
 *  Figma 392:7540은 학사=초록(pulse)·수업=브랜드였지만, 학사를 brand로 통일하면서 수업은 잉크(진한 남색)로 구분 */
export const CAT: Record<Category, { label: string; detail: string; color: string; tone: 'brand' | 'dangerSoft' | 'outline' | 'neutral' }> = {
  class: { label: '수업', detail: '수업', color: 'var(--wivu-color-text-primary)', tone: 'outline' },
  assignment: { label: '과제', detail: '과제', color: 'var(--wivu-color-status-error)', tone: 'dangerSoft' },
  academic: { label: '학사', detail: '학사 일정', color: 'var(--wivu-color-bg-brand)', tone: 'brand' },
  personal: { label: '개인', detail: '개인 일정', color: 'var(--wivu-color-text-tertiary)', tone: 'neutral' },
};

export type CalEvent = {
  id: string;
  title: string;
  category: Category;
  /** 목록·D-day 기준 날짜 */
  date: string;
  /** 여러 날 일정 [시작, 끝] */
  span?: [string, string];
  start?: string;
  end?: string;
  /** 마감형 일정 (23:59 마감 등) */
  deadline?: boolean;
  allDay?: boolean;
  holiday?: boolean;
  place?: string;
  /** 캠퍼스 안 장소 → '지도' 칩 */
  onCampus?: boolean;
  /** 목록 보조 문구 */
  meta?: string;
  /** D-day 옆 안내 */
  note?: string;
  source?: string;
  noticeId?: string;
  description?: string;
  alarm?: string;
  repeat?: string;
  courseId?: CourseId;
  /** 과제 일정: 수강과목 과제 id (제출 상태 조회용) */
  aid?: string;
  /** 목록에서 바로 이동할 곳 (과제 상세 등) */
  to?: string;
  /** 사전 신청 CTA */
  apply?: boolean;
  /** 사용자가 만든 일정 (수정·삭제 가능) */
  user?: boolean;
};

/** 과제 일정 — 수강과목 과제 목록(courses/data.ts ASSIGNMENT_LIST)에서 파생 (단일 기준).
 *  제목은 '{과제명} 제출' (Figma 392:7540 '브랜드 무드보드 제출'), 목록 메타는 agenda.eventMeta가 제출 상태로 계산 */
const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const ASSIGNMENT_EVENTS: CalEvent[] = ASSIGNMENT_LIST.map((a) => {
  const course = courseById(a.courseId);
  const date = iso(a.due);
  return {
    id: `${a.courseId}-${a.id}`,
    title: `${a.title} 제출`,
    category: 'assignment',
    date,
    start: hhmm(a.due),
    deadline: true,
    courseId: a.courseId,
    aid: a.id,
    to: P.assignment(a.courseId, a.id),
    source: `${course.name} · 과제 공지`,
    description: a.desc.split('\n\n')[0],
    alarm: a.closed ? undefined : date === iso(NOW) ? '3시간 전' : '하루 전 18:00',
  };
});

export const SEED_EVENTS: CalEvent[] = [
  { id: 'e5', title: '시각디자인과 개강총회', category: 'academic', date: '2026-09-10', start: '18:00', end: '20:00', place: '디자인관 세미나실', onCampus: true, meta: '18:00 · 디자인관 세미나실', source: '학과 공지 · 09.03 등록', description: '2학기 학과 개강총회예요. 학기 일정 안내와 학생회 소개가 이어져요.', alarm: '1시간 전' },
  { id: 'e1', title: '2026 하반기 취업박람회', category: 'academic', date: '2026-10-12', start: '14:00', end: '17:00', place: '학생회관 대강당', onCampus: true, meta: '14:00 · 학생회관 대강당', note: '사전 신청 10.11(일)까지', source: '학사 공지 · 10.03 등록', noticeId: 'n3', apply: true, alarm: '하루 전 18:00 · 1시간 전', description: '지역 기업 32개사가 참여하는 하반기 취업박람회입니다. 현장 면접과 직무 상담이 진행되며, 사전 신청자에게는 이력서·포트폴리오 컨설팅이 제공됩니다.\n\n· 대상: 재학생 및 졸업 예정자\n· 준비물: 학생증, 이력서(선택)' },
  { id: 'e2', title: '중간고사 기간', category: 'academic', date: '2026-10-19', span: ['2026-10-19', '2026-10-23'], allDay: true, meta: '10.19 – 10.23 · 학사 공지', note: '시험 시간표는 과목별 공지 확인', source: '학사 공지 · 10.08 등록', noticeId: 'n1', alarm: '하루 전 18:00', description: '2학기 중간고사 기간이에요. 과목별 시험 시간과 장소는 각 과목 공지에서 확인해 주세요. 시험을 대체하는 과제·발표가 있는 과목도 있어요.' },
  { id: 'e7', title: '포트폴리오 스터디', category: 'personal', date: '2026-10-20', start: '19:00', end: '21:00', place: '중앙도서관 그룹스터디룸 3', onCampus: true, meta: '19:00 · 중앙도서관', alarm: '30분 전', repeat: '매주', user: true },
  { id: 'e8', title: '추석 연휴', category: 'academic', date: '2026-09-24', span: ['2026-09-24', '2026-09-26'], allDay: true, holiday: true, meta: '공휴일 · 9.24 – 9.26', source: '학사 일정', description: '추석 연휴예요. 연휴 중 수업 운영은 각 과목 공지를 확인해 주세요.' },
  ...ASSIGNMENT_EVENTS,
];

/** 수업이 열리는 기간 (학기 시작 ~ 연말) */
export const SEMESTER_START = '2026-09-01';
export const SEMESTER_END = '2026-12-31';
/** 열람 가능한 달 */
export const MONTHS = ['2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];

/** 일정 추가 폼 선택지 */
export const ALARM_OPTIONS = ['없음', '정시', '10분 전', '30분 전', '1시간 전', '하루 전'];
export const REPEAT_OPTIONS = ['반복 안 함', '매일', '매주', '매월'];
export const TIME_OPTIONS = Array.from({ length: 31 }, (_, i) => {
  const m = 8 * 60 + i * 30; // 08:00 ~ 23:00
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
});

/** 받침에 따라 조사 고르기: josa('UX 라이팅', '을', '를') → '을' */
export function josa(word: string, withFinal: string, withoutFinal: string) {
  const ch = word.trim().slice(-1);
  const code = ch.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return `${withFinal}(${withoutFinal})`;
  return code % 28 ? withFinal : withoutFinal;
}
