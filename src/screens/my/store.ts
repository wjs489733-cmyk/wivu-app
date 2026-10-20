import { create } from 'zustand';
import { INITIAL_TOGGLES, NOTI_TYPES, type NotiKey, type QuietKey } from './data';

/* ────────────────────────────────────────────────────────────
 * 마이·설정 섹션 로컬 상태 — 알림 토글 · 마지막 동기화 시각
 * (전역 useApp에 없는 값만. 로그아웃·연동 해제 시 resetMy로 같이 초기화)
 * ──────────────────────────────────────────────────────────── */
type Toggles = Record<NotiKey | QuietKey, boolean>;

type MyState = {
  toggles: Toggles;
  /** 마지막 동기화 시각 (Figma: 오늘 09:30) */
  lastSync: string;
  setToggle: (id: NotiKey | QuietKey, on: boolean) => void;
  setLastSync: (t: string) => void;
  resetMy: () => void;
};

export const useMy = create<MyState>((set) => ({
  toggles: INITIAL_TOGGLES,
  lastSync: '09:30',
  setToggle: (id, on) => set((st) => ({ toggles: { ...st.toggles, [id]: on } })),
  setLastSync: (t) => set({ lastSync: t }),
  resetMy: () => set({ toggles: INITIAL_TOGGLES, lastSync: '09:30' }),
}));

/** 켜진 알림 수 (방해 금지 제외) — 마이 '3개 켜짐' · 알림 설정 '지금 3개 켜짐' */
export const useNotiOnCount = () => useMy((st) => NOTI_TYPES.filter((o) => st.toggles[o.id]).length);
