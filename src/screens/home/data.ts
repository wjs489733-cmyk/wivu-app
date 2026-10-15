import { P } from '@/app/paths';
import { NOW } from '@/data/core';

/* 홈 화면 데이터 — Figma 308:11640 / 308:11881 / 433:9519 텍스트 그대로 */
const DOW = ['일', '월', '화', '수', '목', '금', '토'] as const;
/** 이번 주 일–토 (core NOW 기준: 10/4 – 10/10) */
export const WEEK = DOW.map((dow, i) => ({ dow, d: new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - NOW.getDay() + i).getDate() }));
/** 오늘(금 9) · 공강 변형(전날 목 8) — 주간 스트립 선택 날짜 */
export const TODAY_D = NOW.getDate();
export const FREE_DAY_D = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 1).getDate();
/** 홈 헤더 '2026년 10월' */
export const MONTH_LABEL = `${NOW.getFullYear()}년 ${NOW.getMonth() + 1}월`;

export type FlowItem = { time: string; title: string; meta: string; action: string; to?: string; kind: 'class' | 'academic' | 'assignment' | 'team' };

/** 오늘(금 10/9) — 오늘 할 일을 시간순으로, 다가오는 일정은 날짜로 표시해 뒤에 */
export const FLOW_TODAY: FlowItem[] = [
  { time: '13:00', title: '브랜드디자인', meta: '디자인관 401호 · 다음 수업', action: '지도', to: P.campusMap, kind: 'class' },
  { time: '23:59', title: '서비스 분석 리포트', meta: '서비스디자인 · 미제출 과제', action: '제출', to: P.assignment(), kind: 'assignment' },
  { time: '10.12', title: '2026 하반기 취업박람회', meta: '14:00 · 학생회관 대강당 · 학사 일정', action: '일정', to: P.calendarEvent('e1'), kind: 'academic' },
];

/** 공강(목 10/8) — 오늘 팀플 → 내일 마감 과제 → 다음 주 박람회 순 */
export const FLOW_FREE_DAY: FlowItem[] = [
  { time: '15:00', title: '팀플 회의', meta: '중앙도서관 그룹스터디룸 3', action: '지도', to: P.campusMap, kind: 'team' },
  { time: '10.9', title: '서비스 분석 리포트', meta: '내일 23:59 마감 · 서비스디자인', action: '제출', to: P.assignment(), kind: 'assignment' },
  { time: '10.12', title: '2026 하반기 취업박람회', meta: '14:00 · 학생회관 대강당 · 학사 일정', action: '일정', to: P.calendarEvent('e1'), kind: 'academic' },
];

export const MEALS = [
  { kind: '중식', time: '11:30 – 13:30 · 학생식당', menu: '돈까스 · 우동 · 단무지 · 깍두기', tone: 'brand' as const },
  { kind: '석식', time: '17:00 – 18:30 · 학생식당', menu: '김치볶음밥 · 미역국 · 계란후라이', tone: 'neutral' as const },
];

export const HOME_NOTICES = [
  { id: 'n1', tag: '학사', tone: 'brand' as const, title: '2학기 중간고사 시행 안내', date: '10.08' },
  { id: 'n2', tag: '장학', tone: 'pulse' as const, title: '교내 근로장학생 추가 모집', date: '10.07' },
  { id: 'n3', tag: '행사', tone: 'neutral' as const, title: '2026 하반기 취업박람회 참가 신청', date: '10.03' },
];
