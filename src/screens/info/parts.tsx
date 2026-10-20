import { Button, Chip } from '@/ui';
import type { AcademicNotice } from './data';
import s from './Info.module.css';

/** 공지 배지 — v5 Badge: 학사 = Brand · 장학/행사 = Neutral · 중요 = Error (688:6810 · 688:6925) */
export function NoticeBadges({ n }: { n: AcademicNotice }) {
  return (
    <>
      <Chip tone={n.category === '학사' ? 'brand' : 'neutral'}>{n.category}</Chip>
      {n.important && <Chip tone="dangerSoft">중요</Chip>}
    </>
  );
}

/* ────────────────────────────────────────────────────────────
 * 알림·정보 섹션 로컬 컴포넌트 (공통화 후보)
 * ──────────────────────────────────────────────────────────── */

/**
 * 밑줄 탭 — v5 681:5684 '식당' 탭: 선택 Body 2 Strong + 2px text/primary 밑줄,
 * 나머지 Body 2 tertiary, 탭 사이 20, 아래 1px border/default
 */
export function LineTabs<T extends string>({ items, value, onChange, label }: { items: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className={s.lineTabs} role="tablist" aria-label={label}>
      {items.map((it) => {
        const on = it.value === value;
        return (
          <button key={it.value} type="button" role="tab" aria-selected={on} className={`${s.lineTab} ${on ? 't-body-2-strong' : 't-body-2'}`} onClick={() => onChange(it.value)}>
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 필터 줄 — v5 681:5798 · 688:6810: v5 Button S(36 pill), 선택 = Primary · 나머지 = Secondary, 사이 8
 */
export function FilterRow<T extends string>({ items, value, onChange, label }: { items: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className={s.filters} role="toolbar" aria-label={label}>
      {items.map((it) => (
        <Button key={it.value} size="s" variant={it.value === value ? 'primary' : 'secondary'} aria-pressed={it.value === value} onClick={() => onChange(it.value)} className={s.filter}>
          {it.label}
        </Button>
      ))}
    </div>
  );
}
