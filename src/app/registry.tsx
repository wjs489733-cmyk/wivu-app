import type { ReactNode } from 'react';
import { matchPath, Navigate, type RouteObject } from 'react-router';

/* ────────────────────────────────────────────────────────────
 * 화면 레지스트리 — 각 섹션(src/screens/<section>/index.tsx)이
 * `export const screens: ScreenDef[]`로 자기 화면을 등록한다.
 * figma: 대응하는 Figma 프레임 id (상태 프레임이 여러 장이면 전부)
 * ──────────────────────────────────────────────────────────── */
export type ScreenDef = {
  path: string;
  element: ReactNode;
  title: string;
  figma: string[];
  section: string;
};

const modules = import.meta.glob<{ screens: ScreenDef[] }>('../screens/*/index.tsx', { eager: true });

export const SCREENS: ScreenDef[] = Object.values(modules).flatMap((m) => m.screens ?? []);

/** 시작 화면 — 빌드 시 VITE_START로 바꿀 수 있음 (예: 디자인 시스템 검토용 빌드) */
export const START = (import.meta.env.VITE_START as string | undefined) || '/splash';
const has = (p: string) => SCREENS.some((sc) => sc.path === p);

export const ROUTES: RouteObject[] = [
  { path: '/', element: <Navigate to={has(START) || START.startsWith('/design-system') ? START : '/design-system'} replace /> },
  ...SCREENS.map((sc) => ({ path: sc.path, element: sc.element })),
  { path: '*', element: <Navigate to={has('/home') ? '/home' : '/design-system'} replace /> },
];

// 문서 생성용 (scripts/screen-map.mjs가 읽음) — 개발 서버에서만
if (import.meta.env.DEV) (window as unknown as { __WIVU_SCREENS__: unknown }).__WIVU_SCREENS__ = SCREENS.map(({ path, title, figma, section }) => ({ path, title, figma, section }));

export function findScreen(pathname: string) {
  return SCREENS.find((sc) => matchPath({ path: sc.path, end: true }, pathname));
}
