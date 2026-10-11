import { lazy, Suspense } from 'react';
import { HashRouter, useLocation } from 'react-router';
import { AnimatedRoutes } from '@/nav/nav';
import { DeviceFrame } from '@/app/DeviceFrame';
import { ROUTES } from '@/app/registry';
import { P } from '@/app/paths';

const DesignSystemPage = lazy(() => import('@/design-system/DesignSystemPage'));

function Shell() {
  const { pathname } = useLocation();
  if (pathname.startsWith(P.designSystem)) {
    return (
      <Suspense fallback={null}>
        <DesignSystemPage />
      </Suspense>
    );
  }
  return (
    <DeviceFrame>
      <AnimatedRoutes routes={ROUTES} />
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
