import type { ReactNode } from 'react';
import { Chip, Icon, IconButton, LargeHeader, Text, TextTabs, type IconName } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useHasUnread } from '@/app/useUnread';
import { CAT, DOW, TODAY, iso, parseIso, type Category } from './data';
import type { AgendaItem } from './agenda';
import s from './Schedule.module.css';

/* 시간표 · 캘린더 섹션 로컬 부품 (공통화 후보: InfoBox, AgendaList, MonthGrid, RemoveBadge) */

/* ── 탭 루트 헤더: '시간표 | 캘린더' + 우측 아이콘 (Figma 685:6192 · 686:6385) ── */
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

/* ── 정보 박스 v5 (bg/subtle r16 p16 · 행 간격 10 · 라벨 Body 3 tertiary 36 / 값 Body 3 Strong) ──
 * Figma 685:6329 · 686:6658 · 697:7572 기준. 697:7430(r12 · 라벨 secondary 44)만 달라 이쪽으로 통일 */
export function InfoBox({ children }: { children: ReactNode }) {
  return <div className={s.infoBox}>{children}</div>;
}
export function InfoRow({ label, value, trailing }: { label: string; value: ReactNode; trailing?: ReactNode }) {
  return (
    <div className={s.infoRow}>
      <Text variant="body-3" color="tertiary" className={s.infoLabel}>
        {label}
      </Text>
      <Text variant="body-3-strong" className={s.infoValue}>
        {value}
      </Text>
      {trailing}
    </div>
  );
}
/** 정보 행 끝의 '지도' 글자 링크 (Caption 1 Strong brand) */
export function MapLink({ onPress }: { onPress: () => void }) {
  return (
    <button type="button" className={`${s.mapLink} t-caption-1-strong`} onClick={onPress} aria-label="강의실 지도에서 보기">
      지도
    </button>
  );
}

/* ── 카테고리 배지 (v5 Badge) ─────────────────────────────── */
export function CategoryBadge({ category, label }: { category: Category; label?: string }) {
  return <Chip tone={CAT[category].tone}>{label ?? CAT[category].label}</Chip>;
}

/* ── 선택일 일정 목록 v5 (Figma 686:6385: 시간 40 · 분류 / 제목 Body 2 Strong · 메타 Caption 1, 구분선 없음) ── */
export function AgendaList({ items, onPress, empty }: { items: AgendaItem[]; onPress: (it: AgendaItem) => void; empty?: ReactNode }) {
  if (!items.length) return <>{empty}</>;
  return (
    <div className={s.agenda}>
      {items.map((it) => (
        <button key={it.key} type="button" className={s.agendaRow} onClick={() => onPress(it)}>
          <span className={s.agendaTime}>
            <Text variant="caption-1-strong" tnum as="span">
              {it.time}
            </Text>
            <Text variant="caption-2" color="tertiary" as="span">
              {CAT[it.category].label}
            </Text>
          </span>
          <span className={s.agendaMain}>
            <Text variant="body-2-strong" as="span" className="truncate">
              {it.title}
            </Text>
            <Text variant="caption-1" color={it.metaError ? 'error' : 'tertiary'} as="span" className="truncate">
              {it.meta}
            </Text>
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── 월간 달력 그리드 ───────────────────────────────────────
 * variant 'calendar' (Figma 686:6385): 칸 50×47 · 숫자 원 30 · Body 3 · 일요일·공휴일 빨강 · 일정 점 4
 * variant 'picker'   (Figma 697:7703): 칸 50×44 · 숫자 원 38 · Body 2 · 점 없음 */
export function MonthGrid({
  month,
  selected,
  onSelect,
  dots,
  isHoliday,
  canSelect,
  variant = 'calendar',
}: {
  month: string;
  selected: string;
  onSelect: (date: string) => void;
  dots?: (date: string) => Category[];
  isHoliday?: (date: string) => boolean;
  /** 달 밖 날짜 선택 허용 여부 */
  canSelect?: (date: string) => boolean;
  variant?: 'calendar' | 'picker';
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
  const picker = variant === 'picker';
  return (
    <div className={s.month} data-variant={variant} role="grid" aria-label={`${first.getFullYear()}년 ${first.getMonth() + 1}월`}>
      <div className={s.monthHead} role="row">
        {DOW.map((d, i) => (
          <Text key={d} variant={picker ? 'caption-1' : 'caption-2'} color={!picker && i === 0 ? 'error' : 'tertiary'} align="center" role="columnheader">
            {d}
          </Text>
        ))}
      </div>
      <div className={s.monthBody}>
        {days.map((date, i) => {
          const out = date.slice(0, 7) !== month;
          const red = !picker && !out && (i % 7 === 0 || !!isHoliday?.(date));
          const on = date === selected;
          const ds = out ? [] : dots?.(date) ?? [];
          const disabled = out && !(canSelect?.(date) ?? false);
          const strong = on || (!picker && date === TODAY);
          const d = parseIso(date);
          return (
            <button
              key={date}
              type="button"
              role="gridcell"
              className={s.dayCell}
              aria-selected={on}
              aria-label={`${d.getMonth() + 1}월 ${d.getDate()}일${date === TODAY ? ' 오늘' : ''}${ds.length ? ` 일정 ${ds.map((c) => CAT[c].label).join('·')}` : ''}`}
              data-out={out}
              data-red={red}
              data-today={!picker && date === TODAY}
              disabled={disabled}
              onClick={() => onSelect(date)}
            >
              <span className={`${s.dayNum} ${picker ? (strong ? 't-body-2-strong' : 't-body-2') : strong ? 't-body-3-strong' : 't-body-3'} tnum`}>{d.getDate()}</span>
              {!picker && (
                <span className={s.dayDots}>
                  {ds.map((c) => (
                    <span key={c} className={s.dot} style={{ background: CAT[c].color }} aria-hidden />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── 20 아이콘 버튼 (달 이동 등, 터치 44) ───────────────────── */
export function SmallIconButton({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <button type="button" className={s.smallIconBtn} aria-label={label} onClick={onPress} disabled={disabled}>
      <Icon name={icon} size={20} />
    </button>
  );
}

/* ── 빈 상태 (텍스트 + 기본 버튼만) ─────────────────────────── */
export function EmptyNote({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className={s.empty}>
      <Text variant="body-2-strong" as="p">
        {title}
      </Text>
      {desc && (
        <Text variant="caption-1" color="tertiary" as="p">
          {desc}
        </Text>
      )}
      {action}
    </div>
  );
}

/* ── 빨간 '−' 빼기 배지 (Figma 697:7142: 18 원 · status/error · 흰 테두리 · 8×2 막대) ── */
export function RemoveBadge({ label, onPress, className }: { label: string; onPress: () => void; className?: string }) {
  return (
    <button
      type="button"
      className={`${s.removeBadge} ${className ?? ''}`}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onPress();
      }}
    >
      <span className={s.removeDot} aria-hidden>
        <span className={s.removeBar} />
      </span>
    </button>
  );
}
