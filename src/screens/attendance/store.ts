import { create } from 'zustand';

/* ────────────────────────────────────────────────────────────
 * 출석 섹션 로컬 상태 (전역 useApp에 없는 것만)
 *   appeals   : 출석 이의 신청 (과목:주차:날짜 → 사유)
 *   accessLog : 학생증 NFC 태그로 추가된 오늘 출입 기록
 * 새로고침하면 초기화 (전시용 의도)
 * ──────────────────────────────────────────────────────────── */
export type AccessLog = { id: number; place: string; time: string; kind: '입장' | '태그' };

type AttendanceLocal = {
  appeals: Record<string, string>;
  accessLog: AccessLog[];
  addAppeal: (key: string, reason: string) => void;
  addAccess: (log: Omit<AccessLog, 'id'>) => void;
};

export const BASE_ACCESS_LOG: AccessLog[] = [
  { id: 2, place: '디자인관 정문', time: '09:31', kind: '입장' },
  { id: 1, place: '중앙도서관', time: '08:52', kind: '입장' },
];

export const useAttendanceLocal = create<AttendanceLocal>((set) => ({
  appeals: {},
  accessLog: BASE_ACCESS_LOG,
  addAppeal: (key, reason) => set((st) => ({ appeals: { ...st.appeals, [key]: reason } })),
  addAccess: (log) => set((st) => ({ accessLog: [{ ...log, id: st.accessLog.length + 1 }, ...st.accessLog] })),
}));

export const appealKey = (courseId: string, date: string) => `${courseId}:${date}`;
