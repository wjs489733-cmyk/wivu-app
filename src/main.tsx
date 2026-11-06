import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/global.css';
import App from './App';

/* 새 버전 배포 후 옛 화면이 남아 보이지 않게 (PWA 캐시):
 * 새 서비스워커가 페이지를 넘겨받는 순간 한 번 새로고침하고, 앱으로 돌아올 때마다 업데이트를 확인함.
 * 처음 설치(기존 서비스워커 없음)일 때는 새로고침하지 않음. */
if ('serviceWorker' in navigator) {
  const sw = navigator.serviceWorker;
  if (sw.controller) {
    let reloaded = false;
    sw.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') sw.getRegistration().then((r) => r?.update()).catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
