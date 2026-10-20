import { useMemo, useRef } from 'react';
import { Button, Icon, IconButton, Screen, TabBar, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useIsSubmitted } from '@/screens/courses/store';
import { DOW_FULL, MONTHS, TODAY, parseIso } from './data';
import { dayAgenda, dotsOn, holidayOn, itemTarget, nextEvent, nextEventLabel, type AgendaItem, type Ctx } from './agenda';
import { useMyCourses, useSchedule } from './store';
import { AgendaList, BellButton, CategoryBadge, EmptyNote, MonthGrid, ScheduleHeader, SmallIconButton } from './parts';
import s from './Calendar.module.css';

/**
 * 시간표 탭 › 캘린더 — Figma v5 686:6385
 * 월간 달력(일정 점: 학사·과제·개인) + 선택일 일정(시간·분류 / 제목·장소) + 다가오는 일정 카드 한 장.
 * v4의 카테고리 필터 칩·카드 리스트·구분선은 v5에서 빠짐.
 */
export function CalendarScreen() {
  const nav = useNav();
  const courses = useMyCourses();
  const events = useSchedule((st) => st.events);
  const selected = useSchedule((st) => st.selectedDate);
  const month = useSchedule((st) => st.month);
  const selectDate = useSchedule((st) => st.selectDate);
  const setMonth = useSchedule((st) => st.setMonth);
  const isSubmitted = useIsSubmitted();
  const scrollRef = useRef<HTMLDivElement>(null);
  const ctx: Ctx = useMemo(() => ({ isSubmitted }), [isSubmitted]);

  const mi = MONTHS.indexOf(month);
  const [y, m] = month.split('-').map(Number);
  const sel = parseIso(selected);
  const agenda = useMemo(() => dayAgenda(selected, courses, events, ctx), [selected, courses, events, ctx]);
  const next = useMemo(() => nextEvent(events), [events]);

  const open = (it: Pick<AgendaItem, 'course' | 'event' | 'key'>) => {
    const t = itemTarget(it);
    if (t.kind === 'sheet') nav.tab(`${P.timetable}?sheet=${t.to}`);
    else nav.push(t.to);
  };
  const moveMonth = (d: number) => {
    const nm = MONTHS[mi + d];
    if (!nm) return;
    setMonth(nm);
    selectDate(nm === TODAY.slice(0, 7) ? TODAY : `${nm}-01`);
  };
  // 오늘이 선택돼 있으면 Figma 686:6717 기본값(10월 14일 수)으로, 다른 날을 골랐으면 그 날짜로 연다
  const newEvent = () => nav.modal(selected === TODAY ? P.calendarNew : `${P.calendarNew}?date=${selected}`);

  return (
    <Screen
      figma="686:6385"
      scrollRef={scrollRef}
      header={
        <ScheduleHeader
          tab="calendar"
          trailing={
            <>
              <IconButton icon="plus" label="일정 추가" onPress={newEvent} />
              <BellButton />
            </>
          }
        />
      }
      // 캘린더에서 '시간표' 탭(활성)을 누르면 시간표 그리드로 돌아간다
      footer={<TabBar active="timetable" onActivePress={() => nav.tab(P.timetable)} />}
    >
      <div className={s.page}>
        <div className={s.monthBar}>
          <Text variant="body-1-strong" as="h2" tnum aria-live="polite">
            {y}년 {m}월
          </Text>
          <div className={s.monthNav}>
            <SmallIconButton icon="back" label="이전 달" disabled={mi <= 0} onPress={() => moveMonth(-1)} />
            <SmallIconButton icon="chevron-right" label="다음 달" disabled={mi >= MONTHS.length - 1} onPress={() => moveMonth(1)} />
          </div>
        </div>

        <MonthGrid
          month={month}
          selected={selected}
          onSelect={selectDate}
          dots={(d) => dotsOn(d, events)}
          isHoliday={(d) => holidayOn(events, d)}
          canSelect={(d) => MONTHS.includes(d.slice(0, 7))}
        />

        <div className={s.dayHead}>
          <Text variant="body-2-strong" as="h2">
            {sel.getMonth() + 1}월 {sel.getDate()}일 {DOW_FULL[sel.getDay()]}
          </Text>
          <Text variant="caption-1" color="tertiary">
            일정 {agenda.length}
          </Text>
        </div>

        <AgendaList
          items={agenda}
          onPress={open}
          empty={
            <EmptyNote
              title="이날은 일정이 없어요"
              action={
                <Button variant="secondary" size="s" leadingIcon="plus" onClick={() => nav.modal(`${P.calendarNew}?date=${selected}`)}>
                  일정 추가
                </Button>
              }
            />
          }
        />

        {next && (
          <button type="button" className={s.nextCard} onClick={() => open({ event: next, key: next.id })} aria-label={`다가오는 일정 ${nextEventLabel(next)}`}>
            <CategoryBadge category={next.category} />
            <Text variant="body-3" className="truncate" style={{ flex: 1, minWidth: 0 }}>
              {nextEventLabel(next)}
            </Text>
            <Icon name="chevron-right" size={16} />
          </button>
        )}
      </div>
    </Screen>
  );
}
