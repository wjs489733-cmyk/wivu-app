import type { IconName } from '@/ui';
import { P } from '@/app/paths';

/* 퀵메뉴 카탈로그 — 홈 레디얼 메뉴 · 초기 설정(411:12208) · 퀵메뉴 편집(425:8741) 공통 */
export type QuickItem = { id: string; label: string; icon: IconName; path?: string; mode?: 'push' | 'modal' | 'tab'; note?: string };

export const QUICK_ITEMS: QuickItem[] = [
  { id: 'notice', label: '공지', icon: 'notice', path: P.academicNotice('n1'), mode: 'push' },
  { id: 'student-id', label: '학생증', icon: 'student-id', path: P.studentId, mode: 'modal' },
  { id: 'rental', label: '장소대여', icon: 'rental', note: '장소대여는 다음 버전에서 열려요' },
  { id: 'board', label: '게시판', icon: 'user', path: P.board, mode: 'tab' },
  { id: 'calendar', label: '캘린더', icon: 'quick-calendar', path: P.calendar, mode: 'tab' },
  { id: 'attendance', label: '출석', icon: 'quick-attendance', path: P.attendance, mode: 'tab' },
  { id: 'meal', label: '학식', icon: 'meal', path: P.meal, mode: 'push' },
  { id: 'assignment', label: '과제', icon: 'quick-assignment', path: P.assignment(), mode: 'push' },
  { id: 'qr', label: 'QR 인증', icon: 'qr', path: P.attendanceQr, mode: 'modal' },
  { id: 'map', label: '강의실 지도', icon: 'map', path: P.campusMap, mode: 'push' },
  { id: 'nfc', label: 'NFC 출석', icon: 'nfc', note: 'NFC 태그는 실제 기기에서만 동작해요' },
];

/** 레디얼 메뉴 기본 순서 (Figma 308:11745: 12시 방향부터 시계 방향) */
export const RADIAL_DEFAULT = ['notice', 'student-id', 'rental', 'board', 'calendar', 'attendance', 'meal', 'assignment'];

export const quickItem = (id: string) => QUICK_ITEMS.find((q) => q.id === id);
