import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// base './' → GitHub Pages 하위 경로·정적 호스팅·로컬 파일 어디서나 동작 (라우팅은 HashRouter)
// mode 'single' → JS·CSS·폰트·이미지를 HTML 한 장에 인라인 (링크 페이지 게시·USB 오프라인 전시용, 서비스 워커 없음)
// 기본 빌드 → PWA (홈 화면에 추가 · 오프라인 캐시)
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    react(),
    ...(mode === 'single'
      ? [viteSingleFile()]
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
            manifest: {
              name: 'WivU — 대학생 통합 앱',
              short_name: 'WivU',
              description: '출석·과제·시간표·게시판을 한 흐름으로. 대학생 통합 앱 기술실증 프로토타입',
              lang: 'ko',
              start_url: './',
              scope: './',
              display: 'standalone',
              orientation: 'portrait',
              theme_color: '#FFFFFF',
              background_color: '#4C80F0',
              icons: [
                { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
                { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
            },
            workbox: { globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'] },
          }),
        ]),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { host: true },
  // 단일 번들(gzip 약 230KB) — 프로토타입 규모에선 분할보다 첫 진입 후 즉시 전환이 유리해 경고 한도만 조정
  build: mode === 'single' ? { outDir: 'dist-single', assetsInlineLimit: 100_000_000, chunkSizeWarningLimit: 2000 } : { outDir: 'dist', chunkSizeWarningLimit: 900 },
}))
