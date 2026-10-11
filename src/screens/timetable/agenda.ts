import { P } from '@/app/paths';
import { ATTENDANCE_WINDOW } from '@/data/core';
import {
  CAT,
  DOW,
  SEMESTER_END,
  SEMESTER_START,
  TODAY,
  dowOf,
  parseIso,
  shortDate,
  toMin,
  type CalEvent,
  type Category,
  type TTCourse,
} from './data';

/* 캘린더 계산 — 날짜별 일정·점·다가오는 일정 (순수 함수) */

export type Filter = 'all' | Category;

export type AgendaItem = {
  key: string;
  category: Category;
  time: string;
  sub?: string;
  title: string;
  meta: string;
  /** 정렬용 (분) */
  sort: number;
  event?: CalEvent;
  course?: TTCourse;
};

type Ctx = { submitted: boolean; attended: boolean };

const inSpan = (e: CalEvent, date: string) => (e.span ? date >= e.span[0] && date <= e.span[1] : e.date === date);
export const holidayOn = (events: CalEvent[], date: string) => events.some((e) => e.holiday && inSpan(e, date));

export function eventsOn(events: CalEvent[], date: string) {
  return events.filter((e) => inSpan(e, date));
}

/** 그날 수업 (학기 중 평일, 공휴일 제외) */
export function classesOn(courses: TTCourse[], events: CalEvent[], date: string) {
  if (date < SEMESTER_START || date > SEMESTER_END || holidayOn(events, date)) return [];
  const dow = dowOf(date);
  return courses.flatMap((c) => c.slots.filter((sl) => sl.day === dow).map((sl) => ({ course: c, slot: sl })));
}

export function eventMeta(e: CalEvent, ctx: Ctx) {
  if (e.id === 'a1') return `서비스디자인 · ${ctx.submitted ? '제출 완료' : '미제출'}`;
  if (e.meta) return e.meta;
  const time = e.allDay ? '하루 종일' : e.start ?? '';
  return [time, e.place].filter(Boolean).join(' · ') || CAT[e.category].detail;
}

function eventTime(e: CalEvent, date: string): { time: string; sub?: string; sort: number } {
  if (e.allDay) return { time: '종일', sort: -1 };
  if (e.span && date !== e.date) return { time: '종일', sort: -1 };
  if (e.start && e.end) return { time: e.start, sub: e.end, sort: toMin(e.start) };
  if (e.deadline && !e.start && e.end) return { time: e.end, sub: '마감', sort: toMin(e.end) };
  const t = e.start ?? e.end ?? '';
  return { time: t || '종일', sort: t ? toMin(t) : -1 };
}

/** 선택일 일정 (Figma 392:7540 '카드 · 선택일 일정') */
export function dayAgenda(date: string, courses: TTCourse[], events: CalEvent[], filter: Filter, ctx: Ctx): AgendaItem[] {
  const items: AgendaItem[] = [];
  if (filter === 'all' || filter === 'class') {
    for (const { course, slot } of classesOn(courses, events, date)) {
      const attendNote = date === TODAY && course.id === ATTENDANCE_WINDOW.courseId ? (ctx.attended ? ' · 출석 완료' : ' · 출석 가능') : '';
      items.push({
        key: `class-${course.id}-${slot.day}`,
        category: 'class',
        time: slot.start,
        sub: slot.end,
        title: course.name,
        meta: course.room + attendNote,
        sort: toMin(slot.start),
        course,
      });
    }
  }
  for (const e of eventsOn(events, date)) {
    if (filter !== 'all' && filter !== e.category) continue;
    const t = eventTime(e, date);
    items.push({ key: e.id, category: e.category, ...t, title: e.title, meta: eventMeta(e, ctx), event: e });
  }
  return items.sort((a, b) => a.sort - b.sort);
}

/** 달력 점 — 매주 반복되는 수업은 '수업' 필터일 때만 (Figma: 11일엔 과제 점만) */
export function dotsOn(date: string, courses: TTCourse[], events: CalEvent[], filter: Filter): Category[] {
  const cats = new Set<Category>();
  if (filter === 'class' && classesOn(courses, events, date).length) cats.add('class');
  for (const e of eventsOn(events, date)) if (filter === 'all' || filter === e.category) cats.add(e.category);
  return (['class', 'assignment', 'academic', 'personal'] as Category[]).filter((c) => cats.has(c)).slice(0, 3);
}

/** 다가오는 일정 — 오늘 이후, 수업 제외 */
export function upcoming(events: CalEvent[], filter: Filter, ctx: Ctx): AgendaItem[] {
  return events
    .filter((e) => e.date > TODAY && (filter === 'all' || filter === e.category))
    .sort((a, b) => (a.date === b.date ? toMin(a.start ?? a.end ?? '00:00') - toMin(b.start ?? b.end ?? '00:00') : a.date < b.date ? -1 : 1))
    .map((e) => ({
      key: e.id,
      category: e.category,
      time: shortDate(e.date),
      sub: DOW[parseIso(e.date).getDay()],
      title: e.title,
      meta: eventMeta(e, ctx),
      sort: 0,
      event: e,
    }));
}

/** 일정 행을 눌렀을 때 갈 곳 */
export function itemTarget(it: AgendaItem): { kind: 'push' | 'sheet'; to: string } {
  if (it.course) return it.course.core ? { kind: 'push', to: P.course(it.course.id) } : { kind: 'sheet', to: it.course.id };
  if (it.event?.to) return { kind: 'push', to: it.event.to };
  return { kind: 'push', to: P.calendarEvent(it.key) };
}
