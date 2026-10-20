import { COURSES, SEMESTER, TOTAL_CREDITS, USER } from '@/data/core';
import { SYNC_COUNTS } from '@/screens/courses/data';

/* 진입 플로우 데이터 — Figma v5 '01 진입 · 로그인 (v5)' 문구 기준
 * 학교 목록은 실제 대학 이름·소재지(시·구 단위)만 사용. 거리(km)는 '현재 위치' 기준 가상 값(667:4592). */

export type School = { name: string; location: string; /** 현재 위치에서의 거리 — 주변 대학교만 */ km?: number };

/** 대학교 검색 시트 '현재 위치' (667:4592) */
export const HOME_LOCATION = '경북 경산시 하양읍';

export const SCHOOLS: School[] = [
  // 주변 대학교 — 667:4592 (거리는 Figma 값 그대로)
  { name: '대구가톨릭대학교', location: '경북 경산시 하양읍', km: 0.4 },
  { name: '경일대학교', location: '경북 경산시 하양읍', km: 1.2 },
  { name: '대구대학교', location: '경북 경산시 진량읍', km: 7.2 },
  { name: '영남대학교', location: '경북 경산시 대동', km: 9.8 },
  { name: '대구한의대학교', location: '경북 경산시 유곡동', km: 11 },
  { name: '경북대학교', location: '대구 북구', km: 24 },
  { name: '계명대학교', location: '대구 달서구', km: 31 },
  { name: '안동대학교', location: '경북 안동시', km: 96 },
  // 그 밖 — 검색으로만 (코드에서 보강)
  { name: '서울대학교', location: '서울 관악구' },
  { name: '서울시립대학교', location: '서울 동대문구' },
  { name: '서울과학기술대학교', location: '서울 노원구' },
  { name: '서울여자대학교', location: '서울 노원구' },
  { name: '서울교육대학교', location: '서울 서초구' },
  { name: '인하대학교', location: '인천 미추홀구' },
  { name: '인천대학교', location: '인천 연수구' },
  { name: '아주대학교', location: '경기 수원시' },
  { name: '경기대학교', location: '경기 수원시' },
  { name: '강원대학교', location: '강원 춘천시' },
  { name: '한림대학교', location: '강원 춘천시' },
  { name: '강릉원주대학교', location: '강원 강릉시' },
  { name: '충남대학교', location: '대전 유성구' },
  { name: '한밭대학교', location: '대전 유성구' },
  { name: '충북대학교', location: '충북 청주시' },
  { name: '공주대학교', location: '충남 공주시' },
  { name: '전남대학교', location: '광주 북구' },
  { name: '조선대학교', location: '광주 동구' },
  { name: '전북대학교', location: '전북 전주시' },
  { name: '부산대학교', location: '부산 금정구' },
  { name: '부경대학교', location: '부산 남구' },
  { name: '동아대학교', location: '부산 사하구' },
  { name: '울산대학교', location: '울산 남구' },
  { name: '경상국립대학교', location: '경남 진주시' },
  { name: '제주대학교', location: '제주 제주시' },
];

export const NEARBY = SCHOOLS.filter((sc) => sc.km !== undefined);
/** '가장 가까움' 배지 */
export const NEAREST = NEARBY.reduce((a, b) => ((b.km ?? Infinity) < (a.km ?? Infinity) ? b : a)).name;

/** 정보 불러오는 중 (669:4806) 단계 — 보조 문구는 진행 중인 단계에서만 보인다. 숫자는 실제 데이터에서 계산
 *  (과제 = 진행 중 과제 · 공지 = 이번 주 과목 공지 + 학사 공지, courses/data.ts SYNC_COUNTS) */
export const LOAD_STEPS = [
  { title: '학교 계정 인증', sub: (school: string) => `${school} · ${USER.studentId}` },
  { title: '수강 과목 불러오기', sub: () => `${SEMESTER} ${COURSES.length}과목 · ${TOTAL_CREDITS}학점` },
  { title: '시간표·과제·공지 동기화', sub: () => `과제 ${SYNC_COUNTS.assignments}건 · 공지 ${SYNC_COUNTS.notices}건 정리 중` },
  { title: '홈 화면 준비', sub: () => '오늘 수업과 출석 정리 중' },
];
