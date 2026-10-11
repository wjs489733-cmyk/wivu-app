import type { IconName } from '@/ui';
import { COURSES, TOTAL_CREDITS } from '@/data/core';

/* 마이·설정 데이터 — Figma 424:8665 · 426:8846 · 426:8952 텍스트 그대로 */

export type NotiKey = 'attendance' | 'assignment' | 'notice' | 'board';
export type QuietKey = 'quiet' | 'classMute';

/** 알림 종류 (426:8846) — 기본값도 Figma 그대로 (게시판 활동만 꺼짐) */
export const NOTI_TYPES: { id: NotiKey; icon: IconName; title: string; meta: string; on: boolean }[] = [
  { id: 'attendance', icon: 'nav-attendance', title: '출석 시작 알림', meta: '수업 시작 10분 전 · 인증 마감 3분 전', on: true },
  { id: 'assignment', icon: 'assignment', title: '과제 마감 알림', meta: '마감 하루 전 · 3시간 전', on: true },
  { id: 'notice', icon: 'notice', title: '학사·장학 공지', meta: '수강정정, 장학, 학사 일정', on: true },
  { id: 'board', icon: 'user', title: '게시판 활동', meta: '댓글 · 좋아요', on: false },
];

export const QUIET_OPTIONS: { id: QuietKey; title: string; meta: string; on: boolean }[] = [
  { id: 'quiet', title: '방해 금지 시간', meta: '23:00 – 07:00', on: true },
  { id: 'classMute', title: '수업 중 소리 끄기', meta: '수업 시간표 기준 자동', on: true },
];

/** 미리보기 배너 — 켜진 알림 종류에 맞춰 바뀜 (초기 설정 411:12022와 같은 문구) */
export const NOTI_PREVIEW: Record<NotiKey, { title: string; meta: string; time: string }> = {
  attendance: { title: '출석 인증 10분 전이에요', meta: '서비스디자인 · 디자인관 302호 · 10:10까지', time: '09:50' },
  assignment: { title: '과제 마감 3시간 전', meta: '서비스 분석 리포트 · 오늘 23:59', time: '20:59' },
  notice: { title: '학사 공지가 올라왔어요', meta: '2학기 수강신청 정정 기간 안내', time: '09.10' },
  board: { title: '내 글에 댓글이 달렸어요', meta: '서비스디자인 게시판 · 방금', time: '지금' },
};

/** 학교 연동으로 불러온 데이터 (426:8952) */
export const SYNC_ITEMS: { id: string; icon: IconName; title: string; value: string }[] = [
  { id: 'courses', icon: 'nav-courses', title: '수강 과목', value: `${COURSES.length}과목 · ${TOTAL_CREDITS}학점` },
  { id: 'timetable', icon: 'nav-timetable', title: '시간표', value: `주 ${COURSES.reduce((a, c) => a + c.slots.length, 0)}개 수업` },
  { id: 'assignments', icon: 'assignment', title: '과제', value: '진행 중 4건' },
  { id: 'notices', icon: 'notice', title: '공지', value: '새 글 7건' },
  { id: 'attendance', icon: 'nav-attendance', title: '출석 기록', value: '8회차' },
];

export const APP_VERSION = '1.0.0';

/** 받침 유무로 조사 고르기 — josa('대구가톨릭대학교', '와/과') → '대구가톨릭대학교와' */
export function josa(word: string, pair: '와/과' | '을/를' | '이/가' | '은/는') {
  const last = word.charCodeAt(word.length - 1);
  const hasBatchim = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  const [noBatchim, batchim] = pair === '와/과' ? ['와', '과'] : pair === '을/를' ? ['를', '을'] : pair === '이/가' ? ['가', '이'] : ['는', '은'];
  return `${word}${hasBatchim ? batchim : noBatchim}`;
}
