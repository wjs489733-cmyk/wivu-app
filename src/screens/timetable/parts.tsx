import type { ReactNode } from 'react';
import { Chip, Icon, IconButton, LargeHeader, ListGroup, Text, TextTabs, type IconName } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useHasUnread } from '@/app/useUnread';
import { CAT, DOW, TODAY, iso, parseIso, type Category } from './data';
import type { AgendaItem } from './agenda';
import s from './Schedule.module.css';

/* 시간표 · 캘린더 섹션 로컬 부품 (공통화 후보: InfoBox, EventRow, MonthGrid) */

/* ── 탭 루트 헤더: '시간표 | 캘린더' + 우측 아이콘 ───────────── */
export function ScheduleHeader({ tab, trailing }: { tab: 'timetable' | 'calendar'; trailing: ReactNode }) {
  const nav = useNav();
  return (
    <LargeHeader
      title={
        <TextTabs
          items={[
            { value: 'timetable', label: '시간표' },
            { value: 'calendar', label: '캘린더' },
          ]}
          value={tab}
          onChange={(v) => v !== tab && nav.tab(v === 'calendar' ? P.calendar : P.timetable)}
        />
      }
      actions={trailing}
    />
  );
}

export function BellButton() {
  const nav = useNav();
  const unread = useHasUnread();
  return <IconButton icon="bell" label="알림함" dot={unread} onPress={() => nav.push(P.notifications)} />;
}

/* ── 정보 박스 (bg/subtle r16: 아이콘 · 라벨 · 값 · 칩) ─────── */
export function InfoBox({ children }: { children: ReactNode }) {
  return <div className={s.infoBox}>{children}</div>;
}
export function InfoRow({ icon, label, value, trailing }: { icon: IconName; label: string; value: ReactNode; trailing?: ReactNode }) {
  return (
    <div className={s.infoRow}>
      <Icon name={icon} size={20} color="primary" />
      <Text variant="caption-1" color="secondary" className={s.infoLabel}>
        {label}
      </Text>
      <Text variant="label" className={s.infoValue}>
        {value}
      </Text>
      {trailing}
    </div>
  );
}
/** 흰 pill '지도' 칩 */
export function MapChip({ onPress }: { onPress: () => void }) {
  return (
    <button type="button" className={`${s.mapChip} t-caption-2-strong`} onClick={onPress}>
      지도
    </button>
  );
}

/* ── 카테고리 칩 · 점 ─────────────────────────────────────── */
export function CategoryChip({ category, label }: { category: Category; label?: string }) {
  return <Chip tone={CAT[category].tone}>{label ?? CAT[category].label}</Chip>;
}
export function CatDot({ category, size = 6 }: { category: Category; size?: number }) {
  return <span className={s.catDot} style={{ width: size, height: size, background: CAT[category].color }} aria-hidden />;
}

/* ── 일정 행 (시간 · 컬러 바 · 제목/메타 · 카테고리 칩) ──────── */
export function EventList({ items, onPress, empty }: { items: AgendaItem[]; onPress: (it: AgendaItem) => void; empty?: ReactNode }) {
  if (!items.length) return <>{empty}</>;
  return (
    <ListGroup>
      {items.map((it) => (
        <button key={it.key} type="button" className={s.eventRow} onClick={() => onPress(it)}>
          <span className={s.eventTime}>
            <Text variant="caption-1-strong" tnum as="span">
              {it.time}
            </Text>
            {it.sub && (
              <Text variant="caption-2" color="tertiary" tnum as="span">
                {it.sub}
              </Text>
            )}
          </span>
          <span className={s.eventBar} style={{ background: CAT[it.category].color }} aria-hidden />
          <span className={s.eventMain}>
            <Text variant="subhead" as="span" className="truncate">
              {it.title}
            </Text>
            <Text variant="caption-2" color="secondary" as="span" className="truncate">
              {it.meta}
            </Text>
          </span>
          <CategoryChip category={it.category} />
        </button>
      ))}
    </ListGroup>
  );
}

/* ── 월간 달력 그리드 (캘린더 · 날짜 선택 시트 공통) ─────────── */
export function MonthGrid({
  month,
  selected,
  onSelect,
  dots,
  isHoliday,
  canSelect,
}: {
  month: string;
  selected: string;
  onSelect: (date: string) => void;
  dots?: (date: string) => Category[];
  isHoliday?: (date: string) => boolean;
  /** 달 밖 날짜 선택 허용 여부 */
  canSelect?: (date: string) => boolean;
}) {
  const first = parseIso(`${month}-01`);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const weeks = Math.ceil((first.getDay() + last.getDate()) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return iso(d);
  });
  return (
    <div className={s.month} role="grid" aria-label={`${first.getFullYear()}년 ${first.getMonth() + 1}월`}>
      <div className={s.monthHead} role="row">
        {DOW.map((d, i) => (
          <Text key={d} variant="caption-2-strong" color={i === 0 ? 'error' : 'tertiary'} align="center" role="columnheader">
            {d}
          </Text>
        ))}
      </div>
      <div className={s.monthBody}>
        {days.map((date, i) => {
          const out = date.slice(0, 7) !== month;
          const sun = i % 7 === 0;
          const red = !out && (sun || isHoliday?.(date));
          const on = date === selected;
          const ds = out ? [] : dots?.(date) ?? [];
          const disabled = out && !(canSelect?.(date) ?? false);
          return (
            <button
              key={date}
              type="button"
              role="gridcell"
              className={s.dayCell}
              aria-selected={on}
              aria-label={`${parseIso(date).getMonth() + 1}월 ${parseIso(date).getDate()}일${date === TODAY ? ' 오늘' : ''}${ds.length ? ` 일정 ${ds.map((c) => CAT[c].label).join('·')}` : ''}`}
              data-out={out}
              data-red={red}
              data-today={date === TODAY}
              disabled={disabled}
              onClick={() => onSelect(date)}
            >
              <span className={`${s.dayNum} ${on || date === TODAY ? 't-label' : 't-callout'} tnum`}>{parseIso(date).getDate()}</span>
              <span className={s.dayDots}>
                {ds.map((c) => (
                  <CatDot key={c} category={c} size={5} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── 20 아이콘 버튼 (달 이동 등, 터치 44) ───────────────────── */
export function SmallIconButton({ icon, label, onPress, flip, disabled }: { icon: IconName; label: string; onPress: () => void; flip?: boolean; disabled?: boolean }) {
  return (
    <button type="button" className={s.smallIconBtn} aria-label={label} onClick={onPress} disabled={disabled}>
      <Icon name={icon} size={20} style={flip ? { transform: 'scaleX(-1)' } : undefined} />
    </button>
  );
}

/* ── 빈 상태 ──────────────────────────────────────────────── */
export function EmptyNote({ icon, title, desc, action }: { icon: IconName; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className={s.empty}>
      <span className={s.emptyIcon}>
        <Icon name={icon} size={24} color="secondary" />
      </span>
      <Text variant="subhead" as="p">
        {title}
      </Text>
      {desc && (
        <Text variant="caption-1" color="tertiary" as="p" align="center">
          {desc}
        </Text>
      )}
      {action}
    </div>
  );
}
