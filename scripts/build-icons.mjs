// design/figma/icons/*.svg (Figma 아이콘 컴포넌트) → src/icons/icons.generated.ts
// 규칙(10-12): 크기 그리드 16/20/24, 선 두께 = 크기/12 → viewBox 24 기준 stroke 2를 그대로 비례 축소
// 색은 전부 currentColor로 바꿔 CSS color로 제어. 레이디얼 1.6 stroke 아이콘은 규칙에 맞춰 2(round)로 보정.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, 'design/figma/icons');

const NAMES = {
  '기능/강의자료': 'materials', '기능/공지': 'notice', '기능/과제': 'assignment', '기능/도서관': 'library', '기능/시험': 'exam',
  '기타/사용자': 'user', '기타/시계': 'clock', '기타/위치': 'location', '기타/파일': 'file',
  '네비/홈': 'nav-home', '네비/출석': 'nav-attendance', '네비/수강과목': 'nav-courses', '네비/시간표': 'nav-timetable', '네비/캘린더': 'nav-calendar', '네비/게시판': 'nav-board',
  '레이디얼/NFC': 'nfc', '레이디얼/QR인증': 'qr', '레이디얼/강의실지도': 'map', '레이디얼/장소대여': 'rental', '레이디얼/학생증': 'student-id', '레이디얼/학식': 'meal',
  '레이디얼/과제': 'quick-assignment', '레이디얼/출석': 'quick-attendance', '레이디얼/캘린더': 'quick-calendar',
  '상태/결석': 'status-absent', '상태/지각': 'status-late', '상태/출석완료': 'status-present',
  '액션/다운로드': 'download', '액션/더보기': 'more', '액션/체크': 'check', '액션/추가': 'plus', '액션/편집': 'edit',
  '액션/화살표_아래': 'arrow-down', '액션/화살표_오른쪽': 'arrow-right', '액션/경고': 'warning', '액션/별점_채움': 'star-filled', '액션/별점_빈': 'star',
  '액션/좋아요': 'like', '액션/댓글': 'comment', '액션/스크랩': 'bookmark', '액션/셰브론_오른쪽': 'chevron-right',
  '헤더/뒤로': 'back', '헤더/닫기': 'close', '헤더/알림': 'bell', '헤더/메뉴': 'menu', '헤더/검색': 'search', '헤더/설정': 'settings',
};

const manifest = JSON.parse(readFileSync(resolve(dir, 'manifest.json'), 'utf8'));
const items = Array.isArray(manifest) ? manifest : manifest.icons;
const icons = {};
const logos = {};

for (const it of items) {
  const svg = readFileSync(resolve(dir, it.file), 'utf8');
  const viewBox = svg.match(/viewBox="([^"]+)"/)[1];
  let inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
  const key = NAMES[it.figmaName];
  if (key) {
    inner = inner.replace(/(fill|stroke)="#[0-9A-Fa-f]{3,8}"/g, '$1="currentColor"');
    if (/stroke-width="1\.6"/.test(inner)) {
      inner = inner
        .replace(/stroke-width="1\.6"/g, 'stroke-width="2"')
        .replace(/stroke-width="3\.2"/g, 'stroke-width="4"')
        .replace(/stroke-linecap="butt"/g, 'stroke-linecap="round"');
    }
    // 헤더/알림: Figma 아이콘에 '알림 점'이 그려져 있어 항상 안 읽음처럼 보임 → 점(세 번째 path)을 빼고 상태로 표시
    if (key === 'bell') inner = inner.split('\n').filter((l, i, arr) => !(l.includes('fill="currentColor"') && l.includes('<path') && i === arr.length - 1)).join('\n');
    icons[key] = { viewBox, body: inner.replace(/\s*\n\s*/g, ''), figma: it.figmaName };
  } else if (it.file.startsWith('logo') || it.file.startsWith('splash')) {
    logos[it.file.replace('.svg', '')] = { viewBox, body: inner.replace(/\s*\n\s*/g, '') };
  }
}

// 코드 파생 아이콘 (Figma 세트에 없음 — 같은 선 규칙: 24 viewBox, stroke 2, round)
const derived = { 'chevron-down': 'M6 9L12 15L18 9', 'chevron-left': 'M15 6L9 12L15 18', 'chevron-up': 'M6 15L12 9L18 15' };
for (const [k, d] of Object.entries(derived)) {
  icons[k] = { viewBox: '0 0 24 24', body: `<path d="${d}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`, figma: '코드 파생' };
}

const missing = Object.keys(NAMES).filter((n) => !items.some((i) => i.figmaName === n));
const ts = `// 자동 생성 — 수정 금지 (npm run icons). 원본: design/figma/icons (Figma 아이콘 컴포넌트)
export const icons = ${JSON.stringify(icons, null, 2)} as const;
export type IconName = keyof typeof icons;
export const logos = ${JSON.stringify(logos, null, 2)} as const;
export type LogoName = keyof typeof logos;
`;
mkdirSync(resolve(root, 'src/icons'), { recursive: true });
writeFileSync(resolve(root, 'src/icons/icons.generated.ts'), ts);
console.log(`icons: ${Object.keys(icons).length}, logos: ${Object.keys(logos).length}${missing.length ? `, missing: ${missing.join(', ')}` : ''}`);
