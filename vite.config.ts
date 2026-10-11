import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { fileURLToPath, URL } from 'node:url'

// base './' → GitHub Pages 하위 경로·정적 호스팅·로컬 파일 어디서나 동작 (라우팅은 HashRouter)
// mode 'single' → JS·CSS·폰트를 HTML 한 장에 인라인 (링크 페이지 게시·오프라인 전시용)
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { host: true },
  build: mode === 'single' ? { outDir: 'dist-single', assetsInlineLimit: 100_000_000 } : { outDir: 'dist' },
}))
