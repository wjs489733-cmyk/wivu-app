import { create } from 'zustand';
import { RADIAL_DEFAULT } from '@/data/quickMenu';

/* ────────────────────────────────────────────────────────────
 * 앱 전역 상태 — Figma 프로토타입 변수를 그대로 옮김
 *   attendanceComplete (Today v4 / Prototype state)
 *   assignmentSubmitted (Figma에선 미사용 → 코드에서 실제로 연결)
 *   selectedSchool (WivU / Entry prototype)
 * 백엔드 없음: 새로고침하면 초기화(전시용으로 의도된 동작)
 * ──────────────────────────────────────────────────────────── */
export type AttendMethod = 'PIN' | 'QR' | 'NFC';

type AppState = {
  selectedSchool: string;
  loggedIn: boolean;
  attendanceComplete: boolean;
  attendanceMethod: AttendMethod | null;
  attendanceTime: string | null;
  assignmentSubmitted: boolean;
  submittedFile: string | null;
  /** 홈 퀵메뉴 (레디얼·초기 설정·편집 공통) */
  quickMenu: string[];
  readNotifications: string[];

  setSchool: (name: string) => void;
  login: () => void;
  completeAttendance: (method: AttendMethod) => void;
  submitAssignment: (fileName: string) => void;
  setQuickMenu: (ids: string[]) => void;
  markRead: (id: string) => void;
  /** 스플래시 진입 시 초기화 (Figma: 스플래시 AFTER_TIMEOUT → 변수 리셋) */
  reset: () => void;
};

const INITIAL = {
  selectedSchool: '대구가톨릭대학교',
  loggedIn: false,
  attendanceComplete: false,
  attendanceMethod: null,
  attendanceTime: null,
  assignmentSubmitted: false,
  submittedFile: null,
  quickMenu: RADIAL_DEFAULT,
  readNotifications: [] as string[],
};

export const useApp = create<AppState>((set) => ({
  ...INITIAL,
  setSchool: (name) => set({ selectedSchool: name }),
  login: () => set({ loggedIn: true }),
  completeAttendance: (method) => set({ attendanceComplete: true, attendanceMethod: method, attendanceTime: '10:01' }),
  submitAssignment: (fileName) => set({ assignmentSubmitted: true, submittedFile: fileName }),
  setQuickMenu: (ids) => set({ quickMenu: ids }),
  markRead: (id) => set((st) => ({ readNotifications: st.readNotifications.includes(id) ? st.readNotifications : [...st.readNotifications, id] })),
  reset: () => set({ ...INITIAL }),
}));
