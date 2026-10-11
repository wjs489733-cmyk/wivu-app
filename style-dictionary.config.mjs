// design/tokens/*.tokens.json (W3C DTCG) → src/styles/tokens.css, typography.css, src/styles/tokens.ts
import StyleDictionary from 'style-dictionary';

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const px = (d) => (isObj(d) ? `${d.value}${d.unit}` : typeof d === 'number' ? `${d}px` : d);
const css = {
  color: (c) => {
    if (!isObj(c)) return c;
    if (c.alpha === undefined || c.alpha === 1) return c.hex.toUpperCase();
    const [r, g, b] = c.components.map((n) => Math.round(n * 255));
    return `rgba(${r}, ${g}, ${b}, ${c.alpha})`;
  },
  family: (f) => (Array.isArray(f) ? f.map((x) => (/\s/.test(x) && !x.startsWith('-') ? `"${x}"` : x)).join(', ') : f),
};

StyleDictionary.registerTransform({
  name: 'wivu/value',
  type: 'value',
  transitive: true,
  transform: (token) => {
    const v = token.$value ?? token.value;
    switch (token.$type) {
      case 'color': return css.color(v);
      case 'dimension': return px(v);
      case 'duration': return isObj(v) ? `${v.value}${v.unit}` : v;
      case 'cubicBezier': return Array.isArray(v) ? `cubic-bezier(${v.join(', ')})` : v;
      case 'fontFamily': return css.family(v);
      case 'shadow': return isObj(v) ? `${px(v.offsetX)} ${px(v.offsetY)} ${px(v.blur)} ${px(v.spread)} ${css.color(v.color)}` : v;
      case 'typography': return isObj(v) ? `${v.fontWeight} ${px(v.fontSize)}/${v.lineHeight} ${css.family(v.fontFamily)}` : v;
      default: return v;
    }
  },
});

// .t-display, .t-title-1 … — 'WivU Type' 15종을 그대로 클래스로
StyleDictionary.registerFormat({
  name: 'wivu/typography-classes',
  format: ({ dictionary }) => {
    const rows = dictionary.allTokens
      .filter((t) => t.$type === 'typography')
      .map((t) => {
        const v = t.original.$value;
        const name = t.path.slice(1).join('-');
        return `.t-${name} {\n  font-family: var(--wivu-font-family-base);\n  font-size: ${px(v.fontSize)};\n  line-height: ${v.lineHeight};\n  font-weight: ${v.fontWeight};\n  letter-spacing: ${px(v.letterSpacing)};\n}`;
      });
    return `/* 자동 생성 — 수정 금지. 원본: design/tokens/typography.tokens.json (Figma 'WivU Type') */\n${rows.join('\n')}\n`;
  },
});

export default {
  source: ['design/tokens/**/*.tokens.json'],
  usesDtcg: true,
  log: { verbosity: 'default' },
  platforms: {
    css: {
      transforms: ['name/kebab', 'wivu/value'],
      prefix: 'wivu',
      buildPath: 'src/styles/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: (token) => ['color', 'dimension'].includes(token.$type),
            fileHeader: () => ['자동 생성 — 수정 금지', '원본: design/tokens/*.tokens.json (W3C DTCG) ← Figma WivU_Prototyping_v3-codex'],
          },
        },
        { destination: 'typography.css', format: 'wivu/typography-classes' },
      ],
    },
    ts: {
      transforms: ['name/camel', 'wivu/value'],
      prefix: 'wivu',
      buildPath: 'src/styles/',
      files: [{ destination: 'tokens.ts', format: 'javascript/es6' }],
    },
  },
};
