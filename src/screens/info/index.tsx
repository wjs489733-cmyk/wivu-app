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

export const screens: ScreenDef[] = [
  { path: P.notifications, element: <Notifications />, title: '알림함', figma: ['428:8938'], section: S },
  { path: P.meal, element: <Meal />, title: '학식', figma: ['429:8987'], section: S },
  // 학사 공지 목록 — 코드 추가 화면(Figma 프레임 없음): 홈 '공지 전체' · 마이 '공지사항'에서 진입
  { path: P.notices, element: <NoticeList />, title: '학사 공지', figma: [], section: S },
  { path: P.academicNotice(':id'), element: <NoticeRoute />, title: '학사 공지 상세', figma: ['430:9007'], section: S },
  { path: P.campusMap, element: <CampusMap />, title: '강의실 지도', figma: ['431:9033'], section: S },
];
