import type { ScreenDef } from '@/app/registry';
import { P } from '@/app/paths';
import { TimetableScreen } from './TimetableScreen';
import { TimetableAdd } from './TimetableAdd';
import { CalendarScreen } from './CalendarScreen';
import { EventDetail } from './EventDetail';
import { EventNew } from './EventNew';

/* Figma v5 페이지 'UXUI 디자인 (v5 · 피드백 반영)' — 07 시간표 (v5) · 08 캘린더 (v5) */
export const screens: ScreenDef[] = [
  {
    path: P.timetable,
    element: <TimetableScreen />,
    title: '시간표 (+ 수업 상세 시트 ?sheet=service-design · 편집 모드 ?edit=1 · 빼기 확인)',
    figma: ['685:6192', '685:6329', '697:7142', '697:7306'],
    section: '시간표',
  },
  { path: P.timetableAdd, element: <TimetableAdd />, title: '수업 추가 · 검색(?q=UX) / 수업 정보 시트 / 추가 완료', figma: ['685:6485', '697:7430', '685:6621'], section: '시간표' },
  { path: P.calendar, element: <CalendarScreen />, title: '캘린더', figma: ['686:6385'], section: '시간표 › 캘린더' },
  { path: P.calendarEvent(':id'), element: <EventDetail />, title: '일정 상세 (학사 e1 · 내 일정 · 삭제 확인)', figma: ['686:6658', '697:7572', '697:7639'], section: '시간표 › 캘린더' },
  { path: P.calendarNew, element: <EventNew />, title: '일정 추가 (+ 날짜 선택 시트)', figma: ['686:6717', '697:7703'], section: '시간표 › 캘린더' },
];
