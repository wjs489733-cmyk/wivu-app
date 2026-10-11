import type { ScreenDef } from '@/app/registry';
import { P } from '@/app/paths';
import { TimetableScreen } from './TimetableScreen';
import { TimetableAdd } from './TimetableAdd';
import { CalendarScreen } from './CalendarScreen';
import { EventDetail } from './EventDetail';
import { EventNew } from './EventNew';

export const screens: ScreenDef[] = [
  { path: P.timetable, element: <TimetableScreen />, title: '시간표 (+ 수업 상세 시트 ?sheet=service-design)', figma: ['392:7472', '402:7846'], section: '시간표' },
  { path: P.timetableAdd, element: <TimetableAdd />, title: '수업 추가 · 검색 / 추가 완료', figma: ['403:7931', '403:8007'], section: '시간표' },
  { path: P.calendar, element: <CalendarScreen />, title: '캘린더', figma: ['392:7540'], section: '시간표 › 캘린더' },
  { path: P.calendarEvent(':id'), element: <EventDetail />, title: '일정 상세', figma: ['404:7979'], section: '시간표 › 캘린더' },
  { path: P.calendarNew, element: <EventNew />, title: '일정 추가', figma: ['405:8022'], section: '시간표 › 캘린더' },
];
