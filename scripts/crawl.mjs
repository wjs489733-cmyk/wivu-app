// 모든 라우트를 열어 콘솔 에러를 검사하고 캡처한다 (shots/crawl/NN_<slug>.png)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const ROUTES = [
  // 01 진입 (v5) — 옛 경로(intro/2·3, school, setup)는 리디렉트 확인용
  '/splash', '/intro/1', '/intro/2', '/school', '/setup/notifications', '/login', '/login?school=1', '/login?error=1', '/login/linking',
  // 02 홈
  '/home', '/home?menu=1', '/home/free-day', '/home/edit',
  // 03 출석 인증 · 학생증
  '/attendance/pin', '/attendance/pin?error=1', '/attendance/pin?digits=2', '/attendance/done', '/student-id', '/student-id?tab=library', '/student-id?sheet=nfc',
  // 04 학식 · 알림 · 마이
  '/meal', '/notifications', '/my', '/my/school', '/my/notifications', '/my/quick-menu', '/my/quick-menu?tab=order',
  // 05 출석
  '/attendance', '/attendance/course/motion-graphics', '/attendance/course/motion-graphics?sheet=appeal', '/attendance/course/service-design', '/attendance/qr',
  // 06 수강과목
  '/courses', '/courses/service-design', '/courses/service-design?sheet=menu', '/courses/ux-research', '/courses/service-design/assignments/a1',
  '/courses/service-design/assignments/a1/submit', '/courses/service-design/assignments/a1/submit?dialog=leave', '/courses/service-design/assignments/a1/done',
  '/courses/service-design/notices/c1', '/courses/service-design/materials',
  // 07 시간표 · 08 캘린더
  '/timetable', '/timetable?sheet=service-design', '/timetable?edit=1', '/timetable/add', '/timetable/add?q=UX', '/timetable/calendar', '/calendar/events/e1', '/calendar/new',
  // 09 게시판
  '/board', '/board?sheet=apply', '/board?search=1', '/board/course/service-design', '/board/course/free', '/board/posts/p1', '/board/posts/p1?sheet=menu',
  '/board/posts/p2', '/board/posts/p2?sheet=report', '/board/write', '/board/write?sheet=board', '/board/write?sheet=assignment',
  // 10 지도 · 공지
  '/map', '/notices', '/notices/n1', '/notices/n3', '/design-system',
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
  await p.goto(`http://127.0.0.1:5173/?frame=0${q ? '&' + q : ''}#${path}${q ? '?' + q : ''}`);
  await p.waitForTimeout(r.startsWith('/splash') ? 400 : 900);
  const final = new URL(p.url()).hash.slice(1);
  const slug = String(++i).padStart(2, '0') + '_' + r.replace(/[/?=]/g, '-').replace(/^-/, '');
  await p.screenshot({ path: `shots/crawl/${slug}.png` });
  report.push(`${final.split('?')[0] === path ? 'OK ' : 'REDIRECT→' + final + ' '}${r}${errs.length ? '  ERR: ' + errs.join(' | ').slice(0, 300) : ''}`);
}
console.log(report.join('\n'));
await b.close();
