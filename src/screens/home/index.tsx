import type { ScreenDef } from '@/app/registry';
import { P } from '@/app/paths';
import { HomeScreen } from './HomeScreen';
import { HomeEdit } from './HomeEdit';

/* Figma v5 '02 홈 (v5)' — 출석 전·완료는 같은 라우트의 상태(attendanceComplete), 퀵메뉴는 오버레이(홈 탭 길게 · ?menu=1) */
export const screens: ScreenDef[] = [
  { path: P.home, element: <HomeScreen />, title: '홈', figma: ['674:4748', '675:4839', '675:5022'], section: '홈' },
  { path: P.homeFreeDay, element: <HomeScreen variant="free-day" />, title: '홈 · 공강 (목 10/8)', figma: ['692:6804'], section: '홈' },
  { path: P.homeEdit, element: <HomeEdit />, title: '홈 편집 · 블록', figma: ['676:5225'], section: '홈' },
];
