import { DOW_KO, LOAD_NOW, SCENARIO_NOW, dayStart, fmtLongDay, fmtMD, shiftDate, shiftDeep } from './clock';

/* ────────────────────────────────────────────────────────────
 * 데이터 기준 (모든 화면 공통) — progress 문서 '데이터 기준'과 동일하게 유지
 * 시나리오: 2026-10-09(금) 9:41 = 학기 6주차 · 가상 인물·가상 캠퍼스 배치
 * (9/1(화) 개강 · 4주차 추석 연휴로 금요일 휴강 · 8주차 10/19–10/23 중간고사)
 * 실제 학교 규정·수치처럼 보이는 가상 정보는 피한다.
 *
 * 11-06 실시간 전환 (data/clock.ts): 시나리오 주를 실제 이번 주로 옮겨 붙임(요일 유지) + 시각은 실제 시각.
 *   · NOW / TODAY_* = 실제 '오늘'(앱을 연 순간). 매 분 바뀌는 상태는 컴포넌트에서 useNow() 사용
 *   · 데이터 속 날짜 글자·Date는 shiftDeep / sd() 로 옮겨서 쓴다
 *   · ?now=2026-10-09T09:41 이면 옮김 0주 · 9:41 고정 = 원래 Figma 그대로
 * ──────────────────────────────────────────────────────────── */

/** 앱을 연 순간의 '지금' (실시간 또는 고정 시각) — 날짜 단위 계산용. 분 단위는 useNow() */
export const NOW = LOAD_NOW;
/** 이번 주로 옮긴 시나리오 '오늘' = 이번 주 금요일 9:41 (Figma 홈·출석 프레임이 그린 날) */
export const SCENARIO_DAY = shiftDate(SCENARIO_NOW);
/** 이번 주로 옮긴 시나리오 공강일 = 이번 주 목요일 (Figma '홈 · 공강 (목 10/8)') */
export const SCENARIO_FREE_DAY = new Date(SCENARIO_DAY.getFullYear(), SCENARIO_DAY.getMonth(), SCENARIO_DAY.getDate() - 1, 9, 41);
export const TODAY_LABEL = fmtLongDay(NOW);
/** 오늘 'MM.DD' — 출석·과제 등 날짜 문자열 비교용 (실제 오늘) */
export const TODAY_MD = fmtMD(NOW);
export const TODAY_DOW = DOW_KO[NOW.getDay()];
export const SEMESTER = '2026-2학기';
/** 학기 주차 (개강 주 = 1주차) — 시나리오 주를 이번 주로 옮겼으므로 이번 주 = 6주차 (주말도 같은 주) */
export const SEMESTER_WEEK = 6;
/** 월 기준 주차 (1일이 들어 있는 주 = 1주차, 월요일 시작) — 시간표 헤더 '10월 2주차' */
export const WEEK_LABEL = (() => {
  const d = dayStart(NOW);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const firstMon = new Date(first);
  firstMon.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  return `${d.getMonth() + 1}월 ${Math.floor((d.getTime() - firstMon.getTime()) / (7 * 86400000)) + 1}주차`;
})();

export const USER = {
  name: '김유진',
  initial: '유',
  department: '시각디자인과',
  year: 4,
  studentId: '20231234',
  campus: '효성캠퍼스',
  school: '대구가톨릭대학교',
  email: 'yujin.kim@cu.example.ac.kr',
} as const;

export type Weekday = '월' | '화' | '수' | '목' | '금';
export type CourseId = 'service-design' | 'brand-design' | 'ux-research' | 'design-management' | 'motion-graphics' | 'writing';

export type Course = {
  id: CourseId;
  name: string;
  professor: string;
  /** 요일별 시간 (사이버 강의는 빈 배열) */
  slots: { day: Weekday; start: string; end: string }[];
  room: string;
  building: string;
  credits: number;
  kind: '전공' | '교양';
  /** 시간표 블록 색 */
  color: 'brand' | 'ink' | 'pulse' | 'subtle';
  online?: boolean;
};

export const COURSES: Course[] = [
  { id: 'service-design', name: '서비스디자인', professor: '김OO', slots: [{ day: '금', start: '10:00', end: '11:50' }], room: '디자인관 302호', building: '디자인관', credits: 3, kind: '전공', color: 'brand' },
  { id: 'brand-design', name: '브랜드디자인', professor: '이OO', slots: [{ day: '금', start: '13:00', end: '14:50' }], room: '디자인관 401호', building: '디자인관', credits: 3, kind: '전공', color: 'brand' },
  { id: 'ux-research', name: 'UX 리서치', professor: '박OO', slots: [{ day: '금', start: '15:00', end: '16:50' }], room: '정보관 210호', building: '정보관', credits: 3, kind: '전공', color: 'pulse' },
  { id: 'design-management', name: '디자인경영', professor: '정OO', slots: [{ day: '월', start: '10:30', end: '11:45' }, { day: '수', start: '10:30', end: '11:45' }], room: '인문관 305호', building: '인문관', credits: 3, kind: '전공', color: 'subtle' },
  { id: 'motion-graphics', name: '모션그래픽스', professor: '최OO', slots: [{ day: '화', start: '14:00', end: '16:50' }], room: '디자인관 B103', building: '디자인관', credits: 3, kind: '전공', color: 'subtle' },
  { id: 'writing', name: '글쓰기와 소통', professor: '한OO', slots: [], room: '사이버 강의', building: '온라인', credits: 2, kind: '교양', color: 'subtle', online: true },
];
export const TOTAL_CREDITS = COURSES.reduce((a, c) => a + c.credits, 0); // 17

export const courseById = (id: string) => COURSES.find((c) => c.id === id) ?? COURSES[0];
export const slotLabel = (c: Course) => (c.online ? '사이버 강의' : c.slots.map((s) => `${s.day} ${s.start}–${s.end}`).join(', '));

/** 시나리오 '오늘'(금) 수업 순서 — Figma 홈·수강과목 프레임용. 실제 오늘 수업은 data/today.ts classesOn() */
export const SCENARIO_CLASSES: CourseId[] = ['service-design', 'brand-design', 'ux-research'];

export const ASSIGNMENTS = shiftDeep([
  { id: 'a1', courseId: 'service-design' as CourseId, title: '서비스 분석 리포트', due: '오늘 23:59', dueFull: '10월 9일(금) 23:59', format: 'PDF', status: '미제출' as '미제출' | '제출 완료', dday: 'D-DAY' },
]);

export const ACADEMIC_SCHEDULE = shiftDeep([
  { id: 's1', title: '중간고사 기간', date: '10.19(월) – 10.23(금)', tag: '학사' },
  { id: 's2', title: '2026 하반기 취업박람회', date: '10.12(월) 14:00', tag: '행사' },
]);

export const PIN_DEMO = '1234'; // 데모: 아무 4자리나 통과, 오류 플로우는 ?error=1 또는 '0000'

