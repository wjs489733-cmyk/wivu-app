import { create } from 'zustand';
import { ACADEMIC_NOTICES } from './data';

/* 알림·정보 섹션 로컬 상태 — 공지별 '캘린더에 추가' · '참가 신청' 여부 */
type InfoState = {
  inCalendar: Record<string, boolean>;
  applied: Record<string, boolean>;
  addToCalendar: (id: string) => void;
  apply: (id: string) => void;
};

export const useInfo = create<InfoState>((set) => ({
  inCalendar: Object.fromEntries(ACADEMIC_NOTICES.map((n) => [n.id, !!n.inCalendar])),
  applied: {},
  addToCalendar: (id) => set((st) => ({ inCalendar: { ...st.inCalendar, [id]: true } })),
  apply: (id) => set((st) => ({ applied: { ...st.applied, [id]: true } })),
}));
