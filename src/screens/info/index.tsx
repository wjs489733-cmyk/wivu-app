import { useParams } from 'react-router';
import type { ScreenDef } from '@/app/registry';
import { P } from '@/app/paths';
import { Notifications } from './Notifications';
import { Meal } from './Meal';
import { AcademicNotice } from './AcademicNotice';
import { CampusMap } from './CampusMap';
import { NoticeList } from './NoticeList';

const S = '홈 › 알림·정보';

/** 공지 id가 바뀌면 화면 상태(로딩 등)를 새로 */
function NoticeRoute() {
  const { id } = useParams();
  return <AcademicNotice key={id} />;
}

/* v5 (UXUI 디자인 (v5 · 피드백 반영)) 프레임 — 상태 프레임은 같은 라우트 안의 상태 */
export const screens: ScreenDef[] = [
  // 알림함 681:5798 · 모두 읽음(점 사라짐 + 토스트) 701:8991
  { path: P.notifications, element: <Notifications />, title: '알림함', figma: ['681:5798', '701:8991'], section: S },
  { path: P.meal, element: <Meal />, title: '오늘의 학식', figma: ['681:5684'], section: S },
  { path: P.notices, element: <NoticeList />, title: '학사 공지', figma: ['688:6810'], section: S },
  { path: P.academicNotice(':id'), element: <NoticeRoute />, title: '학사 공지 상세', figma: ['688:6925'], section: S },
  // 강의실 지도 688:6715 → 길 안내 중 702:8726 (2.5초) → 도착 702:8831
  { path: P.campusMap, element: <CampusMap />, title: '강의실 지도', figma: ['688:6715', '702:8726', '702:8831'], section: S },
];
