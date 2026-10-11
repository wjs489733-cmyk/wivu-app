import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 393, height: 852 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && errs.push(m.text()));
await p.goto('http://localhost:5173/?frame=1#/home'); await p.waitForTimeout(1000);
// 프레임 모드 1920x1080
const d = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await d.goto('http://localhost:5173/#/home'); await d.waitForTimeout(1200);
await d.screenshot({ path: 'shots/desk-home.png' });
// 스크롤 전체 캡처: 스크롤 컨테이너 높이 늘려 찍기
await p.goto('http://localhost:5173/?frame=0#/home'); await p.waitForTimeout(1000);
const h = await p.evaluate(() => { const el = [...document.querySelectorAll('div')].find(d => getComputedStyle(d).overflowY === 'auto'); return el ? el.scrollHeight : 0; });
await p.setViewportSize({ width: 393, height: h + 120 }); await p.waitForTimeout(500);
await p.screenshot({ path: 'shots/home-full.png' });
console.log('scrollH', h, errs.join(' | '));
await b.close();
