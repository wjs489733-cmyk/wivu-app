/* ────────────────────────────────────────────────────────────
 * 데이터 기준 (모든 화면 공통) — progress 문서 '데이터 기준'과 동일하게 유지
 * 기준 시각: 2026-10-09(금) 9:41 = 학기 6주차 · 가상 인물·가상 캠퍼스 배치
 * (9/1(화) 개강 · 4주차 추석 연휴로 금요일 휴강 · 10/5(월) 대체공휴일 휴강 · 8주차 10/19–10/23 중간고사)
 * 실제 학교 규정·수치처럼 보이는 가상 정보는 피한다.
 * ──────────────────────────────────────────────────────────── */

export const NOW = new Date(2026, 9, 9, 9, 41); // 월은 0부터 → 9 = 10월
export const TODAY_LABEL = '10월 9일 금요일';
/** 오늘 'MM.DD' — 출석·과제 등 날짜 문자열 비교용 */
export const TODAY_MD = '10.09';
export const SEMESTER = '2026-2학기';
/** 학기 주차 (개강 주 = 1주차) */
export const SEMESTER_WEEK = 6;
/** 월 기준 주차 (1일이 들어 있는 주 = 1주차) — 시간표 헤더 */
export const WEEK_LABEL = '10월 2주차';

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
  { id: 'motion-graphics', name: '모션그래픽스', professor: '최OO', slots: [{ day: '화', start: '14:00', end: '16:50' }], room: '디자인관 B103호', building: '디자인관', credits: 3, kind: '전공', color: 'subtle' },
  { id: 'writing', name: '글쓰기와 소통', professor: '한OO', slots: [], room: '사이버 강의', building: '온라인', credits: 2, kind: '교양', color: 'subtle', online: true },
];
export const TOTAL_CREDITS = COURSES.reduce((a, c) => a + c.credits, 0); // 17

export const courseById = (id: string) => COURSES.find((c) => c.id === id) ?? COURSES[0];
export const slotLabel = (c: Course) => (c.online ? '사이버 강의' : c.slots.map((s) => `${s.day} ${s.start}–${s.end}`).join(', '));

/** 오늘(금) 수업 순서 */
export const TODAY_CLASSES: CourseId[] = ['service-design', 'brand-design', 'ux-research'];
/** 출석 인증 가능 시간: 수업 시작 ~ 10분 */
export const ATTENDANCE_WINDOW = { courseId: 'service-design' as CourseId, opens: '10:00', closes: '10:10', minutesToStart: 19 };

export const ASSIGNMENTS = [
  { id: 'a1', courseId: 'service-design' as CourseId, title: '서비스 분석 리포트', due: '오늘 23:59', dueFull: '10월 9일(금) 23:59', format: 'PDF', status: '미제출' as '미제출' | '제출 완료', dday: 'D-DAY' },
];

export const ACADEMIC_SCHEDULE = [
  { id: 's1', title: '중간고사 기간', date: '10.19(월) – 10.23(금)', tag: '학사' },
  { id: 's2', title: '2026 하반기 취업박람회', date: '10.12(월) 14:00', tag: '행사' },
];

export const PIN_DEMO = '1234'; // 데모: 아무 4자리나 통과, 오류 플로우는 ?error=1 또는 '0000'
