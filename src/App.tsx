import { lazy, Suspense, useCallback } from 'react';
import { HashRouter, useLocation } from 'react-router';
import { AnimatedRoutes, type RouteGuard } from '@/nav/nav';
import { DeviceFrame } from '@/app/DeviceFrame';
import { ROUTES } from '@/app/registry';
import { P } from '@/app/paths';
import { isEntryPath, isPreLoginPath, useApp } from '@/store/app';

const DesignSystemPage = lazy(() => import('@/design-system/DesignSystemPage'));

/**
 * 라우트 가드
 *  · 로그아웃 잠금(loggedOut): 로그인 전 단계(스플래시·소개·학교 선택·로그인) 밖으로 못 나감 → 학교 선택
 *  · 온보딩 완료(onboarded) 뒤, 앱 화면에서 브라우저/OS 뒤로 가기로 진입 화면에 들어오면 → 홈
 *    (진입 흐름 안에서의 뒤로 가기 — 예: 학교 변경 중 로그인 → 학교 선택 — 는 그대로 둔다)
 */
function useRouteGuard(): RouteGuard {
  const loggedOut = useApp((st) => st.loggedOut);
  const onboarded = useApp((st) => st.onboarded);
  return useCallback<RouteGuard>(
    (to, from, navType) => {
      if (loggedOut && !isPreLoginPath(to.pathname)) return { to: P.school, t: 'fade' };
      if (onboarded && navType === 'POP' && isEntryPath(to.pathname) && from && !isEntryPath(from.pathname)) return { to: P.home, t: 'none' };
      return null;
    },
    [loggedOut, onboarded],
  );
}

function Shell() {
  const { pathname } = useLocation();
  const guard = useRouteGuard();
  if (pathname.startsWith(P.designSystem)) {
    return (
      <Suspense fallback={null}>
        <DesignSystemPage />
      </Suspense>
    );
  }
  return (
    <DeviceFrame>
      <AnimatedRoutes routes={ROUTES} guard={guard} />
    </DeviceFrame>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
