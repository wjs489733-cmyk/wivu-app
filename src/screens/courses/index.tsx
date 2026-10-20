import type { ScreenDef } from '@/app/registry';
import { P } from '@/app/paths';
import { CoursesRoot } from './CoursesRoot';
import { CourseDetail } from './CourseDetail';
import { AssignmentDetail } from './AssignmentDetail';
import { AssignmentSubmit } from './AssignmentSubmit';
import { AssignmentDone } from './AssignmentDone';
import { NoticeDetail } from './NoticeDetail';
import { Materials } from './Materials';

const S = '수강과목';

/* Figma v5 '06 수강과목 (v5)' 684:5961 — 상태 프레임(시트·확인창)은 같은 라우트 안의 상태 */
export const screens: ScreenDef[] = [
  { path: P.courses, element: <CoursesRoot />, title: '수강과목 탭', figma: ['684:5962'], section: S },
  { path: P.course(':id'), element: <CourseDetail />, title: '과목 상세 (+ 과목 메뉴 시트 ?sheet=menu)', figma: ['684:6082', '702:8502'], section: S },
  { path: P.assignment(':id', ':aid'), element: <AssignmentDetail />, title: '과제 상세', figma: ['684:6198'], section: S },
  { path: P.assignmentSubmit(':id', ':aid'), element: <AssignmentSubmit />, title: '과제 제출 (+ 나가기 확인 ?dialog=leave)', figma: ['684:6271', '702:8653'], section: S },
  { path: P.assignmentDone(':id', ':aid'), element: <AssignmentDone />, title: '제출 완료', figma: ['684:6349'], section: S },
  { path: P.courseNotice(':id', ':nid'), element: <NoticeDetail />, title: '공지 상세', figma: ['684:6409'], section: S },
  { path: P.courseMaterials(':id'), element: <Materials />, title: '강의자료', figma: ['684:6453'], section: S },
];
