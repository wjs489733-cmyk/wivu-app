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

export const screens: ScreenDef[] = [
  { path: P.courses, element: <CoursesRoot />, title: '수강과목 탭', figma: ['392:7404'], section: S },
  { path: P.course(':id'), element: <CourseDetail />, title: '과목 상세', figma: ['398:7666'], section: S },
  { path: P.assignment(':id', ':aid'), element: <AssignmentDetail />, title: '과제 상세', figma: ['398:7694'], section: S },
  { path: P.assignmentSubmit(':id', ':aid'), element: <AssignmentSubmit />, title: '과제 제출', figma: ['398:7717'], section: S },
  { path: P.assignmentDone(':id', ':aid'), element: <AssignmentDone />, title: '제출 완료', figma: ['400:7849'], section: S },
  { path: P.courseNotice(':id', ':nid'), element: <NoticeDetail />, title: '공지 상세', figma: ['398:7759'], section: S },
  { path: P.courseMaterials(':id'), element: <Materials />, title: '강의자료', figma: ['398:7782'], section: S },
];
