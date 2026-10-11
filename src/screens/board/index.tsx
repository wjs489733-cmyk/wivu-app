import type { ScreenDef } from '@/app/registry';
import { P } from '@/app/paths';
import { BoardRoot } from './BoardRoot';
import { BoardFeed } from './BoardFeed';
import { PostDetail } from './PostDetail';
import { BoardWrite } from './BoardWrite';

const S = '게시판';

/**
 * 게시판 섹션
 * - P.boardCourse(':id')는 수업 게시판(과목 id)과 '전체 게시판' 6종(free·info·team·dept·market·lost)을 같은 피드 화면으로 연다.
 *   전체 게시판은 Figma 프레임이 없어 수업 게시판 피드(419:8518) 레이아웃을 재사용.
 */
export const screens: ScreenDef[] = [
  { path: P.board, element: <BoardRoot />, title: '게시판 탭', figma: ['418:8600'], section: S },
  { path: P.boardCourse(':id'), element: <BoardFeed />, title: '게시판 · 피드 (수업/전체 게시판)', figma: ['419:8518'], section: S },
  { path: P.boardPost(':pid'), element: <PostDetail />, title: '게시판 · 게시글 상세', figma: ['420:8564'], section: S },
  { path: P.boardWrite, element: <BoardWrite />, title: '게시판 · 글쓰기', figma: ['420:8691'], section: S },
];
