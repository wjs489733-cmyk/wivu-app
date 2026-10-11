import { COURSES, SEMESTER, TOTAL_CREDITS, USER } from '@/data/core';
import { SYNC_COUNTS } from '@/screens/courses/data';

/* 진입 플로우 데이터 — Figma 352:1158 · 416:8372 · 416:12064 문구 기준
 * 학교 목록은 실제 대학 이름·소재지(시·구 단위)만 사용. 학사 정보 등 학교별 세부는 가상. */

export type Region = '서울' | '경기·인천' | '강원' | '대전·충청' | '광주·전라' | '대구·경북' | '부산·울산·경남' | '제주';
export type School = { name: string; location: string; region: Region; nearest?: boolean };

export const REGIONS: Region[] = ['서울', '경기·인천', '강원', '대전·충청', '광주·전라', '대구·경북', '부산·울산·경남', '제주'];
export const HOME_REGION: Region = '대구·경북';
export const HOME_LOCATION = '경산시 하양읍';
export const HOME_LOCATION_FULL = '경북 경산시 하양읍';

export const SCHOOLS: School[] = [
  // 대구·경북 — 학교 선택 '가까운 학교' (352:1158 순서)
  { name: '대구가톨릭대학교', location: '경북 경산시 하양읍', region: '대구·경북', nearest: true },
  { name: '영남대학교', location: '경북 경산시 대동', region: '대구·경북' },
  { name: '대구대학교', location: '경북 경산시 진량읍', region: '대구·경북' },
  { name: '경북대학교', location: '대구 북구', region: '대구·경북' },
  { name: '계명대학교', location: '대구 달서구', region: '대구·경북' },
  { name: '안동대학교', location: '경북 안동시', region: '대구·경북' },
  // 서울 — 학교 검색 '서울' 결과 (416:8372 순서)
  { name: '서울대학교', location: '서울 관악구', region: '서울' },
  { name: '서울시립대학교', location: '서울 동대문구', region: '서울' },
  { name: '서울과학기술대학교', location: '서울 노원구', region: '서울' },
  { name: '서울여자대학교', location: '서울 노원구', region: '서울' },
  { name: '서울교육대학교', location: '서울 서초구', region: '서울' },
  { name: '서울신학대학교', location: '경기 부천시', region: '서울' },
  // 다른 지역 (코드에서 보강 — 지역 칩·전국 검색용)
  { name: '인하대학교', location: '인천 미추홀구', region: '경기·인천' },
  { name: '인천대학교', location: '인천 연수구', region: '경기·인천' },
  { name: '아주대학교', location: '경기 수원시', region: '경기·인천' },
  { name: '경기대학교', location: '경기 수원시', region: '경기·인천' },
  { name: '강원대학교', location: '강원 춘천시', region: '강원' },
  { name: '한림대학교', location: '강원 춘천시', region: '강원' },
  { name: '강릉원주대학교', location: '강원 강릉시', region: '강원' },
  { name: '충남대학교', location: '대전 유성구', region: '대전·충청' },
  { name: '한밭대학교', location: '대전 유성구', region: '대전·충청' },
  { name: '충북대학교', location: '충북 청주시', region: '대전·충청' },
  { name: '공주대학교', location: '충남 공주시', region: '대전·충청' },
  { name: '전남대학교', location: '광주 북구', region: '광주·전라' },
  { name: '조선대학교', location: '광주 동구', region: '광주·전라' },
  { name: '전북대학교', location: '전북 전주시', region: '광주·전라' },
  { name: '부산대학교', location: '부산 금정구', region: '부산·울산·경남' },
  { name: '부경대학교', location: '부산 남구', region: '부산·울산·경남' },
  { name: '동아대학교', location: '부산 사하구', region: '부산·울산·경남' },
  { name: '울산대학교', location: '울산 남구', region: '부산·울산·경남' },
  { name: '경상국립대학교', location: '경남 진주시', region: '부산·울산·경남' },
  { name: '제주대학교', location: '제주 제주시', region: '제주' },
];

export const NEARBY = SCHOOLS.filter((s) => s.region === HOME_REGION);

/** 알림 설정 (411:12022) */
export const NOTI_OPTIONS = [
  { id: 'attendance', icon: 'nav-attendance' as const, title: '출석 시작 알림', meta: '수업 시작 10분 전 · 인증 마감 3분 전', on: true },
  { id: 'assignment', icon: 'assignment' as const, title: '과제 마감 알림', meta: '마감 하루 전 · 3시간 전', on: true },
  { id: 'notice', icon: 'notice' as const, title: '학사·장학 공지', meta: '수강정정, 장학, 학사 일정', on: true },
  { id: 'board', icon: 'user' as const, title: '게시판 활동', meta: '댓글 · 좋아요', on: false },
];

/** 연동 중 체크리스트 (411:11957) — 숫자는 실제 데이터에서 계산
 *  (과제 = 진행 중 과제 · 공지 = 이번 주 과목 공지 + 학사 공지, courses/data.ts SYNC_COUNTS) */
export const SYNC_STEPS = [
  { title: '학교 계정 인증', meta: (school: string) => `${school} · ${USER.studentId}` },
  { title: '수강 과목 불러오기', meta: () => `${SEMESTER} ${COURSES.length}과목 · ${TOTAL_CREDITS}학점` },
  { title: '시간표·과제·공지 동기화', meta: () => `과제 ${SYNC_COUNTS.assignments}건 · 공지 ${SYNC_COUNTS.notices}건 정리 중` },
  { title: '알림·퀵메뉴 준비', meta: () => '다음 단계에서 설정해요' },
];
