import { create } from 'zustand';

/* ────────────────────────────────────────────────────────────
 * 출석 섹션 로컬 상태 (전역 useApp에 없는 것만)
 *   appeals : 출석 이의 신청 (과목:날짜 → 사유)
 * v5에서 학생증 '오늘 출입 기록'이 빠져 출입 기록 상태는 없앴다 (NFC 태그는 토스트로만 알림)
 * 새로고침하면 초기화 (전시용 의도)
 * ──────────────────────────────────────────────────────────── */
type AttendanceLocal = {
  appeals: Record<string, string>;
  addAppeal: (key: string, reason: string) => void;
};

export const useAttendanceLocal = create<AttendanceLocal>((set) => ({
  appeals: {},
  addAppeal: (key, reason) => set((st) => ({ appeals: { ...st.appeals, [key]: reason } })),
}));

export const appealKey = (courseId: string, date: string) => `${courseId}:${date}`;
