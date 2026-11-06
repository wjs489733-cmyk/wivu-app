import { create } from 'zustand';
import { dayStart, fmtHM, now } from '@/data/clock';
import { INITIAL_TOGGLES, NOTI_TYPES, type NotiKey, type QuietKey } from './data';

/* ────────────────────────────────────────────────────────────
 * 마이·설정 섹션 로컬 상태 — 알림 토글 · 마지막 동기화 시각
 * (전역 useApp에 없는 값만. 로그아웃·연동 해제 시 resetMy로 같이 초기화)
 * ──────────────────────────────────────────────────────────── */
type Toggles = Record<NotiKey | QuietKey, boolean>;

/** 처음 '마지막 동기화' = 지금보다 11분 전 (Figma: 9:41에 '오늘 09:30') — 자정을 넘기지 않게 0시에서 멈춤 */
const initialSync = () => {
  const n = now();
  return fmtHM(new Date(Math.max(dayStart(n).getTime(), n.getTime() - 11 * 60000)));
};

type MyState = {
  toggles: Toggles;
  /** 마지막 동기화 시각 'HH:MM' (오늘) — Figma: 오늘 09:30 (9:41 기준) */
  lastSync: string;
  setToggle: (id: NotiKey | QuietKey, on: boolean) => void;
  setLastSync: (t: string) => void;
  resetMy: () => void;
};

export const useMy = create<MyState>((set) => ({
  toggles: INITIAL_TOGGLES,
  lastSync: initialSync(),
  setToggle: (id, on) => set((st) => ({ toggles: { ...st.toggles, [id]: on } })),
  setLastSync: (t) => set({ lastSync: t }),
  resetMy: () => set({ toggles: INITIAL_TOGGLES, lastSync: initialSync() }),
}));

/** 켜진 알림 수 (방해 금지 제외) — 마이 '3개 켜짐' · 알림 설정 '지금 3개 켜짐' */
export const useNotiOnCount = () => useMy((st) => NOTI_TYPES.filter((o) => st.toggles[o.id]).length);
