import { P } from '@/app/paths';

/* 홈 화면 데이터 — Figma 308:11640 / 308:11881 / 433:9519 텍스트 그대로 */
export const WEEK = [
  { dow: '일', d: 6 },
  { dow: '월', d: 7 },
  { dow: '화', d: 8 },
  { dow: '수', d: 9 },
  { dow: '목', d: 10 },
  { dow: '금', d: 11 },
  { dow: '토', d: 12 },
];

export type FlowItem = { time: string; title: string; meta: string; action: string; to?: string; kind: 'class' | 'academic' | 'assignment' | 'team' };

export const FLOW_TODAY: FlowItem[] = [
  { time: '13:00', title: '브랜드디자인', meta: '디자인관 401호 · 다음 수업', action: '지도', to: P.campusMap, kind: 'class' },
  { time: '14:00', title: '교내 취업박람회', meta: '학생회관 · 학사 일정', action: '일정', to: P.calendar, kind: 'academic' },
  { time: '23:59', title: '서비스 분석 리포트', meta: '서비스디자인 · 미제출 과제', action: '제출', to: P.assignment(), kind: 'assignment' },
];

export const FLOW_FREE_DAY: FlowItem[] = [
  { time: '15:00', title: '팀플 회의', meta: '중앙도서관 그룹스터디룸 3', action: '지도', to: P.campusMap, kind: 'team' },
  { time: '14:00', title: '교내 취업박람회', meta: '학생회관 · 학사 일정', action: '일정', to: P.calendar, kind: 'academic' },
  { time: '23:59', title: '서비스 분석 리포트', meta: '서비스디자인 · 미제출 과제', action: '제출', to: P.assignment(), kind: 'assignment' },
];

export const MEALS = [
  { kind: '중식', time: '11:30 – 13:30 · 학생식당', menu: '돈까스 · 우동 · 단무지 · 깍두기', tone: 'brand' as const },
  { kind: '석식', time: '17:00 – 18:30 · 학생식당', menu: '김치볶음밥 · 미역국 · 계란후라이', tone: 'neutral' as const },
];

export const HOME_NOTICES = [
  { id: 'n1', tag: '학사', tone: 'brand' as const, title: '2학기 수강신청 정정 기간 안내', date: '09.10' },
  { id: 'n2', tag: '장학', tone: 'pulse' as const, title: '교내 근로장학생 추가 모집', date: '09.09' },
  { id: 'n3', tag: '행사', tone: 'neutral' as const, title: '2026 하반기 취업박람회 참가 신청', date: '09.05' },
];
