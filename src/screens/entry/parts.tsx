import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Chip, Icon, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import type { School } from './data';
import s from './Entry.module.css';

/* 진입 화면 전용 부품 — Figma Entry v4 공통 헤더(원형 뒤로 44 + 제목/진행 막대) */

export function EntryHeader({ back = true, title, progress, right, onBack }: { back?: boolean; title?: string; progress?: { step: number; total: number }; right?: ReactNode; onBack?: () => void }) {
  const nav = useNav();
  return (
    <div className={s.header}>
      <div className={s.headerLeft}>
        {back && (
          <button type="button" className={s.backCircle} aria-label="뒤로" onClick={onBack ?? (() => nav.back())}>
            <Icon name="back" size={24} />
          </button>
        )}
        {title && (
          <Text variant="title-3" as="h1">
            {title}
          </Text>
        )}
        {progress && <Progress {...progress} />}
      </div>
      {right}
    </div>
  );
}

export function Progress({ step, total }: { step: number; total: number }) {
  return (
    <div className={s.progress} role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={total} aria-label={`${total}단계 중 ${step}단계`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} data-on={i < step} />
      ))}
    </div>
  );
}

export function TextLink({ children, onPress, tone = 'secondary' }: { children: ReactNode; onPress?: () => void; tone?: 'secondary' | 'brand' | 'tertiary' }) {
  return (
    <button type="button" className={`${s.textLink} t-label`} data-tone={tone} onClick={onPress}>
      {children}
    </button>
  );
}

/** 큰 제목 + 설명 (Display 28/36 + Body) */
export function Hero({ title, desc }: { title: ReactNode; desc?: ReactNode }) {
  return (
    <div className={s.hero}>
      <Text variant="display" as="h2" className={s.heroTitle}>
        {title}
      </Text>
      {desc && (
        <Text variant="body" color="secondary" as="p">
          {desc}
        </Text>
      )}
    </div>
  );
}

/** 학교 행 (40 원형 이니셜 · 이름 · 소재지 · →) — 검색어 하이라이트 */
export function SchoolRow({ school, highlight, selected, onPress }: { school: School; highlight?: string; selected?: boolean; onPress: () => void }) {
  const name = school.name;
  const i = highlight ? name.indexOf(highlight) : -1;
  return (
    <button type="button" className={s.schoolRow} data-selected={selected} onClick={onPress}>
      <span className={`${s.initial} t-headline`} data-selected={selected}>
        {name.slice(0, 1)}
      </span>
      <span className={s.schoolMain}>
        <Text variant="headline" as="span" className="truncate" style={{ display: 'block' }}>
          {i >= 0 ? (
            <>
              {name.slice(0, i)}
              <span style={{ color: 'var(--wivu-color-text-brand)' }}>{name.slice(i, i + highlight!.length)}</span>
              {name.slice(i + highlight!.length)}
            </>
          ) : (
            name
          )}
        </Text>
        <Text variant="caption-2" color="secondary" as="span" style={{ display: 'block' }}>
          {school.location}
        </Text>
      </span>
      {selected && <Chip tone="brand" pill>가장 가까움</Chip>}
      <Icon name="arrow-right" size={20} color="primary" />
    </button>
  );
}

/** 고정 비율 일러스트 영역을 남은 높이에 맞춰 축소 (작은 폰 대응) */
export function FitBox({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width: w, height: h } = e.contentRect;
      setScale(Math.min(1.06, w / width, h / height));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);
  return (
    <div ref={ref} className={s.fitOuter}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width, height, transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: 'center' }}>{children}</div>
    </div>
  );
}
