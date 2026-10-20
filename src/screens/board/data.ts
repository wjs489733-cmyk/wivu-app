import { P } from '@/app/paths';
import { COURSES, courseById, type CourseId } from '@/data/core';
import type { ChipTone, IconName } from '@/ui';

/* ────────────────────────────────────────────────────────────
 * 게시판 데이터 — Figma v5 '09 게시판' (687:6491 · 687:6661 · 687:6783 · 698:7597 · 687:6877) 텍스트 그대로
 * 기준 시각 2026-10-09(금) 9:41 · 6주차. 작성자는 익명·학과명·김OO 패턴 가상 인물만.
 * 날짜 표기 글: 1주차 글(OT 정리·'1주차 …')은 9월 날짜 그대로, 최근 글은 6주차(10.03–10.07) 날짜.
 * 학교 규정·수치처럼 보이는 정보는 쓰지 않는다.
 * ──────────────────────────────────────────────────────────── */

export type CampusBoardId = 'free' | 'info' | 'team' | 'dept' | 'market' | 'lost';
export type BoardId = CourseId | CampusBoardId | 'guide';

export type Board = {
  id: BoardId;
  /** 표시 이름 (수업 게시판은 과목명) */
  name: string;
  kind: 'course' | 'campus' | 'system';
  /** 피드 헤더 부제 */
  sub: string;
  icon: IconName;
  /** 피드 필터 (전체 제외) */
  filters: string[];
  /** 글쓰기 말머리 */
  categories: string[];
  /** 피드 상단 고정 행 (v5: 배지 + 제목) */
  pinned?: { badge: string; title: string; to: string };
  /** 탭 루트 '학교 게시판' 타일 보조 문구 */
  tileSub?: string;
};

const COURSE_HEADCOUNT: Record<CourseId, number> = {
  'service-design': 38,
  'brand-design': 41,
  'ux-research': 32,
  'design-management': 56,
  'motion-graphics': 24,
  writing: 120,
};

const COURSE_FILTERS = ['질문', '자료', '팀플', '후기'];

const courseBoards: Board[] = COURSES.map((c) => ({
  id: c.id,
  name: c.name,
  kind: 'course',
  sub: `수업 게시판 · 수강생 ${COURSE_HEADCOUNT[c.id]}명`,
  icon: 'board',
  filters: COURSE_FILTERS,
  categories: COURSE_FILTERS,
  // 서비스디자인만 Figma 공지 상세(398:7759)와 연결. 나머지 과목은 과목 상세(공지 탭)로.
  pinned:
    c.id === 'service-design'
      ? { badge: '교수 공지', title: '오늘 수업 진행 방식 안내', to: P.courseNotice('service-design', 'c1') }
      : { badge: '교수 공지', title: `${c.name} 과목 공지 모아보기`, to: P.course(c.id) },
}));

const GUIDE_PIN = { badge: '운영 안내', title: '서로 존중하는 게시판을 만들어요', to: P.boardPost('guide') };

const campusBoards: Board[] = [
  { id: 'free', name: '자유게시판', kind: 'campus', sub: '재학생 인증 · 익명 게시판', tileSub: '익명 · 잡담·고민', icon: 'comment', filters: ['잡담', '질문', '고민'], categories: ['잡담', '질문', '고민'], pinned: GUIDE_PIN },
  { id: 'info', name: '정보게시판', kind: 'campus', sub: '재학생 인증 · 학교생활 정보', tileSub: '학교생활 정보', icon: 'notice', filters: ['학사', '행사', '생활'], categories: ['학사', '행사', '생활'], pinned: GUIDE_PIN },
  { id: 'team', name: '팀플·스터디', kind: 'campus', sub: '재학생 인증 · 팀원·스터디 모집', tileSub: '팀원·스터디 모집', icon: 'users', filters: ['모집 중', '스터디', '공모전'], categories: ['스터디', '공모전', '팀플'], pinned: GUIDE_PIN },
  { id: 'dept', name: '시각디자인과', kind: 'campus', sub: '학과 게시판 · 시각디자인과 인증', tileSub: '학과 게시판', icon: 'library', filters: ['공지', '과제', '졸업전시'], categories: ['과제', '졸업전시', '잡담'], pinned: GUIDE_PIN },
  // v5 탭 루트·글쓰기 시트엔 없는 게시판(장터·분실물) — 기존 경로(검색 결과·직접 주소)만 살려 둔다
  { id: 'market', name: '장터', kind: 'campus', sub: '재학생 인증 · 중고거래·나눔', icon: 'bookmark', filters: ['팝니다', '삽니다', '나눔'], categories: ['팝니다', '삽니다', '나눔'], pinned: GUIDE_PIN },
  { id: 'lost', name: '분실물', kind: 'campus', sub: '재학생 인증 · 분실물 찾기', icon: 'pin', filters: ['찾아요', '주웠어요'], categories: ['찾아요', '주웠어요'], pinned: GUIDE_PIN },
];

const guideBoard: Board = { id: 'guide', name: '운영 안내', kind: 'system', sub: '', icon: 'notice', filters: [], categories: [] };

export const BOARDS: Board[] = [...courseBoards, ...campusBoards, guideBoard];
/** v5 탭 루트 '학교 게시판' 2×2 · 글쓰기 '전체 게시판' 그룹 (687:6491 · 699:8284) */
export const CAMPUS_BOARDS = campusBoards.filter((b) => b.id !== 'market' && b.id !== 'lost');
export const COURSE_BOARDS = courseBoards;

export const boardById = (id: string): Board => BOARDS.find((b) => b.id === id) ?? courseBoards[0];
export const isBoardId = (id: string) => BOARDS.some((b) => b.id === id);
/** 상세 헤더 제목: '서비스디자인 게시판' / '정보게시판' */
export const boardTitle = (b: Board) => (b.kind === 'course' ? `${b.name} 게시판` : b.name);
export const verifiedLabel = (b: Board) => (b.kind === 'course' ? '수강생 인증' : b.id === 'dept' ? '학과 인증' : '재학생 인증');

/* ── 탭 루트 '내 수업 게시판' 목록 (687:6491 — 처음 4개, '전체 6'으로 펼침) ──── */
/** 오늘 새 글 수 — 0보다 크면 'NEW' 배지 + '오늘 새 글 n' */
export const MY_COURSE_ROWS: { id: CourseId; newToday: number }[] = [
  { id: 'service-design', newToday: 3 },
  { id: 'brand-design', newToday: 0 },
  { id: 'ux-research', newToday: 1 },
  { id: 'design-management', newToday: 0 },
  { id: 'motion-graphics', newToday: 0 },
  { id: 'writing', newToday: 0 },
];
export const COURSE_ROWS_FOLDED = 4;
export const courseHeadcount = (id: CourseId) => COURSE_HEADCOUNT[id];

/* ── 말머리 색 (v5 Badge) ─────────────────────────────────────
 * 피드백 4번(컬러 최소화): 기본은 Neutral. 기한이 있는 모집 글(팀플)만 Warning, 운영·교수 공지성 말머리만 Brand. */
const TAG_TONE: Record<string, ChipTone> = {
  팀플: 'warningSoft',
  공지: 'brand',
  안내: 'brand',
};
export const tagTone = (tag: string): ChipTone => TAG_TONE[tag] ?? 'neutral';

/* ── 글 ─────────────────────────────────────────────────────── */
export type Attachment = { name: string; size: string; kind: 'pdf' | 'image' | 'file'; url?: string };
/** when: 카드 한 줄 요약('금 15:00 수업') · note: 신청 시트의 상세 한 줄 */
export type Recruit = { current: number; max: number; deadline?: string; note: string; when?: string; courseId?: CourseId };
export type LinkedAssignment = { courseId: CourseId; aid: string; title: string; due: string };

export type Post = {
  id: string;
  boardId: BoardId;
  tag: string;
  title: string;
  /** 피드 미리보기 (없으면 본문 첫 줄) */
  excerpt?: string;
  body: string;
  author: string;
  time: string;
  views: number;
  likes: number;
  /** 댓글 수 (시드 댓글 수와 같게 유지) */
  comments: number;
  likedByMe?: boolean;
  isNew?: boolean;
  files?: Attachment[];
  linked?: LinkedAssignment;
  recruit?: Recruit;
  mine?: boolean;
  pinned?: boolean;
  /** 이번 세션에 쓴 글 (피드 하이라이트용 타임스탬프) */
  createdAt?: number;
};

export type Comment = {
  id: string;
  postId: string;
  author: string;
  time: string;
  body: string;
  likes: number;
  /** 답글이면 부모 댓글 id */
  parent?: string;
  isAuthor?: boolean;
  mine?: boolean;
};

const A1: LinkedAssignment = { courseId: 'service-design', aid: 'a1', title: '서비스 분석 리포트', due: '오늘 23:59' };

export const POSTS: Post[] = [
  /* 서비스디자인 — Figma v5 687:6661 (피드) · 687:6783 (p1 상세) · 698:7597 (p2 상세)
   * p1은 '내 글'(알림 '내 글에 댓글 2개가 달렸어요') → mine: true · 내 공감 없음(공감 4는 다른 사람들) */
  {
    id: 'p1',
    boardId: 'service-design',
    tag: '질문',
    title: '서비스 분석 리포트, 분석 대상 겹쳐도 되나요?',
    body: '배달앱으로 분석 대상을 정했는데, 다른 분들도 많이 고르셨을 것 같아서요.\n\n관점(예: 라이더 vs 주문자)만 다르면 겹쳐도 괜찮을까요? 수업 때 여쭤보려다 놓쳐서 여기 남겨봅니다.',
    author: '익명',
    time: '12분 전',
    views: 54,
    likes: 4,
    comments: 6,
    isNew: true,
    linked: A1,
    mine: true,
  },
  {
    id: 'p2',
    boardId: 'service-design',
    tag: '팀플',
    // 피드(687:6661)와 상세(698:7597)의 제목·본문·시간이 서로 달라 상세 기준으로 통일 — 인원은 피드 메타 '모집 2/4'로 이미 보여서 제목의 (2/4)는 뺐다
    title: '블루프린트 워크숍 같이 할 팀 구해요',
    body: '다음 주 수업 블루프린트 워크숍 같이 할 팀 구해요. 지금 2명이고 2명 더 구해요. 화요일 저녁에 오프라인으로 모일 수 있는 분이면 좋겠어요.',
    author: '익명',
    time: '38분 전',
    views: 88,
    likes: 7,
    comments: 3,
    isNew: true,
    recruit: { current: 2, max: 4, deadline: '오늘 마감', note: '다음 주 수업 블루프린트 워크숍 · 화요일 저녁 오프라인', when: '화 저녁 오프라인', courseId: 'service-design' },
  },
  {
    id: 'p3',
    boardId: 'service-design',
    tag: '자료',
    title: '현장 관찰 노트 템플릿 공유합니다',
    body: '지난주 관찰할 때 쓴 노트 양식이에요. 필요하신 분 쓰세요.\n\n시간대별 관찰 기록, 사용자 행동, 페인 포인트, 사진 메모 칸으로 나눠뒀어요. 출력해서 써도 되고 태블릿에서 바로 필기해도 돼요.',
    author: '익명',
    time: '2시간 전',
    views: 132,
    likes: 12,
    comments: 3,
    files: [{ name: '현장관찰노트_템플릿.pdf', size: '1.2MB', kind: 'pdf' }],
  },
  {
    id: 'p4',
    boardId: 'service-design',
    tag: '질문',
    title: '고객 여정 지도 툴 뭐 쓰세요?',
    body: 'Figma로 하려는데 템플릿 추천해 주실 분 있나요?\n\n팀원들이랑 동시에 편집해야 해서 협업이 편한 쪽이면 좋겠어요.',
    author: '익명',
    time: '어제',
    views: 87,
    likes: 2,
    comments: 5,
    isNew: true,
  },
  {
    id: 'p5',
    boardId: 'service-design',
    tag: '후기',
    title: '1주차 오리엔테이션 정리',
    excerpt: '평가 비율이랑 과제 일정 정리해뒀어요',
    body: '평가 비율이랑 과제 일정 정리해뒀어요\n\n결석하신 분들 참고하세요. 정확한 내용은 강의계획서랑 교수님 공지를 꼭 다시 확인해주세요!',
    author: '익명',
    time: '09.04',
    views: 210,
    likes: 25,
    comments: 4,
    files: [{ name: '서비스디자인_1주차_OT정리.pdf', size: '0.8MB', kind: 'pdf' }],
  },

  /* UX 리서치 — 새 글 5 · 팀플 모집 2 */
  {
    id: 'u1',
    boardId: 'ux-research',
    tag: '팀플',
    title: '사용자 인터뷰 같이 진행할 팀원 2명 구해요',
    excerpt: '금 15:00 수업 · 인터뷰 대상 섭외 경험 있으면 좋아요',
    body: '금 15:00 수업 인터뷰 과제 같이 하실 분 2명 구해요.\n\n주제는 ‘대학생 점심시간 동선’이고, 인터뷰 대상 섭외 경험 있으면 좋아요. 지금 3명이라 2명만 더 모이면 바로 시작할게요. 참여 신청 눌러주세요!',
    author: '익명',
    time: '1시간 전',
    views: 64,
    likes: 7,
    comments: 4,
    isNew: true,
    recruit: { current: 3, max: 5, deadline: 'D-2 마감', note: '금 15:00 수업 · 인터뷰 대상 섭외 경험 있으면 좋아요', when: '금 15:00 수업', courseId: 'ux-research' },
  },
  {
    id: 'u2',
    boardId: 'ux-research',
    tag: '팀플',
    title: '설문 설계 같이 하실 분 (1/3)',
    excerpt: '정량 조사 파트 맡아주실 분 찾아요. 구글 폼 다뤄보신 분 환영!',
    body: '정량 조사 파트 맡아주실 분 찾아요. 구글 폼 다뤄보신 분 환영!\n\n문항 설계부터 결과 정리까지 같이 해요. 일주일에 한 번 정도 짧게 온라인으로 맞춰보면 될 것 같아요.',
    author: '익명',
    time: '2시간 전',
    views: 29,
    likes: 2,
    comments: 1,
    isNew: true,
    recruit: { current: 1, max: 3, deadline: 'D-5 마감', note: '정량 조사 파트 · 온라인 회의 위주', when: '온라인 회의 위주', courseId: 'ux-research' },
  },
  {
    id: 'u3',
    boardId: 'ux-research',
    tag: '질문',
    title: '인터뷰 녹취 전사 툴 추천해주세요',
    excerpt: '한 시간짜리 인터뷰 세 개를 정리해야 하는데 손으로 하기 막막하네요',
    body: '한 시간짜리 인터뷰 세 개를 정리해야 하는데 손으로 하기 막막하네요.\n\n자동 전사 써보신 분들 정확도 괜찮았는지 궁금해요.',
    author: '익명',
    time: '3시간 전',
    views: 58,
    likes: 5,
    comments: 4,
    isNew: true,
  },
  {
    id: 'u4',
    boardId: 'ux-research',
    tag: '자료',
    title: '어피니티 다이어그램 예시 모음',
    excerpt: '지난 학기 수업 때 만든 예시들 정리해봤어요',
    body: '지난 학기 수업 때 만든 예시들 정리해봤어요.\n\n포스트잇 색 구분 규칙이랑 그룹 이름 붙이는 방법도 같이 적어뒀어요.',
    author: '시각디자인과',
    time: '어제',
    views: 96,
    likes: 21,
    comments: 3,
    isNew: true,
    files: [{ name: '어피니티_다이어그램_예시.pdf', size: '3.4MB', kind: 'pdf' }],
  },
  {
    id: 'u5',
    boardId: 'ux-research',
    tag: '질문',
    title: '퍼소나 몇 개까지 만들어야 하나요?',
    excerpt: '인터뷰 결과가 꽤 다양해서 두 개로 줄여도 될지 고민이에요',
    body: '인터뷰 결과가 꽤 다양해서 두 개로 줄여도 될지 고민이에요.\n\n과제 안내에는 개수가 따로 없던데 다들 몇 개 하시나요?',
    author: '익명',
    time: '어제',
    views: 44,
    likes: 4,
    comments: 5,
    isNew: true,
  },
  {
    id: 'u6',
    boardId: 'ux-research',
    tag: '후기',
    title: '5주차 수업 정리 — 리서치 질문 쓰는 법',
    excerpt: '열린 질문으로 바꾸는 예시가 특히 도움 됐어요',
    body: '열린 질문으로 바꾸는 예시가 특히 도움 됐어요.\n\n“~하시나요?” 대신 “최근에 ~했던 때를 이야기해 주세요”처럼 바꾸는 연습을 했어요.',
    author: '익명',
    time: '10.03',
    views: 120,
    likes: 30,
    comments: 2,
  },

  /* 브랜드디자인 — 새 글 1 · 자료 1 */
  {
    id: 'b1',
    boardId: 'brand-design',
    tag: '자료',
    title: '브랜드 아이덴티티 레퍼런스 사이트 모음',
    excerpt: '무드보드 만들 때 자주 보는 아카이브 사이트들이에요',
    body: '무드보드 만들 때 자주 보는 아카이브 사이트들이에요.\n\n로고, 컬러 시스템, 패키지 사례별로 나눠서 정리했어요. 첨부 파일에 링크 모아뒀어요.',
    author: '익명',
    time: '2시간 전',
    views: 73,
    likes: 12,
    comments: 3,
    isNew: true,
    files: [{ name: '브랜드_레퍼런스_링크.pdf', size: '0.4MB', kind: 'pdf' }],
  },
  {
    id: 'b2',
    boardId: 'brand-design',
    tag: '질문',
    title: '로고 시안 몇 개까지 가져가요?',
    excerpt: '다음 주 크리틱 때 시안 개수 정해진 거 있나요?',
    body: '다음 주 크리틱 때 시안 개수 정해진 거 있나요?\n\n방향이 다른 시안 세 개 정도 생각 중이에요.',
    author: '익명',
    time: '10.06',
    views: 51,
    likes: 3,
    comments: 4,
  },
  {
    id: 'b3',
    boardId: 'brand-design',
    tag: '후기',
    title: '1주차 브랜드 워크숍 후기',
    excerpt: '키워드 맵 만들기 생각보다 재밌었어요',
    body: '키워드 맵 만들기 생각보다 재밌었어요.\n\n팀별로 동네 빵집 브랜드를 가상으로 정해서 해봤는데, 다음 주에 이어서 한다고 하셨어요.',
    author: '익명',
    time: '09.04',
    views: 88,
    likes: 9,
    comments: 1,
  },

  /* 모션그래픽스 · 디자인경영 · 글쓰기와 소통 */
  {
    id: 'm1',
    boardId: 'motion-graphics',
    tag: '질문',
    title: 'AE 익스프레션 기초 강의 추천해주세요',
    excerpt: 'wiggle 말고는 써본 적이 없어서요',
    body: 'wiggle 말고는 써본 적이 없어서요.\n\n과제에 반복 애니메이션이 많아서 익스프레션을 좀 배워두고 싶어요.',
    author: '익명',
    time: '10.07',
    views: 39,
    likes: 8,
    comments: 3,
  },
  {
    id: 'm2',
    boardId: 'motion-graphics',
    tag: '자료',
    title: '이징 커브 정리 노트',
    excerpt: '그래프 에디터 볼 때 참고하려고 만든 표예요',
    body: '그래프 에디터 볼 때 참고하려고 만든 표예요.\n\nease-in, ease-out 차이를 예시 움직임이랑 같이 정리했어요.',
    author: '시각디자인과',
    time: '09.03',
    views: 102,
    likes: 15,
    comments: 2,
    files: [{ name: '이징커브_정리.pdf', size: '2.1MB', kind: 'pdf' }],
  },
  {
    id: 'd1',
    boardId: 'design-management',
    tag: '질문',
    title: '케이스 스터디 발표 순서 정해졌나요?',
    excerpt: '수요일 수업 끝나고 공지 올라온다고 하셨던 것 같은데',
    body: '수요일 수업 끝나고 공지 올라온다고 하셨던 것 같은데 혹시 보신 분 계신가요?',
    author: '익명',
    time: '10.07',
    views: 47,
    likes: 2,
    comments: 2,
  },
  {
    id: 'd2',
    boardId: 'design-management',
    tag: '후기',
    title: '1주차 강의 요약',
    excerpt: '디자인 전략과 비즈니스 모델 캔버스 위주로 정리했어요',
    body: '디자인 전략과 비즈니스 모델 캔버스 위주로 정리했어요.\n\n수업 자료랑 같이 보시면 좋아요.',
    author: '익명',
    time: '09.02',
    views: 133,
    likes: 11,
    comments: 1,
  },
  {
    id: 'w1',
    boardId: 'writing',
    tag: '질문',
    title: '1주차 온라인 퀴즈 어디서 봐요?',
    excerpt: '사이버 강의 페이지에 안 보여서요',
    body: '사이버 강의 페이지에 안 보여서요. 혹시 찾으신 분 계신가요?',
    author: '익명',
    time: '09.08',
    views: 152,
    likes: 6,
    comments: 3,
  },
  {
    id: 'w2',
    boardId: 'writing',
    tag: '자료',
    title: '글쓰기 과제 형식 정리',
    excerpt: '분량, 파일 이름 규칙 공지 내용 한눈에 보기',
    body: '분량, 파일 이름 규칙 등 공지 내용을 한눈에 보기 좋게 정리했어요.\n\n정확한 건 공지 원문을 꼭 확인해주세요.',
    author: '익명',
    time: '09.05',
    views: 201,
    likes: 19,
    comments: 2,
  },

  /* 자유게시판 */
  {
    id: 'f1',
    boardId: 'free',
    tag: '잡담',
    title: '오늘 학식 돈까스래요',
    excerpt: '금요일 돈까스는 못 참지… 11시 반 오픈런 가실 분',
    body: '금요일 돈까스는 못 참지… 11시 반 오픈런 가실 분\n\n우동도 같이 나온대요. 디자인관에서 출발하면 딱 맞을 듯.',
    author: '익명',
    time: '25분 전',
    views: 188,
    likes: 11,
    comments: 5,
    isNew: true,
  },
  {
    id: 'f2',
    boardId: 'free',
    tag: '고민',
    title: '4학년 2학기, 졸전이랑 취준 병행 다들 어떻게 하세요',
    excerpt: '포트폴리오 정리할 시간이 안 나서 걱정이에요',
    body: '포트폴리오 정리할 시간이 안 나서 걱정이에요.\n\n졸전 작업이랑 포폴 작업을 하나로 묶어보려고 하는데, 비슷하게 해보신 분들 조언 부탁드려요.',
    author: '익명',
    time: '1시간 전',
    views: 302,
    likes: 24,
    comments: 7,
    isNew: true,
  },
  {
    id: 'f3',
    boardId: 'free',
    tag: '질문',
    title: '중앙도서관 콘센트 많은 자리 어디예요?',
    excerpt: '노트북 충전기 꽂을 데가 없어서 매번 헤매요',
    body: '노트북 충전기 꽂을 데가 없어서 매번 헤매요. 창가 쪽이 많은가요?',
    author: '익명',
    time: '2시간 전',
    views: 97,
    likes: 6,
    comments: 4,
  },
  {
    id: 'f4',
    boardId: 'free',
    tag: '잡담',
    title: '디자인관 엘리베이터 또 점검 중이네요',
    excerpt: '4층까지 계단… 작품 들고 올라가기 힘들어요',
    body: '4층까지 계단… 작품 들고 올라가기 힘들어요.\n\n다들 오늘 크리틱 있으면 조금 일찍 출발하세요!',
    author: '익명',
    time: '어제',
    views: 156,
    likes: 15,
    comments: 3,
  },

  /* 정보게시판 */
  {
    id: 'i1',
    boardId: 'info',
    tag: '생활',
    title: '중앙도서관 그룹스터디룸 예약 꿀팁',
    excerpt: '팀플 많은 학기라 예약 경쟁이 치열하더라고요. 제가 쓰는 방법 공유해요',
    body: '팀플 많은 학기라 예약 경쟁이 치열하더라고요. 제가 쓰는 방법 공유해요.\n\n1. 회의 날짜가 정해지면 바로 예약부터 하기\n2. 오후 시간대보다 오전 시간대가 비교적 여유 있어요\n3. 인원이 적으면 작은 방을 고르는 게 잡기 쉬워요\n4. 못 가게 되면 꼭 미리 취소해주세요. 다른 팀이 쓸 수 있게요!\n\n정확한 이용 규칙은 도서관 공지를 꼭 확인하세요.',
    author: '익명',
    time: '1시간 전',
    views: 412,
    likes: 32,
    comments: 14,
    isNew: true,
  },
  {
    id: 'i2',
    boardId: 'info',
    tag: '학사',
    title: '중간고사 일정 정리 (10.19 – 10.23)',
    excerpt: '시험 기간 놓치지 마세요. 학사 공지 원문 같이 확인하세요',
    body: '중간고사 기간이 10.19(월)부터 10.23(금)까지예요.\n\n시험 시간이랑 장소는 과목마다 달라서 과목 공지를 꼭 확인하세요. 시험 대신 과제나 발표로 보는 과목도 있으니 미리 정리해두면 편해요.',
    author: '익명',
    time: '3시간 전',
    views: 520,
    likes: 40,
    comments: 6,
  },
  {
    id: 'i3',
    boardId: 'info',
    tag: '행사',
    title: '하반기 취업박람회 가기 전 체크리스트',
    excerpt: '포트폴리오 PDF, 이력서 출력본, 질문 리스트 챙기세요',
    body: '포트폴리오 PDF, 이력서 출력본, 궁금한 기업에 물어볼 질문 리스트 챙기세요.\n\n디자인 직무 부스는 대기 줄이 길 수 있으니 관심 있는 곳부터 먼저 가는 걸 추천해요.',
    author: '익명',
    time: '어제',
    views: 233,
    likes: 19,
    comments: 4,
  },

  /* 팀플·스터디 */
  {
    id: 't1',
    boardId: 'team',
    tag: '스터디',
    title: '기말 대비 UX 리서치 스터디 모집합니다',
    excerpt: '주 1회 리서치 방법론 정리하고 서로 인터뷰 연습해요',
    body: '주 1회 리서치 방법론 정리하고 서로 인터뷰 연습해요.\n\n수업 듣는 분 아니어도 괜찮아요. 화요일 저녁 도서관 그룹스터디룸에서 할 예정이에요.',
    author: '익명',
    time: '3시간 전',
    views: 176,
    likes: 18,
    comments: 9,
    recruit: { current: 2, max: 4, deadline: 'D-4 마감', note: '주 1회 화요일 저녁 · 중앙도서관', when: '화 저녁 · 중앙도서관' },
  },
  {
    id: 't2',
    boardId: 'team',
    tag: '공모전',
    title: '타이포그래피 공모전 같이 나갈 분 (2/3)',
    excerpt: '포스터 부문 준비 중이에요. 레터링 좋아하시는 분!',
    body: '포스터 부문 준비 중이에요. 레터링 좋아하시는 분!\n\n아이디어 회의는 디자인관에서 하고, 작업은 각자 하다가 주 1회 맞춰볼게요.',
    author: '익명',
    time: '어제',
    views: 82,
    likes: 6,
    comments: 3,
    recruit: { current: 2, max: 3, deadline: 'D-6 마감', note: '포스터 부문 · 주 1회 회의', when: '포스터 부문' },
  },
  {
    id: 't3',
    boardId: 'team',
    tag: '스터디',
    title: '아침 영어 스터디 (주 3회)',
    excerpt: '월수금 8시 반, 30분만 짧게 해요',
    body: '월수금 8시 반, 30분만 짧게 해요. 1교시 전에 끝나요.\n\n꾸준히 나오실 분만 신청해주세요!',
    author: '익명',
    time: '10.07',
    views: 64,
    likes: 4,
    comments: 2,
    recruit: { current: 3, max: 6, deadline: 'D-3 마감', note: '월·수·금 08:30 · 학생회관', when: '월·수·금 08:30' },
  },

  /* 시각디자인과 */
  {
    id: 'v1',
    boardId: 'dept',
    tag: '공지',
    title: '실기실 A3 프린터 용지 보충했어요',
    excerpt: '디자인관 실기실 프린터 옆 선반에 있어요',
    body: '디자인관 실기실 프린터 옆 선반에 있어요.\n\n다 쓰면 과사무실에 말씀해주세요.',
    author: '시각디자인과',
    time: '2시간 전',
    views: 140,
    likes: 9,
    comments: 2,
    isNew: true,
  },
  {
    id: 'v2',
    boardId: 'dept',
    tag: '졸업전시',
    title: '졸전 포스터 레퍼런스 같이 모아요',
    excerpt: '공유 보드 만들어뒀어요. 자유롭게 추가해주세요',
    body: '공유 보드 만들어뒀어요. 자유롭게 추가해주세요.\n\n타이포 중심, 이미지 중심, 그리드 실험 세 갈래로 나눠놨어요.',
    author: '익명',
    time: '어제',
    views: 118,
    likes: 14,
    comments: 3,
  },
  {
    id: 'v3',
    boardId: 'dept',
    tag: '과제',
    title: '크리틱 전날 출력소 붐비는 시간',
    excerpt: '밤 10시 넘어서는 대기가 길어요',
    body: '밤 10시 넘어서는 대기가 길어요. 가능하면 오후에 미리 뽑아두세요!',
    author: '익명',
    time: '10.06',
    views: 91,
    likes: 7,
    comments: 2,
  },

  /* 장터 */
  {
    id: 'k1',
    boardId: 'market',
    tag: '팝니다',
    title: '펜 타블렛 (M 사이즈) 팝니다',
    excerpt: '1년 사용, 펜촉 여분 있어요. 디자인관에서 직거래',
    body: '1년 사용, 펜촉 여분 있어요. 디자인관에서 직거래해요.\n\n가격은 댓글이나 쪽지로 문의주세요.',
    author: '익명',
    time: '40분 전',
    views: 67,
    likes: 3,
    comments: 3,
    isNew: true,
  },
  {
    id: 'k2',
    boardId: 'market',
    tag: '삽니다',
    title: '서비스디자인 수업 교재 중고로 구해요',
    excerpt: '필기 조금 있어도 괜찮아요',
    body: '필기 조금 있어도 괜찮아요. 학교 안에서 직거래 원해요.',
    author: '익명',
    time: '어제',
    views: 45,
    likes: 1,
    comments: 2,
  },
  {
    id: 'k3',
    boardId: 'market',
    tag: '나눔',
    title: '커팅 매트 A2 나눔해요',
    excerpt: '졸업 전에 정리 중이에요. 먼저 댓글 주신 분께!',
    body: '졸업 전에 정리 중이에요. 먼저 댓글 주신 분께 드릴게요!',
    author: '익명',
    time: '10.07',
    views: 120,
    likes: 12,
    comments: 2,
  },

  /* 분실물 */
  {
    id: 'l1',
    boardId: 'lost',
    tag: '찾아요',
    title: '디자인관 302호에서 흰색 무선 이어폰 케이스 잃어버렸어요',
    excerpt: '오늘 아침 서비스디자인 수업 전후로 잃어버린 것 같아요',
    body: '오늘 아침 서비스디자인 수업 전후로 잃어버린 것 같아요.\n\n케이스에 작은 스티커가 붙어 있어요. 보신 분 댓글 부탁드려요 🙏',
    author: '익명',
    time: '30분 전',
    views: 38,
    likes: 2,
    comments: 2,
    isNew: true,
  },
  {
    id: 'l2',
    boardId: 'lost',
    tag: '주웠어요',
    title: '학생회관 앞에서 학생증 주웠어요 (김OO)',
    excerpt: '학생회관 1층 안내데스크에 맡겨뒀어요',
    body: '학생회관 1층 안내데스크에 맡겨뒀어요. 본인 확인하고 찾아가세요!',
    author: '익명',
    time: '2시간 전',
    views: 74,
    likes: 8,
    comments: 2,
  },
  {
    id: 'l3',
    boardId: 'lost',
    tag: '찾아요',
    title: '정보관 210호 파란색 USB 찾아요',
    excerpt: '과제 파일이 들어 있어서 꼭 찾고 싶어요',
    body: '과제 파일이 들어 있어서 꼭 찾고 싶어요. 정보관 210호 뒷자리 근처예요.',
    author: '익명',
    time: '어제',
    views: 52,
    likes: 3,
    comments: 2,
  },

  /* 운영 안내 (전체 게시판 고정 글) */
  {
    id: 'guide',
    boardId: 'guide',
    tag: '안내',
    title: '서로 존중하는 게시판을 만들어요',
    body: 'WivU 게시판은 재학생 인증을 마친 학생만 이용할 수 있어요.\n\n· 익명이어도 상대를 존중하는 말을 써주세요\n· 다른 사람의 개인정보(이름, 연락처, 학번)를 올리지 마세요\n· 광고·홍보 글은 숨김 처리될 수 있어요\n· 불편한 글은 오른쪽 위 ··· 메뉴에서 신고하거나 차단할 수 있어요',
    author: 'WivU 운영팀',
    time: '09.01',
    views: 1204,
    likes: 86,
    comments: 0,
    pinned: true,
  },
];

/* ── 탭 루트 ────────────────────────────────────────────────── */
export const TEAM_FEATURED = 'u1';
export const POPULAR = ['p1', 'i1', 't1'];

/* ── 댓글 (시드) ────────────────────────────────────────────── */
const C = (postId: string, n: number, author: string, time: string, body: string, likes = 0, extra: Partial<Comment> = {}): Comment => ({ id: `${postId}-c${n}`, postId, author, time, body, likes, ...extra });

const EXPLICIT: Comment[] = [
  // p1 — Figma v5 687:6783 (위 3개) + 이어지는 답글
  C('p1', 1, '익명1', '8분 전', '같은 서비스여도 분석 관점이 다르면 괜찮다고 지난주에 말씀하셨어요.', 3),
  C('p1', 2, '작성자', '6분 전', '오 다행이다, 감사해요!', 1, { parent: 'p1-c1', isAuthor: true }),
  C('p1', 3, '익명2', '3분 전', '저도 배달앱인데 저는 가게 사장님 관점으로 해보려고요 :)', 0),
  C('p1', 4, '작성자', '2분 전', '관점이 다 달라서 나중에 비교해봐도 재밌겠네요', 0, { parent: 'p1-c3', isAuthor: true }),
  C('p1', 5, '익명3', '1분 전', '저는 주문자 관점으로 잡았어요. 문제 정의만 다르게 잡으면 될 것 같아요', 1),
  C('p1', 6, '익명2', '방금', '그럼 셋이 인터뷰 자료 같이 봐요!', 0, { parent: 'p1-c5' }),

  // p2 — Figma v5 698:7597
  C('p2', 1, '익명1', '8분 전', '저 관심 있어요! 화요일 저녁 가능해요.', 1),
  C('p2', 2, '작성자', '6분 전', '좋아요, 쪽지 드릴게요!', 0, { parent: 'p2-c1', isAuthor: true }),
  C('p2', 3, '익명2', '3분 전', '혹시 온라인으로도 참여할 수 있나요?', 0),

  C('p3', 1, '익명1', '어제', '이거 진짜 필요했어요. 감사합니다!', 4),
  C('p3', 2, '익명2', '어제', '페인 포인트 칸 따로 있는 게 좋네요', 2),
  C('p3', 3, '작성자', '어제', '유용하게 쓰세요 :)', 1, { parent: 'p3-c2', isAuthor: true }),

  C('p4', 1, '익명1', '어제', '저희 팀은 Figma 템플릿 써요. 수업 과제 양식이랑 바로 이어져서 편해요', 3),
  C('p4', 2, '익명2', '어제', 'Miro는 포스트잇 정리할 때 좋긴 한데 최종 정리는 결국 Figma로 옮기게 되더라고요', 2),
  C('p4', 3, '작성자', '어제', '추천 감사해요! 수업 양식부터 써볼게요', 0, { parent: 'p4-c1', isAuthor: true }),

  C('p5', 1, '익명1', '09.04', '결석해서 몰랐는데 감사합니다 🙏', 2),
  C('p5', 2, '익명2', '09.05', '과제 일정 표로 정리해주셔서 보기 편해요', 1),

  C('u1', 1, '익명1', '50분 전', '섭외 경험은 없는데 인터뷰 진행은 해봤어요! 괜찮을까요?', 1),
  C('u1', 2, '작성자', '45분 전', '좋아요! 참여 신청 눌러주세요 :)', 0, { parent: 'u1-c1', isAuthor: true }),
  C('u1', 3, '익명2', '20분 전', '혹시 인터뷰는 대면인가요?', 0),
  C('u1', 4, '작성자', '15분 전', '대면 위주인데 한두 명은 온라인으로 해도 돼요', 0, { parent: 'u1-c3', isAuthor: true }),

  C('i1', 1, '익명1', '58분 전', '4번 진짜 중요해요… 노쇼 너무 많아요', 9),
  C('i1', 2, '익명2', '50분 전', '오전 시간대 꿀팁 감사합니다', 3),
  C('i1', 3, '익명3', '40분 전', '작은 방이 화이트보드 있어서 오히려 좋더라고요', 2),
  C('i1', 4, '작성자', '35분 전', '맞아요 작은 방도 회의하기 충분해요!', 1, { parent: 'i1-c3', isAuthor: true }),

  C('t1', 1, '익명1', '2시간 전', '수업 안 듣는데 참여해도 되나요?', 2),
  C('t1', 2, '작성자', '2시간 전', '네 물론이에요! 신청해주세요', 1, { parent: 't1-c1', isAuthor: true }),
  C('t1', 3, '익명2', '1시간 전', '화요일 저녁 몇 시쯤인가요?', 0),
  C('t1', 4, '작성자', '1시간 전', '7시 예정이에요', 0, { parent: 't1-c3', isAuthor: true }),

  C('f1', 1, '익명1', '20분 전', '저요저요 11시 20분에 디자인관 1층에서 봬요', 3),
  C('f1', 2, '익명2', '15분 전', '우동 국물 맛집…', 2),
  C('f2', 1, '익명1', '50분 전', '졸전 작업 과정을 포폴 케이스 스터디로 쓰는 거 추천해요. 기록만 잘 해두면 돼요', 11),
  C('f2', 2, '익명2', '40분 전', '저도 같은 고민 중이에요 ㅠㅠ 같이 힘내요', 4),

  C('l1', 1, '익명1', '20분 전', '302호 앞 분실물 바구니 한번 확인해보세요!', 1),
  C('l1', 2, '작성자', '10분 전', '헉 거기 있었어요 감사합니다!!', 2, { parent: 'l1-c1', isAuthor: true }),
];

/** 시드 댓글이 글의 댓글 수보다 적으면 앞쪽(이전 댓글)을 채우는 일반 댓글 */
const FILLER = [
  '정보 감사합니다 🙏',
  '저도 궁금했어요!',
  '오 저장해둘게요',
  '좋은 글 감사해요',
  '이거 진짜 유용하네요',
  '헐 몰랐어요',
  '공유 감사합니다!',
  '저도 같은 생각이에요',
  '도움 많이 됐어요',
  '저도 해봐야겠어요',
  '꿀팁 감사합니다',
  '와 정리 깔끔하네요',
  '좋아요 누르고 갑니다',
];

const seedCache = new Map<string, Comment[]>();
export function seedComments(post: Post): Comment[] {
  const hit = seedCache.get(post.id);
  if (hit) return hit;
  const explicit = EXPLICIT.filter((c) => c.postId === post.id);
  const need = Math.max(0, post.comments - explicit.length);
  const offset = [...post.id].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  // 익명 번호는 처음 댓글 단 순서 → 앞쪽 일반 댓글이 익명1…N, 시드 댓글은 그 뒤로 번호를 민다 (p1은 N=0이라 Figma 그대로)
  const fillers: Comment[] = Array.from({ length: need }, (_, i) => ({
    id: `${post.id}-f${i + 1}`,
    postId: post.id,
    author: `익명${i + 1}`,
    time: post.time,
    body: FILLER[(offset + i) % FILLER.length],
    likes: (offset + i) % 3,
  }));
  const shifted = explicit.map((c) => {
    const m = /^익명(\d+)$/.exec(c.author);
    return m ? { ...c, author: `익명${Number(m[1]) + need}` } : c;
  });
  const list = [...fillers, ...shifted];
  seedCache.set(post.id, list);
  return list;
}

/* ── 검색 ───────────────────────────────────────────────────── */
export const RECENT_SEARCHES = ['서비스 분석 리포트', '스터디룸', '팀플', '관찰 노트'];

/* ── 과제 연결 시트 (699:8424) — 팀 단위로 내는 과제는 상태 자리에 '팀 과제' ── */
export const TEAM_ASSIGNMENTS = new Set(['ux-research:a2']);

/* ── 신고 사유 ──────────────────────────────────────────────── */
export const REPORT_REASONS = ['욕설·비하 표현', '광고·홍보성 글', '음란·선정적인 내용', '개인정보 노출', '도배·낚시성 글', '기타'];

export const boardLabel = (boardId: BoardId) => {
  const b = boardById(boardId);
  return b.kind === 'course' ? courseById(b.id).name : b.name;
};
