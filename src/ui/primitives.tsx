import { createElement, forwardRef, type CSSProperties, type ElementType, type HTMLAttributes, type ReactNode } from 'react';

/* ────────────────────────────────────────────────────────────
 * 토큰을 '타입'으로 강제하는 레이아웃·텍스트 원자 컴포넌트
 * - 간격은 WivU/Layout space 스케일만 허용 (2/4/8/12/16/20/24/32)
 * - 텍스트는 'WivU Type' 15종만 허용
 * ──────────────────────────────────────────────────────────── */

export type Space = 0 | 2 | 4 | 8 | 12 | 16 | 20 | 24 | 32;
export type Radius = 4 | 6 | 8 | 12 | 14 | 16 | 24 | 'full';

/** v5 타입 스케일 13종 (Figma 'WivU v5/*'). 아래쪽 v4 이름은 같은 값의 호환 별칭 — 새 코드는 v5 이름만 */
export type TypeVariant =
  | 'title-1'
  | 'title-2'
  | 'title-3'
  | 'body-1'
  | 'body-1-strong'
  | 'body-2'
  | 'body-2-strong'
  | 'body-3'
  | 'body-3-strong'
  | 'caption-1'
  | 'caption-1-strong'
  | 'caption-2'
  | 'caption-2-strong'
  /** @deprecated v4 별칭 */
  | 'display'
  | 'headline'
  | 'subhead'
  | 'body'
  | 'label'
  | 'callout'
  | 'micro'
  | 'number';

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'placeholder'
  | 'brand'
  | 'on-brand'
  | 'on-brand-muted'
  | 'error'
  | 'warning'
  | 'pulse'
  | 'inherit';

const sp = (v?: Space) => (v === undefined ? undefined : v === 0 ? 0 : `var(--wivu-space-${v})`);
export const radius = (r: Radius) => `var(--wivu-radius-${r})`;

const TEXT_COLOR: Record<TextColor, string> = {
  primary: 'var(--wivu-color-text-primary)',
  secondary: 'var(--wivu-color-text-secondary)',
  tertiary: 'var(--wivu-color-text-tertiary)',
  placeholder: 'var(--wivu-color-text-placeholder)',
  brand: 'var(--wivu-color-text-brand)',
  'on-brand': 'var(--wivu-color-text-on-brand)',
  'on-brand-muted': 'var(--wivu-color-text-on-brand-muted)',
  error: 'var(--wivu-color-text-error)',
  warning: 'var(--wivu-color-status-warning)',
  pulse: 'var(--wivu-color-icon-pulse)',
  inherit: 'inherit',
};
export const textColor = (c: TextColor) => TEXT_COLOR[c];

type TextProps = HTMLAttributes<HTMLElement> & {
  variant?: TypeVariant;
  color?: TextColor;
  as?: ElementType;
  truncate?: boolean;
  /** 최대 줄 수 (말줄임) */
  lines?: number;
  tnum?: boolean;
  align?: CSSProperties['textAlign'];
  children?: ReactNode;
};

export function Text({ variant = 'body-2', color = 'primary', as = 'span', truncate, lines, tnum, align, className, style, ...rest }: TextProps) {
  const cls = [`t-${variant}`, truncate && 'truncate', tnum && 'tnum', className].filter(Boolean).join(' ');
  const clamp: CSSProperties | undefined = lines
    ? { display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
    : undefined;
  return createElement(as, {
    className: cls,
    style: { color: TEXT_COLOR[color], textAlign: align, ...clamp, ...style },
    ...rest,
  });
}

type BoxProps = HTMLAttributes<HTMLDivElement> & {
  as?: ElementType;
  gap?: Space;
  p?: Space;
  px?: Space;
  py?: Space;
  pt?: Space;
  pb?: Space;
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  wrap?: boolean;
  grow?: boolean;
  children?: ReactNode;
};

function boxStyle({ gap, p, px, py, pt, pb, align, justify, wrap, grow }: BoxProps, direction: 'row' | 'column'): CSSProperties {
  return {
    display: 'flex',
    flexDirection: direction,
    gap: sp(gap),
    padding: sp(p),
    paddingInline: sp(px),
    paddingBlock: sp(py),
    paddingTop: sp(pt),
    paddingBottom: sp(pb),
    alignItems: align,
    justifyContent: justify,
    flexWrap: wrap ? 'wrap' : undefined,
    flex: grow ? '1 1 0%' : undefined,
    minWidth: 0,
  };
}

/** 세로 스택 */
export const Stack = forwardRef<HTMLDivElement, BoxProps>(function Stack(props, ref) {
  const { as = 'div', gap, p, px, py, pt, pb, align, justify, wrap, grow, style, ...rest } = props;
  return createElement(as, { ref, style: { ...boxStyle({ gap, p, px, py, pt, pb, align, justify, wrap, grow }, 'column'), ...style }, ...rest });
});

/** 가로 정렬 */
export const Row = forwardRef<HTMLDivElement, BoxProps>(function Row(props, ref) {
  const { as = 'div', gap, p, px, py, pt, pb, align = 'center', justify, wrap, grow, style, ...rest } = props;
  return createElement(as, { ref, style: { ...boxStyle({ gap, p, px, py, pt, pb, align, justify, wrap, grow }, 'row'), ...style }, ...rest });
});

export function Spacer() {
  return <div style={{ flex: '1 1 auto' }} />;
}
