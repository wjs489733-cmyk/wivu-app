import type { ScreenDef } from '@/app/registry';
import { P } from '@/app/paths';
import { HomeScreen } from './HomeScreen';

export const screens: ScreenDef[] = [
  { path: P.home, element: <HomeScreen />, title: '홈', figma: ['308:11640', '308:11881', '308:11745'], section: '홈' },
  { path: P.homeFreeDay, element: <HomeScreen variant="free-day" />, title: '홈 · 공강 (목 9/10)', figma: ['433:9519'], section: '홈' },
];
