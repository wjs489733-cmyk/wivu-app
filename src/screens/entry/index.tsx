import type { ScreenDef } from '@/app/registry';
import { P } from '@/app/paths';
import { Splash } from './Splash';
import { Intro } from './Intro';
import { SchoolSearch, SchoolSelect } from './School';
import { Login } from './Login';
import { Linking } from './Linking';
import { SetupNotifications, SetupQuickMenu } from './Setup';

const S1 = '① 진입 · 스플래시 – 소개';
const S2 = '② 진입 · 학교 선택 – 로그인';
const S3 = '③ 진입 · 초기 설정';

export const screens: ScreenDef[] = [
  { path: P.splash, element: <Splash />, title: '스플래시', figma: ['553:3075'], section: S1 },
  { path: P.intro(1), element: <Intro step={1} />, title: '소개 1 · 하나로 모으다', figma: ['553:3086'], section: S1 },
  { path: P.intro(2), element: <Intro step={2} />, title: '소개 2 · 제때 알려주다', figma: ['553:3142'], section: S1 },
  { path: P.intro(3), element: <Intro step={3} />, title: '소개 3 · 나에게 맞추다', figma: ['553:3177'], section: S1 },
  { path: P.school, element: <SchoolSelect />, title: '학교 선택', figma: ['352:1158', '416:12064'], section: S2 },
  { path: P.schoolSearch, element: <SchoolSearch />, title: '학교 검색', figma: ['416:8372'], section: S2 },
  { path: P.login, element: <Login />, title: '로그인', figma: ['366:9848', '411:8210', '411:8258'], section: S2 },
  { path: P.linking, element: <Linking />, title: '학교 정보 연동 중', figma: ['411:11957'], section: S2 },
  { path: P.setupNotifications, element: <SetupNotifications />, title: '초기 설정 · 알림', figma: ['411:12022', '411:12110'], section: S3 },
  { path: P.setupQuickMenu, element: <SetupQuickMenu />, title: '초기 설정 · 퀵메뉴', figma: ['411:12208'], section: S3 },
];
