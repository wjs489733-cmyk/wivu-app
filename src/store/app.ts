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
export type PinDigits = 2 | 4;

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
  /** 온보딩(초기 설정)까지 끝냈는지 — 뒤로 가기로 진입 화면에 돌아가지 않게 */
  onboarded: boolean;
  /** 사용자가 직접 로그아웃했는지 — true면 진입 화면 밖으로 못 나감 (새로고침하면 초기화) */
  loggedOut: boolean;
  /** 지금 출석 세션의 인증 번호 자릿수 — 교수님이 정함(학교·수업마다 2 또는 4).
   *  실제 서비스에선 서버가 출석 세션과 함께 내려줌. 데모: 기본 4, 전시 패널 '출석 번호 2자리'(?digits=2)로 2 */
  pinDigits: PinDigits;

  setSchool: (name: string) => void;
  login: () => void;
  completeAttendance: (method: AttendMethod) => void;
  submitAssignment: (fileName: string) => void;
  setQuickMenu: (ids: string[]) => void;
  markRead: (id: string) => void;
  finishOnboarding: () => void;
  setPinDigits: (n: PinDigits) => void;
  /** 로그아웃: 상태 초기화 + 잠금 */
  logout: () => void;
  /** 스플래시 진입 시 초기화 (Figma: 스플래시 AFTER_TIMEOUT → 변수 리셋).
   *  로그아웃 잠금(loggedOut)은 유지 — 잠금은 다시 로그인(login)해야만 풀린다. */
  reset: () => void;
  /** 전시 패널 바로가기용: 상태 초기화 + 잠금 해제 */
  demoReset: () => void;
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
  onboarded: false,
  loggedOut: false,
  pinDigits: 4 as PinDigits,
};

export const useApp = create<AppState>((set) => ({
  ...INITIAL,
  setSchool: (name) => set({ selectedSchool: name }),
  login: () => set({ loggedIn: true, loggedOut: false }),
  finishOnboarding: () => set({ onboarded: true }),
  setPinDigits: (n) => set({ pinDigits: n }),
  logout: () => set({ ...INITIAL, loggedOut: true }),
  completeAttendance: (method) => set({ attendanceComplete: true, attendanceMethod: method, attendanceTime: '10:01' }),
  submitAssignment: (fileName) => set({ assignmentSubmitted: true, submittedFile: fileName }),
  setQuickMenu: (ids) => set({ quickMenu: ids }),
  markRead: (id) => set((st) => ({ readNotifications: st.readNotifications.includes(id) ? st.readNotifications : [...st.readNotifications, id] })),
  reset: () => set((st) => ({ ...INITIAL, loggedOut: st.loggedOut })),
  demoReset: () => set({ ...INITIAL }),
}));

/** 진입(온보딩·로그인) 라우트 */
export const isEntryPath = (pathname: string) => /^\/(splash|intro|school|login|setup)(\/|$)/.test(pathname);
/** 로그인 전 단계 라우트 — 로그아웃 잠금 중에 머물 수 있는 곳 (연동 중·초기 설정은 로그인 뒤 단계라 제외) */
export const isPreLoginPath = (pathname: string) => /^\/(splash|intro\/\d|school(\/search)?|login)$/.test(pathname);
