import { useMemo, useRef, useState } from 'react';
import { Button, Chip, IconButton, MoreLink, Screen, SectionDivider, TabBar, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { useIsSubmitted } from '@/screens/courses/store';
import { CAT, CATEGORIES, DOW_FULL, MONTHS, TODAY, parseIso } from './data';
import { dayAgenda, dotsOn, holidayOn, itemTarget, upcoming, type AgendaItem, type Ctx, type Filter } from './agenda';
import { useMyCourses, useSchedule } from './store';
import { BellButton, CatDot, EmptyNote, EventList, MonthGrid, ScheduleHeader, SmallIconButton } from './parts';
import s from './Calendar.module.css';

/**
 * 시간표 탭 › 캘린더 — Figma 392:7540 (Schedule_v4_05_Calendar)
 * 월간 달력(일정 점) + 선택일 일정 + 다가오는 일정. 필터 칩으로 카테고리 거르기.
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
  const attended = useApp((st) => st.attendanceComplete);
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const ctx: Ctx = useMemo(() => ({ attended, isSubmitted }), [attended, isSubmitted]);

  const mi = MONTHS.indexOf(month);
  const [y, m] = month.split('-').map(Number);
  const sel = parseIso(selected);
  const agenda = useMemo(() => dayAgenda(selected, courses, events, filter, ctx), [selected, courses, events, filter, ctx]);
  const next = useMemo(() => upcoming(events, filter, ctx), [events, filter, ctx]);
  const shownNext = expanded ? next : next.slice(0, 3);

  const open = (it: AgendaItem) => {
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

  return (
    <Screen
      figma="392:7540"
      scrollRef={scrollRef}
      header={
        <ScheduleHeader
          tab="calendar"
          trailing={
            <>
              <IconButton icon="plus" label="일정 추가" onPress={() => nav.modal(`${P.calendarNew}?date=${selected}`)} />
              <BellButton />
            </>
          }
        />
      }
      // 캘린더에서 '시간표' 탭(활성)을 누르면 시간표 그리드로 돌아간다
      footer={<TabBar active="timetable" onActivePress={() => nav.tab(P.timetable)} />}
    >
      <div className={s.monthBar}>
        <Text variant="title-2" as="h2" tnum aria-live="polite">
          {y}년 {m}월
        </Text>
        <div className={s.monthNav}>
          <SmallIconButton icon="chevron-right" flip label="이전 달" disabled={mi <= 0} onPress={() => moveMonth(-1)} />
          <SmallIconButton icon="chevron-right" label="다음 달" disabled={mi >= MONTHS.length - 1} onPress={() => moveMonth(1)} />
        </div>
      </div>

      <div className={s.filters} role="tablist" aria-label="일정 구분">
        <Chip size="m" pill tone="neutral" selected={filter === 'all'} onSelect={() => setFilter('all')}>
          전체
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c} size="m" pill tone="neutral" selected={filter === c} onSelect={() => setFilter(c)} className={s.catChip}>
            <CatDot category={c} />
            {CAT[c].label}
          </Chip>
        ))}
      </div>

      <div className={s.monthCard}>
        <MonthGrid
          month={month}
          selected={selected}
          onSelect={selectDate}
          dots={(d) => dotsOn(d, courses, events, filter)}
          isHoliday={(d) => holidayOn(events, d)}
          canSelect={(d) => MONTHS.includes(d.slice(0, 7))}
        />
      </div>

      <SectionDivider />

      <section className={s.section}>
        <div className={s.dayHead}>
          <div className={s.dayTitle}>
            <Text variant="title-2" as="h2">
              {sel.getMonth() + 1}월 {sel.getDate()}일 {DOW_FULL[sel.getDay()]}
            </Text>
            {selected === TODAY && (
              <span className={`${s.todayChip} t-micro`} aria-label="오늘">
                오늘
              </span>
            )}
          </div>
          <Text variant="caption-1" color="tertiary">
            일정 {agenda.length}개
          </Text>
        </div>
        <div className={s.body}>
          <EventList
            items={agenda}
            onPress={open}
            empty={
              <EmptyNote
                icon="calendar"
                title={filter === 'all' ? '이날은 일정이 없어요' : `이날은 ${CAT[filter].label} 일정이 없어요`}
                desc="일정을 추가하면 알림으로 챙겨 드려요"
                action={
                  <Button variant="soft" size="m" leadingIcon="plus" onClick={() => nav.modal(`${P.calendarNew}?date=${selected}`)}>
                    일정 추가
                  </Button>
                }
              />
            }
          />
        </div>
      </section>

      <SectionDivider />

      <section className={s.section}>
        <div className={s.dayHead}>
          <Text variant="title-2" as="h2">
            다가오는 일정
          </Text>
          {next.length > 3 && <MoreLink label={expanded ? '접기' : '목록 보기'} onPress={() => setExpanded((v) => !v)} />}
        </div>
        <div className={s.body}>
          <EventList items={shownNext} onPress={open} empty={<EmptyNote icon="calendar" title="다가오는 일정이 없어요" />} />
        </div>
      </section>
    </Screen>
  );
}
