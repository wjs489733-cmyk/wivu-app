import type { ScreenDef } from '@/app/registry';
import { P } from '@/app/paths';
import { Splash } from './Splash';
import { Onboarding } from './Onboarding';
import { Login } from './Login';
import { Loading } from './Loading';
import { Redirect } from './parts';

/* 진입 — Figma v5 페이지 'UXUI 디자인 (v5 · 피드백 반영)' · 섹션 '01 진입 · 로그인 (v5)'
 * 흐름: 스플래시 → 온보딩 1장 → 로그인(학교 선택은 로그인 안의 검색 시트) → (오류) → 정보 불러오는 중 → 홈
 * v4 경로(소개 2·3, 학교 선택·검색, 초기 설정)는 링크가 깨지지 않게 v5 화면으로 대체(replace)한다. */
const S1 = '① 진입 · 스플래시 – 온보딩';
const S2 = '② 진입 · 로그인';
const S3 = '③ 진입 · 초기 설정 (v5에서 삭제)';
const SCHOOL_SHEET = `${P.login}?school=1`;

export const screens: ScreenDef[] = [
  { path: P.splash, element: <Splash />, title: '스플래시', figma: ['667:4454'], section: S1 },
  { path: P.intro(1), element: <Onboarding />, title: '온보딩', figma: ['667:4468'], section: S1 },
  { path: P.intro(2), element: <Redirect to={P.intro(1)} />, title: '소개 2 · 제때 알려주다 (리디렉트 → 온보딩)', figma: [], section: S1 },
  { path: P.intro(3), element: <Redirect to={P.intro(1)} />, title: '소개 3 · 나에게 맞추다 (리디렉트 → 온보딩)', figma: [], section: S1 },
  {
    path: P.login,
    element: <Login />,
    title: '로그인 (+ 대학교 검색 시트 · 오류)', // 시트 ?school=1 · 오류 ?error=1
    figma: ['667:4519', '667:4592', '669:4633', '669:4725'],
    section: S2,
  },
  { path: P.school, element: <Redirect to={SCHOOL_SHEET} />, title: '학교 선택 (리디렉트 → 로그인 · 대학교 검색 시트)', figma: [], section: S2 },
  { path: P.schoolSearch, element: <Redirect to={SCHOOL_SHEET} />, title: '학교 검색 (리디렉트 → 로그인 · 대학교 검색 시트)', figma: [], section: S2 },
  { path: P.linking, element: <Loading />, title: '정보 불러오는 중', figma: ['669:4806'], section: S2 },
  { path: P.setupNotifications, element: <Redirect to={P.home} />, title: '초기 설정 · 알림 (리디렉트 → 홈)', figma: [], section: S3 },
  { path: P.setupQuickMenu, element: <Redirect to={P.home} />, title: '초기 설정 · 퀵메뉴 (리디렉트 → 홈)', figma: [], section: S3 },
];
