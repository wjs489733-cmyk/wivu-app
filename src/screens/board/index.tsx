import type { ScreenDef } from '@/app/registry';
import { P } from '@/app/paths';
import { BoardRoot } from './BoardRoot';
import { BoardFeed } from './BoardFeed';
import { PostDetail } from './PostDetail';
import { BoardWrite } from './BoardWrite';

const S = '게시판';

/**
 * 게시판 섹션 — Figma v5 '09 게시판 (v5)'. 시트·확인창·토스트·검색은 각 라우트 안의 상태.
 * - P.boardCourse(':id')는 수업 게시판(과목 id)과 학교 게시판(free·info·team·dept + 경로만 남긴 market·lost)을 같은 피드로 연다.
 *   학교 게시판은 Figma 프레임이 없어 수업 게시판 피드(687:6661) 레이아웃을 재사용.
 * - P.boardPost(':pid'): 내 글 687:6783(+ 글 메뉴 698:7353 · 삭제 확인 698:7493) / 다른 사람 글 698:7597(+ 신고 698:7691 · 차단 확인 698:7865)
 * - P.boardWrite: 새 글 · ?edit=<pid> 수정 (같은 프레임 687:6877)
 */
export const screens: ScreenDef[] = [
  { path: P.board, element: <BoardRoot />, title: '게시판 탭', figma: ['687:6491', '699:7758', '699:7595', '699:7948', '699:8103'], section: S },
  { path: P.boardCourse(':id'), element: <BoardFeed />, title: '게시판 · 피드 (수업/학교 게시판)', figma: ['687:6661'], section: S },
  { path: P.boardPost(':pid'), element: <PostDetail />, title: '게시판 · 게시글 상세', figma: ['687:6783', '698:7353', '698:7493', '698:7597', '698:7691', '698:7865'], section: S },
  { path: P.boardWrite, element: <BoardWrite />, title: '게시판 · 글쓰기', figma: ['687:6877', '699:8284', '699:8424', '699:8550'], section: S },
];
