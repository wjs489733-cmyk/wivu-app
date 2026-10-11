// Figma 추출 데이터(design/figma/*.json) → W3C DTCG 토큰(design/tokens/*.tokens.json)
// 실행: npm run tokens:figma  (이후 npm run tokens:build 로 CSS 생성)
// Figma REST Variables API는 Enterprise 전용이라, 플러그인 API로 추출한 JSON을 원본으로 쓴다.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(resolve(root, p), 'utf8'));
const out = (name, data) => {
  const dir = resolve(root, 'design/tokens');
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, `${name}.tokens.json`), JSON.stringify(data, null, 2) + '\n');
};

const vars = read('design/figma/variables.json');
const textStyles = read('design/figma/text-styles.json');
const effects = read('design/figma/effect-styles.json');
const col = (name) => vars.collections.find((c) => c.name === name);

const hexToComponents = (hex) => [1, 3, 5].map((i) => +(parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(4));
const color = (hex, alpha = 1) => ({ colorSpace: 'srgb', components: hexToComponents(hex), alpha, hex });
const dim = (value) => ({ value, unit: 'px' });
const FIGMA = { 'com.figma': { source: 'figma' } };
const CODE = (why) => ({ 'com.wivu': { source: 'code', note: why } });

const setPath = (obj, path, token) => {
  let o = obj;
  path.slice(0, -1).forEach((k) => (o = o[k] ??= {}));
  o[path.at(-1)] = token;
};

// ── 1. Primitive colors ──────────────────────────────────────────
const primitive = { color: { primitive: { $type: 'color', $description: 'Figma: WivU/Color Primitives — 화면에서 직접 쓰지 않는다' } } };
for (const v of col('WivU/Color Primitives').variables) {
  const { hex, alpha } = v.values.Value.value;
  setPath(primitive.color.primitive, v.name.split('/'), { $value: color(hex, alpha), $extensions: FIGMA });
}

// ── 2. Semantic colors (alias → primitive) ───────────────────────
const semantic = {};
for (const v of col('WivU/Color').variables) {
  const m = v.values.Light;
  const ref = m.aliasOf ? `{color.primitive.${m.aliasOf.split('/').join('.')}}` : color(m.value.hex, m.value.alpha);
  setPath(semantic, v.name.split('/'), { $type: 'color', $value: ref, $extensions: FIGMA });
}
// 코드 쪽 보강: Figma 화면에 RAW로만 있던 값들
Object.assign(semantic.bg, {
  'qr-dark': { $type: 'color', $value: color('#0F121A'), $extensions: CODE('QR 화면 배경 (Figma RAW #0F121A)') },
  scrim: { $type: 'color', $value: color('#101828', 0.4), $extensions: CODE('바텀시트·모달 딤') },
  'on-brand-ghost': { $type: 'color', $value: color('#FFFFFF', 0.2), $extensions: CODE('파란 카드 위 20% 흰 버튼 (Button v4 OnBrandGhost)') },
  'on-brand-chip': { $type: 'color', $value: color('#FFFFFF', 0.18), $extensions: CODE('히어로 카드 상태 칩 (Figma RAW #FFFFFF@18)') },
});
Object.assign(semantic.text, {
  'on-brand-muted': { $type: 'color', $value: color('#FFFFFF', 0.85), $extensions: CODE('히어로 카드 메타 (Figma RAW #FFFFFF@85)') },
});

// ── 3. Layout: space / radius ────────────────────────────────────
const layout = { space: { $type: 'dimension' }, radius: { $type: 'dimension' } };
for (const v of col('WivU/Layout').variables) {
  const [group, key] = v.name.split('/');
  layout[group][key] = { $value: dim(v.values.Default.value), $extensions: FIGMA };
}
layout.radius['6'] = { $value: dim(6), $extensions: CODE('칩·태그 (매뉴얼: 칩 999 또는 6)') };
layout.radius['24'] = { $value: dim(24), $extensions: CODE('홈 히어로 카드 (Figma RAW 24)') };
layout.layout = {
  $type: 'dimension',
  'screen-width': { $value: dim(392), $extensions: FIGMA },
  'screen-height': { $value: dim(852), $extensions: FIGMA },
  gutter: { $value: dim(16), $description: '카드 좌우', $extensions: FIGMA },
  inset: { $value: dim(20), $description: '텍스트 좌측 / 오른쪽 정렬선 392−20', $extensions: FIGMA },
  'section-gap': { $value: dim(32), $extensions: FIGMA },
  'tabbar-height': { $value: dim(84), $description: '탭바 본체 (홈 범프 제외, 홈 인디케이터 포함)', $extensions: CODE('Figma 135는 범프·인디케이터 포함 영역') },
  'navbar-height': { $value: dim(52), $extensions: CODE('상단 내비 바') },
  'statusbar-height': { $value: dim(54), $extensions: CODE('iPhone 15 상태바') },
  'home-indicator': { $value: dim(34), $extensions: CODE('홈 인디케이터 영역') },
};

// ── 4. Typography (composite) ────────────────────────────────────
const weight = { Regular: 400, Medium: 500, Semibold: 600, Bold: 700 };
const typography = {
  font: {
    family: {
      $type: 'fontFamily',
      base: {
        $value: ['Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Apple SD Gothic Neo', 'Noto Sans KR', 'sans-serif'],
        $extensions: CODE('10-12 결정: 최종 폰트 Pretendard (Figma 스타일은 작업용 SF Pro)'),
      },
    },
  },
  type: { $type: 'typography' },
};
for (const s of textStyles.current.styles) {
  const key = s.name.replace('WivU Type/', '').toLowerCase().replace(/\s+/g, '-');
  typography.type[key] = {
    $value: {
      fontFamily: '{font.family.base}',
      fontWeight: weight[s.fontStyle] ?? 400,
      fontSize: dim(s.fontSize),
      lineHeight: s.lineHeight.unit === 'PIXELS' ? +(s.lineHeight.value / s.fontSize).toFixed(4) : 1.4,
      letterSpacing: { value: s.letterSpacing.value / 100, unit: 'em' },
    },
    $extensions: { 'com.figma': { source: 'figma', style: s.name, lineHeightPx: s.lineHeight.value } },
  };
}

// ── 5. Effects / elevation ───────────────────────────────────────
const elevation = { elevation: { $type: 'shadow' } };
for (const s of effects.styles) {
  const e = s.effects[0];
  const key = s.name.split('/').at(-1).toLowerCase();
  elevation.elevation[key] = {
    $value: { color: color(e.color, e.alpha), offsetX: dim(e.offset.x), offsetY: dim(e.offset.y), blur: dim(e.radius), spread: dim(e.spread ?? 0) },
    $description: s.description,
    $extensions: FIGMA,
  };
}
elevation.elevation.fab = {
  $value: { color: color('#4C80F0', 0.35), offsetX: dim(0), offsetY: dim(6), blur: dim(16), spread: dim(0) },
  $extensions: CODE('게시판 글쓰기 FAB (Figma RAW)'),
};

// ── 6. Motion (Figma 프로토타입 전환 규칙) ───────────────────────
const motion = {
  duration: {
    $type: 'duration',
    push: { $value: { value: 300, unit: 'ms' }, $description: '상세 PUSH LEFT 0.3s', $extensions: FIGMA },
    modal: { $value: { value: 300, unit: 'ms' }, $description: '입력·모달 MOVE_IN TOP', $extensions: FIGMA },
    dissolve: { $value: { value: 250, unit: 'ms' }, $description: '완료·상태 DISSOLVE', $extensions: FIGMA },
    press: { $value: { value: 120, unit: 'ms' }, $extensions: CODE('버튼 눌림') },
  },
  easing: {
    $type: 'cubicBezier',
    standard: { $value: [0.32, 0.72, 0, 1], $description: 'iOS 내비게이션 커브 근사', $extensions: CODE('iOS 전환 근사') },
    out: { $value: [0.16, 1, 0.3, 1], $extensions: CODE('등장') },
  },
};

// ── 7. Component tokens (Button v4 474:3714) ─────────────────────
const component = {
  button: {
    l: { height: { $type: 'dimension', $value: dim(52) }, 'padding-x': { $type: 'dimension', $value: '{space.20}' }, gap: { $type: 'dimension', $value: '{space.8}' }, radius: { $type: 'dimension', $value: '{radius.14}' }, icon: { $type: 'dimension', $value: dim(20) } },
    m: { height: { $type: 'dimension', $value: dim(44) }, 'padding-x': { $type: 'dimension', $value: '{space.16}' }, gap: { $type: 'dimension', $value: '{space.8}' }, radius: { $type: 'dimension', $value: '{radius.12}' }, icon: { $type: 'dimension', $value: dim(16) } },
    s: { height: { $type: 'dimension', $value: dim(32) }, 'padding-x': { $type: 'dimension', $value: '{space.12}' }, gap: { $type: 'dimension', $value: '{space.4}' }, radius: { $type: 'dimension', $value: '{radius.full}' }, icon: { $type: 'dimension', $value: dim(16) } },
  },
  card: {
    radius: { $type: 'dimension', $value: '{radius.16}' },
    padding: { $type: 'dimension', $value: '{space.16}' },
    border: { $type: 'color', $value: '{color.border.default}' },
  },
  chip: {
    height: { $type: 'dimension', $value: dim(24) },
    radius: { $type: 'dimension', $value: '{radius.6}' },
  },
};

out('primitive', primitive);
out('semantic', { color: semantic });
out('layout', layout);
out('typography', typography);
out('elevation', elevation);
out('motion', motion);
out('component', component);
console.log('DTCG tokens written → design/tokens/');
