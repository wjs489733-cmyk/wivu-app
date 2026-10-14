// 배색 시안 비교 캡처 — 토큰(CSS 변수)만 덮어써서 같은 화면을 시안별로 찍는다.
// 사용: (dev 서버 5173 실행 중) node scripts/palette-compare.cjs → shots/palette/*.png
const { chromium } = require('playwright');
const fs = require('fs');

const P = (o) => Object.entries(o).map(([k, v]) => `--wivu-color-primitive-${k}: ${v};`).join('');
const NEUTRAL_ICON = '[class*="notiIcon"]{background:var(--wivu-color-primitive-gray-100)!important}';
const PALETTES = {
  now: { name: '지금', css: '' },
  A: {
    name: 'A · 블루 + 차콜 (2색)',
    css: `:root{${P({
      'brand-100': '#EEF3FE', 'brand-200': '#DCE6FC',
      'ink-900': '#17191E', 'ink-950': '#262A31',
      'gray-50': '#F7F7F8', 'gray-100': '#F2F2F3', 'gray-200': '#EAEAEC', 'gray-300': '#E2E2E5', 'gray-350': '#D6D6DA',
      'gray-400': '#C4C4C9', 'gray-450': '#A0A0A7', 'gray-500': '#8E8E95', 'gray-600': '#5C5C63',
      'accent-lime-100': '#F2F2F3', 'accent-lime-500': '#E2E2E5', 'accent-lime-700': '#262A31',
      'error-500': '#E5484D', 'warning-500': '#B97A1E',
    })}}${NEUTRAL_ICON}`,
  },
  B: {
    name: 'B · 블루 + 앰버 (학식 그래프 확장)',
    css: `:root{${P({
      'brand-100': '#EDF2FE', 'brand-200': '#DAE5FD',
      'ink-900': '#1B1A17', 'ink-950': '#1D2433',
      'gray-50': '#F8F7F5', 'gray-100': '#F3F2EF', 'gray-200': '#EBE9E5', 'gray-300': '#E3E1DC', 'gray-350': '#D6D3CD',
      'gray-400': '#C5C1BA', 'gray-450': '#A29E96', 'gray-500': '#908B83', 'gray-600': '#5E5A53',
      'accent-lime-100': '#FFF3DE', 'accent-lime-500': '#F5B53D', 'accent-lime-700': '#B26B00',
      'error-500': '#E5484D', 'warning-500': '#E0952B',
    })}}${NEUTRAL_ICON}`,
  },
  C: {
    name: 'C · 잉크 + 라임 (라임은 어두운 면에만)',
    css: `:root{${P({
      'brand-100': '#EEF2FB', 'brand-200': '#DCE4F7',
      'ink-900': '#14161B', 'ink-950': '#14161B',
      'gray-50': '#F7F7F8', 'gray-100': '#F2F2F3', 'gray-200': '#EAEAEC', 'gray-300': '#E2E2E5', 'gray-350': '#D6D6DA',
      'gray-400': '#C4C4C9', 'gray-450': '#A0A0A7', 'gray-500': '#8E8E95', 'gray-600': '#5C5C63',
      'accent-lime-100': '#F2F2F3', 'accent-lime-500': '#C6F24E', 'accent-lime-700': '#4E7A10',
      'error-500': '#E5484D', 'warning-500': '#B97A1E',
    })}}${NEUTRAL_ICON}`,
  },
  D: {
    name: '추천 · 블루(진하게) + 차콜 + 앰버 포인트',
    css: `:root{${P({
      'brand-100': '#EDF2FE', 'brand-200': '#DAE4FC', 'brand-500': '#3366D6',
      'ink-900': '#191B1F', 'ink-950': '#2B2F36',
      'gray-50': '#F8F7F5', 'gray-100': '#F3F2EF', 'gray-200': '#EBE9E5', 'gray-300': '#E3E1DC', 'gray-350': '#D6D3CD',
      'gray-400': '#C5C1BA', 'gray-450': '#A29E96', 'gray-500': '#76726B', 'gray-600': '#5E5A53',
      'accent-lime-100': '#F3F2EF', 'accent-lime-500': '#E6E4DF', 'accent-lime-700': '#3366D6',
      'error-500': '#E5484D', 'warning-500': '#E0952B',
    })}}${NEUTRAL_ICON}`,
  },
};
const SCREENS = [
  ['home', '/home'],
  ['noti', '/notifications'],
  ['school', '/my/school'],
  ['meal', '/meal'],
];

(async () => {
  const b = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
  fs.mkdirSync('shots/palette', { recursive: true });
  for (const [key, pal] of Object.entries(PALETTES).filter(([k]) => !process.argv[2] || process.argv[2].split(',').includes(k))) {
    for (const [sk, path] of SCREENS) {
      const p = await b.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
      await p.goto(`http://localhost:5173/?frame=0#${path}`, { waitUntil: 'networkidle' });
      if (pal.css) await p.addStyleTag({ content: pal.css });
      await p.waitForTimeout(900);
      await p.screenshot({ path: `shots/palette/${key}-${sk}.png` });
      await p.close();
    }
  }
  await b.close();
  fs.writeFileSync('shots/palette/names.json', JSON.stringify(Object.fromEntries(Object.entries(PALETTES).map(([k, v]) => [k, v.name]))));
  console.log('done');
})();
