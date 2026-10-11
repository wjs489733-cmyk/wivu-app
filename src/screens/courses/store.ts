import { create } from 'zustand';
import { useApp } from '@/store/app';
import { USER } from '@/data/core';
import { SUBMIT_TIME, type Assignment } from './data';

/* ────────────────────────────────────────────────────────────
 * 수강과목 섹션 로컬 상태 (새로고침하면 초기화 — 전시용 의도)
 *  - readNotices: 읽은 과목 공지 (N 배지·'새 글' 해제)
 *  - downloaded:  다운로드 끝난 파일 id (같은 파일은 화면이 달라도 같은 상태)
 *  - submissions: 과제별 제출 내역. 서비스디자인 a1은 전역 useApp.submitAssignment도 함께 호출
 * ──────────────────────────────────────────────────────────── */
export type SubmittedFile = { name: string; size: string };
export type Submission = { files: SubmittedFile[]; memo: string; at: string };

type CoursesState = {
  readNotices: string[];
  downloaded: string[];
  submissions: Record<string, Submission>;
  markNoticeRead: (key: string) => void;
  markDownloaded: (fileId: string) => void;
  saveSubmission: (key: string, s: Submission) => void;
};

export const useCourses = create<CoursesState>((set) => ({
  readNotices: [],
  downloaded: [],
  submissions: {},
  markNoticeRead: (key) => set((st) => (st.readNotices.includes(key) ? st : { readNotices: [...st.readNotices, key] })),
  markDownloaded: (id) => set((st) => (st.downloaded.includes(id) ? st : { downloaded: [...st.downloaded, id] })),
  saveSubmission: (key, s) => set((st) => ({ submissions: { ...st.submissions, [key]: s } })),
}));

export const noticeKey = (courseId: string, nid: string) => `${courseId}/${nid}`;
export const assignmentKey = (courseId: string, aid: string) => `${courseId}/${aid}`;
/** 전역 useApp.assignmentSubmitted와 연결된 과제 (홈 카드·타임라인이 이 값을 읽음) */
export const isGlobalAssignment = (courseId: string, aid: string) => courseId === 'service-design' && aid === 'a1';

/** 공지가 아직 안 읽은 새 글인지 */
export function useIsNew(courseId: string) {
  const read = useCourses((st) => st.readNotices);
  return (n: { id: string; isNew?: boolean }) => !!n.isNew && !read.includes(noticeKey(courseId, n.id));
}

export type SubmissionView = { files: SubmittedFile[]; at: string; memo?: string };

/** 과제 제출 상태 — 데이터(이미 제출) · 로컬 기록 · 전역 상태를 합쳐서 하나로.
 *  목록에서도 쓰도록 '판정 함수'를 돌려준다. */
export function useSubmissionOf(courseId: string) {
  const submissions = useCourses((st) => st.submissions);
  const globalDone = useApp((st) => st.assignmentSubmitted);
  const globalFile = useApp((st) => st.submittedFile);
  return (a: Assignment): SubmissionView | null => {
    const local = submissions[assignmentKey(courseId, a.id)];
    if (isGlobalAssignment(courseId, a.id)) {
      // 전역 상태가 기준 (스플래시 리셋 등으로 전역이 false면 미제출)
      if (!globalDone) return null;
      return local ?? { files: [{ name: globalFile ?? `서비스분석리포트_${USER.name}.pdf`, size: '3.8MB' }], at: `09.11 ${SUBMIT_TIME}` };
    }
    if (local) return local;
    if (a.submitted) return { files: [{ name: a.submitted.file, size: a.submitted.size }], at: a.submitted.at };
    return null;
  };
}
