// 화면 레지스트리 → docs/screen-map.md (라우트 ↔ Figma 프레임 대응표). 개발 서버가 떠 있어야 함.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage();
await p.goto('http://localhost:5173/#/design-system');
await p.waitForTimeout(800);
const list = await p.evaluate(() => window.__WIVU_SCREENS__);
await b.close();
const bySection = {};
for (const s of list) (bySection[s.section] ??= []).push(s);
const frames = new Set(list.flatMap((s) => s.figma));
let md = `# 화면 맵 — 코드 라우트 ↔ Figma 프레임\n\n자동 생성: \`node scripts/screen-map.mjs\` · 라우트 ${list.length}개 · Figma 프레임 ${frames.size}개 대응\n(Figma 파일 \`WivU_Prototyping_v3-codex\` · 페이지 \`UXUI 디자인 (프로토타입_v4)\`)\n\n`;
for (const [sec, items] of Object.entries(bySection)) {
  md += `## ${sec}\n\n| 화면 | 라우트 (#/…) | Figma |\n|---|---|---|\n`;
  for (const s of items) md += `| ${s.title} | \`${s.path}\` | ${s.figma.map((f) => `\`${f}\``).join(' ')} |\n`;
  md += '\n';
}
md += `## 대응하지 않는 프레임\n\n- \`352:10034\` 홈_출석 2 — Figma 프로토타입용 복제 프레임 (코드에선 전역 상태로 대체)\n- \`433:9758\` IA 플로우맵 1920×1080 — 전시 패널용 (앱 화면 아님)\n`;
writeFileSync('docs/screen-map.md', md);
console.log(`routes ${list.length}, frames ${frames.size}`);
