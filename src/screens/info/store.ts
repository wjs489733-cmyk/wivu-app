import { create } from 'zustand';
import { ACADEMIC_NOTICES } from './data';

/* 알림·정보 섹션 로컬 상태 — 공지별 '캘린더에 추가' 여부
 * (취업박람회 '참가 신청'은 시간표 스토어 useSchedule.applied가 단일 기준 — AcademicNotice에서 그쪽을 읽고 씀) */
type InfoState = {
  inCalendar: Record<string, boolean>;
  addToCalendar: (id: string) => void;
};

export const useInfo = create<InfoState>((set) => ({
  inCalendar: Object.fromEntries(ACADEMIC_NOTICES.map((n) => [n.id, !!n.inCalendar])),
  addToCalendar: (id) => set((st) => ({ inCalendar: { ...st.inCalendar, [id]: true } })),
}));
