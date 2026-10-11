import type { ScreenDef } from '@/app/registry';
import { P } from '@/app/paths';
import { MyRoot } from './MyRoot';
import { QuickMenuEdit } from './QuickMenuEdit';
import { NotificationSettings } from './NotificationSettings';
import { SchoolLink } from './SchoolLink';

const S = '홈 › 마이·설정';

export const screens: ScreenDef[] = [
  { path: P.my, element: <MyRoot />, title: '마이', figma: ['424:8665'], section: S },
  { path: P.myQuickMenu, element: <QuickMenuEdit />, title: '퀵메뉴 편집', figma: ['425:8741'], section: S },
  { path: P.myNotifications, element: <NotificationSettings />, title: '알림 설정', figma: ['426:8846'], section: S },
  { path: P.mySchool, element: <SchoolLink />, title: '학교 연동 관리', figma: ['426:8952'], section: S },
];
