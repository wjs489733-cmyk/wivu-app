import { useMemo } from 'react';
import { create } from 'zustand';
import { CATALOG, CORE_COURSES, SEED_EVENTS, TODAY, type CalEvent, type TTCourse } from './data';

/* ────────────────────────────────────────────────────────────
 * 시간표 · 캘린더 섹션 로컬 상태 (zustand)
 *   added      : 수업 추가 화면에서 넣은 카탈로그 과목 → 시간표 그리드·캘린더에 반영
 *   events     : 캘린더 일정 (시드 + 일정 추가 화면에서 만든 일정)
 *   alarms     : 일정별 알림 토글
 *   applied    : 사전 신청한 일정 (취업박람회)
 *   selectedDate / month : 캘린더 선택 상태 (상세 갔다 돌아와도 유지)
 * 새로고침하면 초기화 (전역 useApp과 같은 정책)
 * ──────────────────────────────────────────────────────────── */
type ScheduleState = {
  added: string[];
  lastAdded: string | null;
  events: CalEvent[];
  alarms: Record<string, boolean>;
  applied: string[];
  selectedDate: string;
  month: string;

  addCourse: (id: string) => void;
  removeCourse: (id: string) => void;
  clearLastAdded: () => void;
  saveEvent: (e: CalEvent) => void;
  removeEvent: (id: string) => void;
  setAlarm: (id: string, on: boolean) => void;
  apply: (id: string) => void;
  selectDate: (date: string) => void;
  setMonth: (month: string) => void;
};

export const useSchedule = create<ScheduleState>((set) => ({
  added: [],
  lastAdded: null,
  events: SEED_EVENTS,
  alarms: Object.fromEntries(SEED_EVENTS.map((e) => [e.id, !!e.alarm])),
  applied: [],
  selectedDate: TODAY,
  month: TODAY.slice(0, 7),

  addCourse: (id) => set((st) => (st.added.includes(id) ? st : { added: [...st.added, id], lastAdded: id })),
  removeCourse: (id) => set((st) => ({ added: st.added.filter((x) => x !== id), lastAdded: st.lastAdded === id ? null : st.lastAdded })),
  clearLastAdded: () => set({ lastAdded: null }),
  saveEvent: (e) =>
    set((st) => {
      const exists = st.events.some((x) => x.id === e.id);
      return {
        events: exists ? st.events.map((x) => (x.id === e.id ? e : x)) : [...st.events, e],
        alarms: { ...st.alarms, [e.id]: !!e.alarm && e.alarm !== '없음' },
        selectedDate: e.date,
        month: e.date.slice(0, 7),
      };
    }),
  removeEvent: (id) => set((st) => ({ events: st.events.filter((x) => x.id !== id) })),
  setAlarm: (id, on) => set((st) => ({ alarms: { ...st.alarms, [id]: on } })),
  apply: (id) => set((st) => ({ applied: st.applied.includes(id) ? st.applied : [...st.applied, id] })),
  selectDate: (date) => set({ selectedDate: date, month: date.slice(0, 7) }),
  setMonth: (month) => set({ month }),
}));

/** 시간표에 있는 모든 과목 (core 6과목 + 직접 추가) */
export function useMyCourses(): TTCourse[] {
  const added = useSchedule((st) => st.added);
  return useMemo(() => [...CORE_COURSES, ...added.map((id) => CATALOG.find((c) => c.id === id)).filter((c): c is TTCourse => !!c && !c.core)], [added]);
}
