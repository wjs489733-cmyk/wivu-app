import { P } from '@/app/paths';
import { courseById } from '@/data/core';
import {
  CAT,
  SEMESTER_END,
  SEMESTER_START,
  TODAY,
  dday,
  dotDate,
  dowOf,
  toMin,
  type CalEvent,
  type Category,
  type TTCourse,
} from './data';

/* 캘린더 계산 — 날짜별 일정·점·다가오는 일정 (순수 함수) */

export type AgendaItem = {
  key: string;
  category: Category;
  /** 왼쪽 시간 열: '10:00' · '종일' */
  time: string;
  title: string;
  meta: string;
  /** 메타를 빨강으로 (오늘 마감 미제출) */
  metaError?: boolean;
  /** 정렬용 (분) */
  sort: number;
  event?: CalEvent;
  course?: TTCourse;
};

export type Ctx = {
  /** 과제 제출 여부 — 수강과목 스토어(courses/store useIsSubmitted)와 같은 판정 */
  isSubmitted: (courseId: string, aid: string) => boolean;
};

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

/** 과제 일정 상태: 제출 완료 / 미제출(오늘·지난 마감) / null(아직 여유) */
export function assignmentStatus(e: CalEvent, ctx: Ctx): '제출 완료' | '미제출' | null {
  if (e.category !== 'assignment' || !e.courseId || !e.aid) return null;
  if (ctx.isSubmitted(e.courseId, e.aid)) return '제출 완료';
  return e.date <= TODAY ? '미제출' : null;
}

/** 목록 메타 — 과제: '서비스디자인 · 미제출'(Figma 686:6385) / 여유 있으면 'D-6' · 그 밖: 장소 */
export function eventMeta(e: CalEvent, ctx: Ctx): { text: string; error?: boolean } {
  if (e.category === 'assignment' && e.courseId && e.aid) {
    const st = assignmentStatus(e, ctx);
    return { text: `${courseById(e.courseId).name} · ${st ?? dday(e.date)}`, error: st === '미제출' };
  }
  if (e.meta) return { text: e.meta };
  if (e.place) return { text: e.place };
  return { text: e.allDay ? '하루 종일' : CAT[e.category].detail };
}

function eventTime(e: CalEvent, date: string): { time: string; sort: number } {
  if (e.allDay || (e.span && date !== e.date)) return { time: '종일', sort: -1 };
  const t = e.start ?? e.end;
  return t ? { time: t, sort: toMin(t) } : { time: '종일', sort: -1 };
}

/** 선택일 일정 (Figma 686:6385: 시간 + 분류 / 제목 + 장소) — 수업 + 일정, 시간순 */
export function dayAgenda(date: string, courses: TTCourse[], events: CalEvent[], ctx: Ctx): AgendaItem[] {
  const items: AgendaItem[] = [];
  for (const { course, slot } of classesOn(courses, events, date)) {
    items.push({ key: `class-${course.id}-${slot.day}`, category: 'class', time: slot.start, title: course.name, meta: course.room, sort: toMin(slot.start), course });
  }
  for (const e of eventsOn(events, date)) {
    const m = eventMeta(e, ctx);
    items.push({ key: e.id, category: e.category, ...eventTime(e, date), title: e.title, meta: m.text, metaError: m.error, event: e });
  }
  return items.sort((a, b) => a.sort - b.sort);
}

/** 달력 점 — 매주 반복되는 수업은 찍지 않는다 (Figma 686:6385: 학사 · 과제 · 개인만) */
export function dotsOn(date: string, events: CalEvent[]): Category[] {
  const cats = new Set<Category>();
  for (const e of eventsOn(events, date)) cats.add(e.category);
  return (['academic', 'assignment', 'personal'] as Category[]).filter((c) => cats.has(c)).slice(0, 3);
}

/** 다가오는 일정 — 오늘 이후 첫 일정 (수업 제외) */
export function nextEvent(events: CalEvent[]): CalEvent | null {
  const list = events
    .filter((e) => e.date > TODAY)
    .sort((a, b) => (a.date === b.date ? toMin(a.start ?? a.end ?? '00:00') - toMin(b.start ?? b.end ?? '00:00') : a.date < b.date ? -1 : 1));
  return list[0] ?? null;
}

/** 다가오는 일정 카드 문구: '10.12 (월) 교내 취업박람회 · 14:00' */
export function nextEventLabel(e: CalEvent) {
  const time = e.allDay ? '하루 종일' : e.start ?? e.end;
  return `${dotDate(e.date)} ${e.short ?? e.title}${time ? ` · ${time}` : ''}`;
}

/** 일정 행을 눌렀을 때 갈 곳 */
export function itemTarget(it: Pick<AgendaItem, 'course' | 'event' | 'key'>): { kind: 'push' | 'sheet'; to: string } {
  if (it.course) return it.course.core ? { kind: 'push', to: P.course(it.course.id) } : { kind: 'sheet', to: it.course.id };
  if (it.event?.to) return { kind: 'push', to: it.event.to };
  return { kind: 'push', to: P.calendarEvent(it.key) };
}
