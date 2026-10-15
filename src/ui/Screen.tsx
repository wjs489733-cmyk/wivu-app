import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { Icon, type IconName } from './Icon';
import { Text } from './primitives';
import { useNav } from '@/nav/nav';
import { ScreenCtx } from './screenContext';
import s from './Screen.module.css';

/* 프레임 모드(데스크톱 폰 목업) 여부 — 상태바·홈 인디케이터 표시에 사용 */
export const DeviceCtx = createContext<{ framed: boolean }>({ framed: false });
export const useDevice = () => useContext(DeviceCtx);

export type ScreenBg = 'surface' | 'subtle' | 'soft' | 'brand' | 'ink' | 'qr-dark';
const BG: Record<ScreenBg, string> = {
  surface: 'var(--wivu-color-bg-surface)',
  subtle: 'var(--wivu-color-bg-subtle)',
  soft: 'var(--wivu-color-bg-brand-soft)',
  brand: 'var(--wivu-color-bg-brand)',
  ink: 'var(--wivu-color-bg-brand-pressed)',
  'qr-dark': 'var(--wivu-color-bg-qr-dark)',
};

type ScreenProps = {
  /** 상태바 아래 고정 헤더 (TopNav / LargeHeader 등) */
  header?: ReactNode;
  /** 하단 고정 레이어 (TabBar / CtaBar) — 스크롤 콘텐츠 아래 여백 자동 확보 */
  footer?: ReactNode;
  bg?: ScreenBg;
  /** 상태바·홈 인디케이터 색 (어두운 배경이면 'light') */
  tone?: 'dark' | 'light';
  /** 홈 인디케이터만 다른 색이 필요할 때 (예: 어두운 화면 + 흰 하단 패널 → 'dark') */
  indicatorTone?: 'dark' | 'light';
  scroll?: boolean;
  /** 스크롤 시 헤더 아래 1px 라인 */
  hairline?: boolean;
  /** 스크롤 콘텐츠 하단 추가 여백 (기본 24) */
  bottomSpace?: number;
  scrollRef?: RefObject<HTMLDivElement | null>;
  /** 화면 위에 겹치는 레이어(바텀시트·토스트 등) */
  overlay?: ReactNode;
  children?: ReactNode;
  style?: CSSProperties;
  /** Figma 프레임 id (개발 메타) */
  figma?: string;
};

export function Screen({ header, footer, bg = 'surface', tone, indicatorTone, scroll = true, hairline = true, bottomSpace = 24, scrollRef, overlay, children, style, figma }: ScreenProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const ref = scrollRef ?? innerRef;
  const footerRef = useRef<HTMLDivElement>(null);
  const [footerH, setFooterH] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const statusTone = tone ?? (bg === 'surface' || bg === 'subtle' || bg === 'soft' ? 'dark' : 'light');
  const scrollToTop = useCallback(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    ref.current?.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }, [ref]);
  const api = useMemo(() => ({ scrollToTop }), [scrollToTop]);

  useEffect(() => {
    if (!footerRef.current) return;
    const ro = new ResizeObserver(([e]) => setFooterH(e.contentRect.height));
    ro.observe(footerRef.current);
    return () => ro.disconnect();
  }, [footer]);

  return (
    <ScreenCtx.Provider value={api}>
      <div className={s.screen} style={{ background: BG[bg], ...style }} data-figma={figma}>
        <div className={s.top} data-scrolled={scrolled} data-hairline={hairline} style={{ background: BG[bg] }}>
          <StatusBar tone={statusTone} />
          {header}
        </div>
        <div
          ref={ref}
          className={`${s.scroll} ${scroll ? '' : s.noScroll}`}
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 2)}
        >
          {children}
          <div style={{ height: footerH + bottomSpace }} aria-hidden />
        </div>
        {footer && (
          <div ref={footerRef} className={s.footer}>
            {footer}
          </div>
        )}
        {overlay}
        <HomeIndicator tone={indicatorTone ?? statusTone} />
      </div>
    </ScreenCtx.Provider>
  );
}

/* ── Status bar ─────────────────────────────────────────────── */
export function StatusBar({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const { framed } = useDevice();
  const color = tone === 'dark' ? '#000' : '#fff';
  return (
    <div className={s.statusBar} style={{ color }} aria-hidden>
      {framed && (
        <>
          <span>9:41</span>
          <span className={s.statusIcons}>
            <svg width="19" height="12" viewBox="0 0 19 12" fill={color}>
              <rect x="0" y="7.5" width="3.2" height="4.5" rx="1" />
              <rect x="5" y="5" width="3.2" height="7" rx="1" />
              <rect x="10" y="2.5" width="3.2" height="9.5" rx="1" />
              <rect x="15" y="0" width="3.2" height="12" rx="1" />
            </svg>
            <svg width="17" height="12" viewBox="0 0 17 12" fill={color}>
              <path d="M8.5 2.3c2.3 0 4.4.9 6 2.4l1.2-1.2A10.2 10.2 0 0 0 8.5.6 10.2 10.2 0 0 0 1.3 3.5l1.2 1.2a8.6 8.6 0 0 1 6-2.4Zm0 3.3c1.4 0 2.7.5 3.7 1.4l1.2-1.2a7 7 0 0 0-9.8 0L4.8 7a5.3 5.3 0 0 1 3.7-1.4Zm0 3.3c.6 0 1.1.2 1.5.6L8.5 11 6.9 9.5c.4-.4 1-.6 1.6-.6Z" />
            </svg>
            <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
              <rect x="0.5" y="0.5" width="23" height="12" rx="3.8" stroke={color} strokeOpacity="0.35" />
              <rect x="2" y="2" width="20" height="9" rx="2.5" fill={color} />
              <path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill={color} fillOpacity="0.4" />
            </svg>
          </span>
        </>
      )}
    </div>
  );
}

export function HomeIndicator({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const { framed } = useDevice();
  if (!framed) return null;
  return <div className={s.homeIndicator} style={{ background: tone === 'dark' ? '#000' : '#fff' }} />;
}

/* ── Icon button (헤더 24 아이콘, 터치 영역 44) ─────────────── */
export function IconButton({ icon, label, onPress, dot, color }: { icon: IconName; label: string; onPress?: () => void; dot?: boolean; color?: string }) {
  return (
    <button type="button" className={s.iconButton} onClick={onPress} aria-label={label} style={color ? { color } : undefined}>
      <Icon name={icon} size={24} />
      {dot && <span className={s.iconButtonDot} />}
    </button>
  );
}

/* ── Top nav (상세 화면) ─────────────────────────────────────── */
type TopNavProps = {
  title?: ReactNode;
  /** 'back' = 뒤로 셰브론(push 화면), 'close' = X(모달 화면), null = 없음 */
  leading?: 'back' | 'close' | null;
  onLeading?: () => void;
  /** 뒤로 갈 곳이 없을 때 */
  fallback?: string;
  trailing?: ReactNode;
  tone?: 'dark' | 'light';
};
export function TopNav({ title, leading = 'back', onLeading, fallback, trailing, tone = 'dark' }: TopNavProps) {
  const nav = useNav();
  const color = tone === 'light' ? 'var(--wivu-color-text-on-brand)' : undefined;
  return (
    <div className={s.topNav} style={color ? { color } : undefined}>
      <div className={s.navSide}>
        {leading && (
          <IconButton icon={leading === 'back' ? 'back' : 'close'} label={leading === 'back' ? '뒤로' : '닫기'} onPress={onLeading ?? (() => nav.back(fallback))} color={color} />
        )}
      </div>
      <Text variant="title-3" className={s.navTitle} color={tone === 'light' ? 'on-brand' : 'primary'} as="h1">
        {title}
      </Text>
      <div className={`${s.navSide} ${s.navSideRight}`}>{trailing}</div>
    </div>
  );
}

export function TextAction({ children, onPress, disabled }: { children: ReactNode; onPress?: () => void; disabled?: boolean }) {
  return (
    <button type="button" className={`${s.textAction} t-headline`} onClick={onPress} disabled={disabled}>
      {children}
    </button>
  );
}

/* ── Large header (탭 루트) ─────────────────────────────────── */
export function LargeHeader({ title, actions, below }: { title: ReactNode; actions?: ReactNode; below?: ReactNode }) {
  return (
    <>
      <div className={s.largeHeader}>
        {typeof title === 'string' ? (
          <Text variant="title-1" as="h1">
            {title}
          </Text>
        ) : (
          title
        )}
        <div style={{ display: 'flex', alignItems: 'center' }}>{actions}</div>
      </div>
      {below}
    </>
  );
}

/* ── Bottom CTA bar ─────────────────────────────────────────── */
export function CtaBar({ children }: { children: ReactNode }) {
  return <div className={s.ctaBar}>{children}</div>;
}

export { s as screenStyles };
