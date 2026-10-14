// WivU Icons v2 (design/icons) + 로고 (design/logos) → src/icons/icons.generated.ts
// 아이콘 규격 (WivU Icons v2, 2026-10-14): 24×24 · 선 1.7 · 둥근 끝/꺾임 · 채움 없음 · 안전 영역 2px
//   사용 크기 16/20/24 — viewBox 24 기준이라 선 두께가 크기에 비례해 줄어듦 (24→1.7, 20→1.42, 16→1.13)
//   색은 stroke="currentColor" → CSS color(아이콘 color prop)로 제어
// 원본 갱신 방법: 새 세트의 web/*.svg와 manifest.json을 design/icons에 덮어쓰고 npm run icons
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const iconDir = resolve(root, 'design/icons');
const logoDir = resolve(root, 'design/logos');

/** 세트에 아직 없는 아이콘 — 같은 규격으로 코드에서 보충 (세트에 추가되면 여기서 빼기) */
const SUPPLEMENT = [
  { name: 'user', label: '사람(1명)', category: '보충', status: '보충', file: 'supplement/user.svg', note: 'users(팀·모집)의 첫 번째 사람을 가운데로 — 작성자·담당 교수' },
];

const svgParts = (svg) => {
  const open = svg.match(/<svg[^>]*>/)[0];
  const attr = (n) => open.match(new RegExp(`\\s${n}="([^"]+)"`))?.[1];
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s*\n\s*/g, '').trim();
  return { open, attr, inner };
};

const manifest = JSON.parse(readFileSync(resolve(iconDir, 'manifest.json'), 'utf8'));
const entries = [...manifest.icons.map((i) => ({ ...i, file: i.web })), ...SUPPLEMENT];

const icons = {};
const problems = [];
for (const it of entries) {
  const path = resolve(iconDir, it.file);
  if (!existsSync(path)) {
    problems.push(`없음: ${it.file}`);
    continue;
  }
  const { attr, inner } = svgParts(readFileSync(path, 'utf8'));
  // 루트 <svg>의 선 속성을 <g>로 옮긴다 (Icon 컴포넌트가 자체 <svg>로 감싸므로)
  const stroke = attr('stroke') ?? 'currentColor';
  const g = [
    `stroke="${/^#/.test(stroke) ? 'currentColor' : stroke}"`,
    `stroke-width="${attr('stroke-width') ?? manifest.strokeWidth}"`,
    `stroke-linecap="${attr('stroke-linecap') ?? 'round'}"`,
    `stroke-linejoin="${attr('stroke-linejoin') ?? 'round'}"`,
  ].join(' ');
  const body = `<g ${g}>${inner.replace(/(fill|stroke)="#[0-9A-Fa-f]{3,8}"/g, '$1="currentColor"')}</g>`;
  icons[it.name] = { viewBox: attr('viewBox') ?? '0 0 24 24', body, label: it.label, category: it.category, status: it.status };
}

const logos = {};
for (const f of readdirSync(logoDir).filter((f) => f.endsWith('.svg')).sort()) {
  const { attr, inner } = svgParts(readFileSync(resolve(logoDir, f), 'utf8'));
  logos[f.replace('.svg', '')] = { viewBox: attr('viewBox'), body: inner };
}

const ts = `// 자동 생성 — 수정 금지 (npm run icons). 원본: design/icons (WivU Icons v${manifest.version}) · design/logos
export const icons = ${JSON.stringify(icons, null, 2)} as const;
export type IconName = keyof typeof icons;
export const ICON_SET = ${JSON.stringify({ name: manifest.name, version: manifest.version, date: manifest.date, strokeWidth: manifest.strokeWidth })} as const;
export const logos = ${JSON.stringify(logos, null, 2)} as const;
export type LogoName = keyof typeof logos;
`;
mkdirSync(resolve(root, 'src/icons'), { recursive: true });
writeFileSync(resolve(root, 'src/icons/icons.generated.ts'), ts);
console.log(`icons: ${Object.keys(icons).length} (v${manifest.version} ${manifest.icons.length} + 보충 ${SUPPLEMENT.length}), logos: ${Object.keys(logos).length}`);
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
