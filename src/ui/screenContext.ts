import { createContext, useContext } from 'react';

/* 지금 화면(Screen) 제어 — 탭바의 '활성 탭 다시 누르기 = 맨 위로' 등 */
export type ScreenApi = { scrollToTop: () => void };
export const ScreenCtx = createContext<ScreenApi | null>(null);
export const useScreen = () => useContext(ScreenCtx);
