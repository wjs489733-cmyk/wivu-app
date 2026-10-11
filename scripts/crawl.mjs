// 모든 라우트를 열어 콘솔 에러를 검사하고 캡처한다 (shots/crawl/NN_<slug>.png)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const ROUTES = [
  '/splash', '/intro/1', '/intro/2', '/intro/3', '/school', '/school?sheet=1', '/school/search', '/login', '/login?error=1', '/login/linking',
  '/setup/notifications', '/setup/quick-menu', '/home', '/home/free-day', '/attendance/pin', '/attendance/pin?error=1', '/attendance/done',
  '/attendance', '/attendance/course/service-design', '/attendance/course/motion-graphics', '/student-id', '/attendance/qr',
  '/courses', '/courses/service-design', '/courses/ux-research', '/courses/service-design/assignments/a1', '/courses/service-design/assignments/a1/submit',
  '/courses/service-design/assignments/a1/done', '/courses/service-design/notices/c1', '/courses/service-design/materials',
  '/timetable', '/timetable?sheet=service-design', '/timetable/add', '/timetable/calendar', '/calendar/events/e1', '/calendar/new',
  '/board', '/board/course/service-design', '/board/course/free', '/board/posts/p1', '/board/write',
  '/my', '/my/quick-menu', '/my/notifications', '/my/school', '/notifications', '/meal', '/notices/n1', '/notices/n3', '/map', '/design-system',
];
mkdirSync('shots/crawl', { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 393, height: 852 } });
let errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
const report = [];
let i = 0;
for (const r of ROUTES) {
  errs = [];
  const [path, q] = r.split('?');
  await p.goto(`http://localhost:5173/?frame=0${q ? '&' + q : ''}#${path}${q ? '?' + q : ''}`);
  await p.waitForTimeout(r.startsWith('/splash') ? 400 : 900);
  const final = new URL(p.url()).hash.slice(1);
  const slug = String(++i).padStart(2, '0') + '_' + r.replace(/[/?=]/g, '-').replace(/^-/, '');
  await p.screenshot({ path: `shots/crawl/${slug}.png` });
  report.push(`${final.split('?')[0] === path ? 'OK ' : 'REDIRECT→' + final + ' '}${r}${errs.length ? '  ERR: ' + errs.join(' | ').slice(0, 300) : ''}`);
}
console.log(report.join('\n'));
await b.close();
