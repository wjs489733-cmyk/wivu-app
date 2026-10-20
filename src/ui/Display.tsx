import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { Text } from './primitives';
import s from './Display.module.css';

/* ── Chip / Tag ───────────────────────────────────────────────
 * 색 매핑(디자인 노트): 학사·전공·중식 → brand / 장학·UX리서치 → pulse /
 * 행사·석식·학점 → neutral / D-DAY → danger / 히어로 상태 → onBrand */
export type ChipTone = 'brand' | 'solid' | 'pulse' | 'neutral' | 'outline' | 'danger' | 'dangerSoft' | 'warningSoft' | 'onBrand' | 'white';

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: ChipTone;
  size?: 's' | 'm';
  pill?: boolean;
  icon?: IconName;
  dot?: boolean;
  /** 필터 칩처럼 선택 가능한 경우 */
  selected?: boolean;
  onSelect?: () => void;
  children: ReactNode;
};

export function Chip({ tone = 'brand', size = 's', pill, icon, dot, selected, onSelect, className, children, ...rest }: ChipProps) {
  const cls = [s.chip, s[`chip_${size}`], s[`tone_${tone}`], pill && s.pill, onSelect && s.selectable, selected && s.selected, size === 's' ? 't-caption-2-strong' : 't-caption-1-strong', className]
    .filter(Boolean)
    .join(' ');
  const content = (
    <>
      {dot && <span className={s.dotMark} />}
      {icon && <Icon name={icon} size={16} />}
      {children}
    </>
  );
  if (onSelect) {
    return (
      <button type="button" className={cls} aria-pressed={selected} onClick={onSelect}>
        {content}
      </button>
    );
  }
  return (
    <span className={cls} {...rest}>
      {content}
    </span>
  );
}

/* ── Badge ──────────────────────────────────────────────────── */
export function NewBadge() {
  return (
    <span className={`${s.badgeNew} t-micro`} aria-label="새 글">
      N
    </span>
  );
}
export function CountBadge({ count }: { count: number }) {
  return <span className={`${s.badgeCount} t-micro tnum`}>{count > 99 ? '99+' : count}</span>;
}
export function DotBadge({ style }: { style?: CSSProperties }) {
  return <span className={s.badgeDot} style={style} aria-label="새 소식" />;
}

/* ── Avatar ─────────────────────────────────────────────────── */
const AVATAR_COLORS = ['#4C80F0', '#78B625', '#9AA3B2', '#D98C26', '#0D1B42', '#F04C64'];
export function Avatar({ name, size = 32, color, tone = 'solid' }: { name: string; size?: number; color?: string; tone?: 'solid' | 'soft' }) {
  const bg = color ?? AVATAR_COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
  const soft = tone === 'soft';
  return (
    <span
      className={`${s.avatar} ${size >= 40 ? 't-headline' : size >= 32 ? 't-caption-1-strong' : 't-micro'}`}
      style={{
        width: size,
        height: size,
        background: soft ? 'var(--wivu-color-bg-brand-soft)' : bg,
        color: soft ? 'var(--wivu-color-text-brand)' : '#fff',
      }}
      aria-label={name}
    >
      {name.slice(0, 1)}
    </span>
  );
}
export function AvatarStack({ names, size = 24 }: { names: string[]; size?: number }) {
  return (
    <span className={s.avatarStack}>
      {names.map((n, i) => (
        <span key={n + i} style={{ borderRadius: '50%' }}>
          <span style={{ display: 'block', width: size, height: size, borderRadius: '50%', background: AVATAR_COLORS[i % 3] }} aria-label={n} />
        </span>
      ))}
    </span>
  );
}

/* ── Progress ───────────────────────────────────────────────── */
export function ProgressBar({ value, tone = 'brand', height = 6 }: { value: number; tone?: 'brand' | 'error' | 'pulse' | 'warning'; height?: number }) {
  const color = { brand: 'var(--wivu-color-bg-brand)', error: 'var(--wivu-color-status-error)', pulse: 'var(--wivu-color-bg-pulse-pressed)', warning: 'var(--wivu-color-status-warning)' }[tone];
  return (
    <div className={s.progress} style={{ height }} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={s.progressFill} style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

/* ── Divider ────────────────────────────────────────────────── */
/** 섹션 사이 전폭 1px 구분선 (10-02 규칙: 섹션 여백 한가운데, border/default) */
export function SectionDivider() {
  return <div className={s.sectionDivider} role="separator" />;
}
export function Divider({ inset = 0, style }: { inset?: number; style?: CSSProperties }) {
  return <div className={s.divider} style={{ marginInline: inset, ...style }} role="separator" />;
}

/* ── Spinner ────────────────────────────────────────────────── */
export function Spinner({ size = 32 }: { size?: number }) {
  return <span className={s.spinner} style={{ width: size, height: size, display: 'inline-block' }} role="status" aria-label="불러오는 중" />;
}

/* ── Key-value meta line: "A · B · C" ──────────────────────── */
export function MetaLine({ items, color = 'tertiary', variant = 'caption-2' }: { items: ReactNode[]; color?: 'tertiary' | 'secondary' | 'on-brand-muted'; variant?: 'caption-1' | 'caption-2' | 'callout' }) {
  return (
    <Text variant={variant} color={color} as="p" className="truncate">
      {items.filter(Boolean).map((it, i) => (
        <span key={i}>
          {i > 0 && ' · '}
          {it}
        </span>
      ))}
    </Text>
  );
}
