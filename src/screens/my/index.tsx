import type { ScreenDef } from '@/app/registry';
import { P } from '@/app/paths';
import { MyRoot } from './MyRoot';
import { QuickMenuEdit } from './QuickMenuEdit';
import { NotificationSettings } from './NotificationSettings';
import { SchoolLink } from './SchoolLink';

const S = '홈 › 마이·설정';

/* Figma v5 페이지 'UXUI 디자인 (v5 · 피드백 반영)' — 상태 프레임(확인창·변경됨·순서 탭)은 같은 라우트 안 상태 */
export const screens: ScreenDef[] = [
  { path: P.my, element: <MyRoot />, title: '마이', figma: ['681:5941', '701:8180'], section: S },
  { path: P.myQuickMenu, element: <QuickMenuEdit />, title: '메뉴 편집', figma: ['676:5007', '676:5106', '701:8791', '701:8889'], section: S },
  { path: P.myNotifications, element: <NotificationSettings />, title: '알림 설정', figma: ['701:8603'], section: S },
  { path: P.mySchool, element: <SchoolLink />, title: '학교 연동 관리', figma: ['701:8324', '701:8517'], section: S },
];
