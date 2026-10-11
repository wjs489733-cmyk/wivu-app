import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { DotBadge } from './Display';
import { Text, type TextColor } from './primitives';
import s from './Surface.module.css';

/* ── Card ─────────────────────────────────────────────────────
 * outline: 흰 배경 + border/default 1px (기본, 그림자 없음)
 * soft: brand-soft / subtle: bg/subtle / pulse: 라임 소프트
 * brand: 히어로(r24, 블루) / ink: 히어로 다음 카드(네이비) / elevated: 오버레이 위 카드 */
export type CardVariant = 'outline' | 'soft' | 'subtle' | 'pulse' | 'brand' | 'ink' | 'elevated';

type CardProps = HTMLAttributes<HTMLElement> & {
  variant?: CardVariant;
  flush?: boolean;
  onPress?: () => void;
  children: ReactNode;
};

export function Card({ variant = 'outline', flush, onPress, className, children, ...rest }: CardProps) {
  const cls = [s.card, s[variant], flush && s.flush, onPress && s.pressable, className].filter(Boolean).join(' ');
  if (onPress) {
    // div[role=button] — 카드 안에 Button이 들어가도 중첩 <button>이 되지 않게
    return (
      <div
        role="button"
        tabIndex={0}
        className={cls}
        onClick={onPress}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onPress();
          }
        }}
        {...(rest as HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    );
  }
  return (
    <div className={cls} {...(rest as HTMLAttributes<HTMLDivElement>)}>
      {children}
    </div>
  );
}

/* ── Tile ─────────────────────────────────────────────────────
 * filled: 과목 상세 4열 (bg/subtle, 흰 원 안 24 아이콘)
 * outline: 게시판 3열 (r14, 아이콘 + 라벨, 빨간 점) */
type TileProps = {
  icon: IconName;
  label: string;
  sub?: string;
  subColor?: TextColor;
  variant?: 'filled' | 'outline';
  dot?: boolean;
  onPress?: () => void;
};
export function Tile({ icon, label, sub, subColor = 'tertiary', variant = 'filled', dot, onPress }: TileProps) {
  return (
    <button type="button" className={[s.tile, variant === 'outline' && s.tileOutline].filter(Boolean).join(' ')} onClick={onPress}>
      {variant === 'filled' ? (
        <span className={s.tileIcon}>
          <Icon name={icon} size={24} />
        </span>
      ) : (
        <Icon name={icon} size={20} color="primary" />
      )}
      <Text variant="label">{label}</Text>
      {sub && (
        <Text variant="caption-2" color={subColor}>
          {sub}
        </Text>
      )}
      {dot && <DotBadge style={{ position: 'absolute', top: 10, right: 10 }} />}
    </button>
  );
}

/* ── Section ──────────────────────────────────────────────────
 * 제목(Title 2, x=20) + 오른쪽 '전체 N ›' 링크(x=372 정렬) + 본문(x=16) */
type SectionProps = {
  title: ReactNode;
  /** '전체 3' 등 더보기 링크 */
  more?: string;
  onMore?: () => void;
  /** 링크 대신 오른쪽 보조 텍스트 */
  aside?: ReactNode;
  /** 본문 좌우 패딩 (기본 gutter 16). 가로 스크롤 등은 false */
  padded?: boolean;
  children: ReactNode;
  style?: CSSProperties;
};
export function Section({ title, more, onMore, aside, padded = true, children, style }: SectionProps) {
  return (
    <section className={s.section} style={style}>
      <div className={s.sectionHeader}>
        <Text variant="title-2" as="h2">
          {title}
        </Text>
        {more ? <MoreLink label={more} onPress={onMore} /> : aside ? <Text variant="caption-1" color="tertiary">{aside}</Text> : null}
      </div>
      <div className={padded ? s.sectionBody : undefined}>{children}</div>
    </section>
  );
}

export function MoreLink({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <button type="button" className={`${s.moreLink} t-caption-1`} onClick={onPress}>
      {label}
      <Icon name="chevron-right" size={16} />
    </button>
  );
}

/* ── List ─────────────────────────────────────────────────────
 * 흰 카드 안 그룹 리스트: 행 패딩 14, 행 사이 1px 구분선 */
export function ListGroup({ children, plain, style }: { children: ReactNode; plain?: boolean; style?: CSSProperties }) {
  return (
    <div className={plain ? s.listGroupPlain : s.listGroup} style={style}>
      {children}
    </div>
  );
}

type ListRowProps = {
  title: ReactNode;
  titleVariant?: 'subhead' | 'label' | 'headline' | 'body';
  meta?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  titleAddon?: ReactNode;
  style?: CSSProperties;
};
export function ListRow({ title, titleVariant = 'subhead', meta, leading, trailing, chevron, onPress, titleAddon, style }: ListRowProps) {
  const content = (
    <>
      {leading}
      <span className={s.rowMain}>
        <span className={s.rowTitle}>
          <Text variant={titleVariant} className="truncate">
            {title}
          </Text>
          {titleAddon}
        </span>
        {meta && (typeof meta === 'string' ? <Text variant="caption-2" color="tertiary" className="truncate">{meta}</Text> : meta)}
      </span>
      {(trailing || chevron) && (
        <span className={s.rowTrailing}>
          {trailing}
          {chevron && <Icon name="chevron-right" size={20} color="secondary" />}
        </span>
      )}
    </>
  );
  if (onPress) {
    return (
      <button type="button" className={`${s.row} ${s.rowPressable}`} onClick={onPress} style={style}>
        {content}
      </button>
    );
  }
  return (
    <div className={s.row} style={style}>
      {content}
    </div>
  );
}

export function LeadingIcon({ icon, tone = 'brand' }: { icon: IconName; tone?: 'brand' | 'subtle' | 'pulse' }) {
  const bg = { brand: 'var(--wivu-color-bg-brand-soft)', subtle: 'var(--wivu-color-bg-subtle)', pulse: 'var(--wivu-color-bg-pulse-soft)' }[tone];
  const fg = { brand: 'var(--wivu-color-icon-brand)', subtle: 'var(--wivu-color-icon-primary)', pulse: 'var(--wivu-color-icon-pulse)' }[tone];
  return (
    <span className={s.leadingBox} style={{ background: bg, color: fg }}>
      <Icon name={icon} size={20} />
    </span>
  );
}
