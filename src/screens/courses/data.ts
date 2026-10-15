import { COURSES, NOW, courseById, type Course, type CourseId } from '@/data/core';
import { ACADEMIC_NOTICES } from '@/screens/info/data';

/* ────────────────────────────────────────────────────────────
 * 수강과목 섹션 데이터 — Figma 392:7404 · 398:7666 · 398:7694 · 398:7717 · 398:7759 · 398:7782 문구 그대로.
 * Figma에는 서비스디자인만 그려져 있어 나머지 5과목은 같은 구조로 그럴듯하게 채움(가상 인물 'OOO').
 * 기준 시각 core NOW = 2026-10-09(금) 9:41 = 6주차 · 1주차 9.1–9.4 · 6주차 10.6–10.9 (10.5 대체공휴일)
 * 1주차(OT·강의계획서·'1주차 …') 글/자료는 9월 날짜 그대로, '이번 주' 글/자료는 6주차로 둠.
 *
 * 단일 기준(single source of truth)
 *  · 과제: 여기 COURSE_INFO[].assignments → ASSIGNMENT_LIST로 내보내고, 캘린더(timetable/data.ts)는 이 목록에서
 *    과제 일정을 만든다. 과제 점: 9.4(1주차, 제출 완료) · 10.9 · 10.15 · 10.16 · 10.27
 *    '다가오는 일정'(10.15 브랜드 무드보드 제출 · 23:59) → 진행 중 4건 = Figma 연동 화면 '과제 4건'과 일치.
 *    ※ Figma 캘린더 392:7540(이전 기준 9월 · 9.11/9.17/9.18/9.29)은 10월로 갱신 필요.
 *  · 출석: 과목별 숫자는 attendance/data.ts courseStats()가 기준 (여기엔 두지 않음).
 *  · 연동 화면 카운트: SYNC_COUNTS (과제 진행 중 · 이번 주 새 공지)
 * ──────────────────────────────────────────────────────────── */

export type FileKind = 'pdf' | 'link' | 'video';
export type FileItem = {
  /** 전역 고유 — 같은 파일이 공지·강의자료에 함께 나오면 같은 id (다운로드 상태 공유) */
  id: string;
  name: string;
  kind: FileKind;
  /** 'PDF · 4.2MB' 의 뒷부분, 영상은 길이 */
  size: string;
  /** 업로드 날짜 'MM.DD' */
  date?: string;
};

export type Notice = {
  id: string;
  title: string;
  /** 목록용 '10.09 08:30' 또는 '09.04' */
  date: string;
  /** 상세용 '10.09 (금) 08:30' */
  dateFull: string;
  views: number;
  /** 안 읽은 새 글 (N 배지) — 읽으면 store에서 해제 */
  isNew?: boolean;
  /** 이번 주(6주차) 공지 — 수강과목 카드의 '공지 N' 집계 */
  thisWeek?: boolean;
  body: string;
  attachment?: FileItem;
};

export type Assignment = {
  id: string;
  title: string;
  due: Date;
  points: string;
  format: string;
  method: string;
  desc: string;
  attachments: FileItem[];
  /** 이미 제출해 둔 과거 과제 */
  submitted?: { file: string; size: string; at: string };
  /** 마감 지나 재제출 불가 */
  closed?: boolean;
};

export type MaterialGroup = { label: string; today?: boolean; items: FileItem[] };

export type CourseInfo = {
  /** core의 professor를 덮어씀 (글쓰기와 소통: core '사이버 강의' ↔ Figma '한OO 교수') */
  professor?: string;
  notices: Notice[];
  assignments: Assignment[];
  materials: MaterialGroup[];
  /* 출석 숫자·사이버 강의 진도는 attendance/data.ts(courseStats · nextAttendLabel · onlineProgress)에서 파생 */
};

const pdf = (id: string, name: string, size: string, date?: string): FileItem => ({ id, name, kind: 'pdf', size, date });
const d = (m: number, day: number, h: number, min: number) => new Date(2026, m - 1, day, h, min);

const SUBMIT_DEFAULT = { points: '20점', format: 'PDF · 10MB 이하', method: '개인 제출 · 마감 전 재제출 가능' };

/* ── 공용 파일 (공지 첨부 = 강의자료 같은 파일) ─────────────── */
const SD_BLUEPRINT = pdf('sd-blueprint', '서비스 블루프린트.pdf', '4.2MB', '10.09');
const SD_TEMPLATE = pdf('sd-template', '블루프린트_워크숍_템플릿.pdf', '2.1MB', '10.09');
const SD_OT = pdf('sd-ot', '오리엔테이션.pdf', '1.8MB', '09.04');
const SD_SYLLABUS = pdf('sd-syllabus', '강의계획서_서비스디자인.pdf', '0.6MB', '09.04');
const UX_TEMPLATE = pdf('ux-question', '인터뷰_질문지_템플릿.pdf', '0.4MB', '10.08');
const BD_FEEDBACK = pdf('bd-feedback', '1주차_브랜드분석_피드백.pdf', '1.6MB', '09.08');

export const COURSE_INFO: Record<CourseId, CourseInfo> = {
  'service-design': {
    notices: [
      {
        id: 'c1',
        title: '오늘 수업 진행 방식 안내',
        date: '10.09 08:30',
        dateFull: '10.09 (금) 08:30',
        views: 42,
        isNew: true,
        thisWeek: true,
        body:
          '오늘(10/9) 수업은 2교시 연속으로 진행됩니다. 전반부에는 서비스 분석 리포트 중간 피드백을, 후반부에는 팀별 서비스 블루프린트 워크숍을 진행합니다.\n\n준비물\n· 노트북 (Figma 사용)\n· 지난주 현장 관찰 노트\n\n출석은 10:00–10:10 사이에 앱에서 인증해 주세요. 10분 이후에는 지각으로 처리됩니다.',
        attachment: SD_TEMPLATE,
      },
      {
        id: 'c2',
        title: '중간 발표 팀 구성 안내',
        date: '09.04',
        dateFull: '09.04 (금) 17:20',
        views: 87,
        body:
          '중간 발표는 4인 1팀으로 진행합니다. 다음 주 수업 전까지 팀을 꾸려 대표 1명이 과목 게시판에 팀원 명단을 올려 주세요.\n\n· 팀 구성: 4인 1팀\n· 명단 제출: 9월 17일(목)까지 과목 게시판\n· 팀을 구하지 못한 학생은 수업 시간에 함께 정합니다.',
      },
      {
        id: 'c3',
        title: '강의계획서 및 평가 기준 안내',
        date: '09.01',
        dateFull: '09.01 (화) 10:00',
        views: 126,
        body:
          '2026-2학기 서비스디자인 강의계획서를 올렸습니다. 주차별 수업 내용과 과제·발표 일정, 평가 기준은 첨부한 강의계획서에서 확인해 주세요.',
        attachment: SD_SYLLABUS,
      },
    ],
    assignments: [
      {
        id: 'a1',
        title: '서비스 분석 리포트',
        due: d(10, 9, 23, 59),
        ...SUBMIT_DEFAULT,
        desc: '지난 2주간 진행한 현장 관찰을 바탕으로 하나의 서비스를 선정해 고객 여정을 분석하고, 문제점과 개선 기회를 정리하세요.\n\n· 분석 대상 서비스 1개 선정\n· 고객 여정 지도(Journey Map) 1장 포함\n· 개선 기회 3가지 이상 도출\n· 분량: A4 5매 내외',
        attachments: [pdf('sd-guide', '과제 가이드_서비스분석.pdf', '820KB')],
      },
      {
        id: 'a0',
        title: '1주차 리플렉션',
        due: d(9, 4, 23, 59),
        ...SUBMIT_DEFAULT,
        points: '5점',
        desc: '1주차 수업 내용을 정리한 리플렉션을 A4 1장 분량으로 제출해요.\n\n· 오늘 수업에서 새로 안 점\n· 관찰해 보고 싶은 서비스 1개',
        attachments: [],
        submitted: { file: '1주차리플렉션_김유진.pdf', size: '0.4MB', at: '09.04 20:15' },
        closed: true,
      },
    ],
    materials: [
      { label: '6주차 · 10.09', today: true, items: [SD_BLUEPRINT, SD_TEMPLATE] },
      { label: '1주차 · 09.04', items: [SD_OT, SD_SYLLABUS] },
    ],
  },

  'brand-design': {
    notices: [
      {
        id: 'c1',
        title: '1주차 브랜드 분석 피드백 공유',
        date: '09.08',
        dateFull: '09.08 (화) 16:40',
        views: 58,
        body: '1주차 브랜드 분석 실습 피드백을 정리해 올렸습니다. 많이 나온 의견은 이번 주 수업 시작할 때 10분 정도 함께 짚고 넘어가겠습니다.\n\n각자 받은 코멘트를 무드보드 과제에 반영해 보세요.',
        attachment: BD_FEEDBACK,
      },
      {
        id: 'c2',
        title: '수업 교재 안내',
        date: '09.02',
        dateFull: '09.02 (수) 11:00',
        views: 73,
        body: '이 수업은 별도 교재 없이 진행합니다. 매주 강의자료로 읽기 자료를 올리니 수업 전에 읽고 오세요.',
      },
    ],
    assignments: [
      {
        id: 'a1',
        title: '브랜드 무드보드',
        due: d(10, 15, 23, 59),
        ...SUBMIT_DEFAULT,
        points: '15점',
        desc: '관심 있는 로컬 브랜드 하나를 골라 브랜드의 성격이 드러나는 무드보드를 만드세요.\n\n· 브랜드 키워드 3개 정의\n· 컬러·타이포·이미지 레퍼런스 포함\n· 키워드마다 근거 한 줄씩 작성\n· 분량: A3 1매',
        attachments: [pdf('bd-guide', '무드보드_과제_가이드.pdf', '640KB')],
      },
    ],
    materials: [
      { label: '6주차 · 10.09', today: true, items: [pdf('bd-identity', '브랜드 아이덴티티 개론.pdf', '3.1MB', '10.09')] },
      { label: '1주차 · 09.04', items: [pdf('bd-ot', '오리엔테이션_브랜드디자인.pdf', '1.2MB', '09.04')] },
    ],
  },

  'ux-research': {
    notices: [
      {
        id: 'c1',
        title: '오늘 인터뷰 실습 준비물',
        date: '10.09 07:50',
        dateFull: '10.09 (금) 07:50',
        views: 31,
        isNew: true,
        thisWeek: true,
        body: '오늘(10/9) 수업은 2인 1조 인터뷰 실습으로 진행합니다. 녹음할 수 있는 기기(휴대폰 가능)와 질문지 초안을 준비해 주세요.',
      },
      {
        id: 'c2',
        title: '인터뷰 질문지 템플릿 업로드',
        date: '10.08 18:00',
        dateFull: '10.08 (목) 18:00',
        views: 49,
        isNew: true,
        thisWeek: true,
        body: '다음 주 현장 인터뷰에 쓸 질문지 템플릿을 강의자료에 올렸습니다. 수업 전까지 각자 질문 5개 이상을 초안으로 써 오세요.',
        attachment: UX_TEMPLATE,
      },
      {
        id: 'c3',
        title: '첫 수업 안내',
        date: '09.02',
        dateFull: '09.02 (수) 09:00',
        views: 102,
        body: '첫 수업에서는 학기 진행 방식과 팀 리서치 일정을 안내합니다. 이번 학기에는 실제 사용자를 만나는 현장 리서치를 두 번 진행합니다.',
      },
    ],
    assignments: [
      {
        id: 'a1',
        title: '리서치 질문 정리',
        due: d(9, 4, 23, 59),
        ...SUBMIT_DEFAULT,
        points: '5점',
        desc: '관심 있는 서비스 하나를 골라 그 서비스 사용자에게 묻고 싶은 리서치 질문을 정리하세요.\n\n· 리서치 목표 1문장\n· 핵심 질문 5개 이상\n· 질문마다 알고 싶은 점 메모',
        attachments: [],
        submitted: { file: '리서치질문정리_김유진.pdf', size: '1.1MB', at: '09.04 21:12' },
        closed: true,
      },
      {
        id: 'a2',
        title: '인터뷰 계획서',
        due: d(10, 16, 23, 59),
        ...SUBMIT_DEFAULT,
        points: '10점',
        desc: '다음 주 현장 인터뷰를 위해 팀별 인터뷰 대상과 질문지를 정리한 계획서를 제출하세요.\n\n· 인터뷰 대상과 섭외 방법\n· 질문지 (질문 5개 이상)\n· 일정과 역할 분담',
        attachments: [UX_TEMPLATE],
      },
    ],
    materials: [
      {
        label: '6주차 · 10.08',
        today: false,
        items: [UX_TEMPLATE, { id: 'ux-article', name: '인터뷰 질문 잘 만드는 법', kind: 'link', size: '외부 링크', date: '10.08' }],
      },
      { label: '1주차 · 09.04', items: [pdf('ux-intro', '리서치 개요.pdf', '2.4MB', '09.04')] },
    ],
  },

  'design-management': {
    notices: [
      {
        id: 'c1',
        title: '10월 12일 수업 읽기 자료',
        date: '10.07',
        dateFull: '10.07 (수) 12:10',
        views: 64,
        thisWeek: true,
        body: '다음 수업(10/12)에서는 디자인을 경영 전략으로 활용한 기업 사례를 다룹니다. 강의자료에 올린 사례 읽기 자료를 미리 읽고 오세요.',
      },
      {
        id: 'c2',
        title: '조 편성 결과 안내',
        date: '09.02',
        dateFull: '09.02 (수) 13:00',
        views: 95,
        body: '토론 수업 조 편성 결과를 강의실 게시판과 과목 게시판에 올렸습니다. 조별 첫 모임은 2주차 수요일 수업 시간에 진행합니다.',
      },
    ],
    // 토론 수업 — 이번 학기 등록된 과제 없음 (캘린더 과제 점과 맞춤)
    assignments: [],
    materials: [
      { label: '6주차 · 10.07', items: [pdf('dm-case', '디자인 주도 기업 사례 읽기.pdf', '3.4MB', '10.07'), pdf('dm-w2', '6주차 강의 슬라이드.pdf', '5.2MB', '10.07')] },
      // 10.05(월)은 대체공휴일 휴강 → 직전 수업(5주차 수) 자료로 둠
      { label: '5주차 · 09.30', items: [pdf('dm-def', '디자인 경영의 정의.pdf', '2.0MB', '09.30')] },
      { label: '1주차 · 09.02', items: [pdf('dm-ot', '오리엔테이션_디자인경영.pdf', '1.0MB', '09.02'), pdf('dm-syllabus', '강의계획서_디자인경영.pdf', '0.5MB', '09.02')] },
    ],
  },

  'motion-graphics': {
    notices: [
      {
        id: 'c1',
        title: '실습실 소프트웨어 안내',
        date: '09.03',
        dateFull: '09.03 (목) 15:00',
        views: 77,
        body: '디자인관 B103호 실습실 PC에 모션 작업용 소프트웨어가 설치되어 있습니다. 개인 노트북을 쓰는 학생은 수업 전에 설치와 실행을 확인해 주세요.',
      },
    ],
    assignments: [
      {
        id: 'a1',
        title: '키네틱 타이포그래피 스토리보드',
        due: d(10, 27, 14, 0),
        ...SUBMIT_DEFAULT,
        points: '10점',
        desc: '짧은 문장 하나를 골라 움직임으로 의미를 전달하는 키네틱 타이포그래피 스토리보드를 그리세요.\n\n· 문장 선정 이유\n· 8컷 이상 스토리보드\n· 컷마다 움직임·속도 메모',
        attachments: [pdf('mg-guide', '스토리보드_양식.pdf', '380KB')],
      },
    ],
    materials: [
      {
        label: '6주차 · 10.06',
        items: [pdf('mg-easing', '키프레임과 이징.pdf', '6.3MB', '10.06'), { id: 'mg-demo', name: '이징 비교 데모 영상', kind: 'video', size: '4분 12초', date: '10.06' }],
      },
      { label: '1주차 · 09.01', items: [pdf('mg-ot', '오리엔테이션_모션그래픽스.pdf', '1.5MB', '09.01')] },
    ],
  },

  writing: {
    professor: '한OO',
    notices: [
      {
        id: 'c1',
        title: '7주차 강의 오픈 안내',
        date: '10.08',
        dateFull: '10.08 (목) 09:00',
        views: 210,
        body: '7주차 강의는 10월 12일(월) 오전 9시에 열립니다. 주차별 학습 기간 안에 수강해야 진도가 인정되니 기간을 꼭 확인해 주세요.',
      },
    ],
    // 주차별 강의 수강이 출석·진도 — 이번 학기 등록된 과제 없음
    assignments: [],
    materials: [
      {
        label: '6주차 · 10.05',
        items: [{ id: 'wr-w2', name: '6주차 강의 · 글의 구조', kind: 'video', size: '25분', date: '10.05' }, pdf('wr-read2', '6주차 읽기 자료.pdf', '0.8MB', '10.05')],
      },
      { label: '1주차 · 09.01', items: [{ id: 'wr-w1', name: '1주차 강의 · 소통으로서의 글쓰기', kind: 'video', size: '22분', date: '09.01' }] },
    ],
  },
};

/* ── 조회 헬퍼 ─────────────────────────────────────────────── */
export const isCourseId = (id?: string): id is CourseId => !!id && COURSES.some((c) => c.id === id);

export function getCourse(id?: string): { course: Course; info: CourseInfo } {
  const course = courseById(id ?? '');
  return { course, info: COURSE_INFO[course.id] };
}
export const professorOf = (c: Course) => COURSE_INFO[c.id].professor ?? c.professor;

export const allFiles = (info: CourseInfo) => info.materials.flatMap((g) => g.items);

export function findAssignment(info: CourseInfo, aid?: string) {
  return info.assignments.find((a) => a.id === aid) ?? info.assignments[0];
}

/** 과제 라우트용: 과제가 없는 과목(직접 주소 입력)은 서비스디자인 과제로 대체해 화면이 깨지지 않게 */
export function getAssignment(id?: string, aid?: string): { course: Course; info: CourseInfo; a: Assignment } {
  const got = getCourse(id);
  if (got.info.assignments.length) return { ...got, a: findAssignment(got.info, aid) };
  const sd = getCourse('service-design');
  return { ...sd, a: findAssignment(sd.info, 'a1') };
}

/* ── 단일 기준 목록 (캘린더 · 게시판 과제 연결 · 연동 카운트가 모두 이걸 읽음) ── */
export type CourseAssignment = Assignment & { courseId: CourseId };
export const ASSIGNMENT_LIST: CourseAssignment[] = COURSES.flatMap((c) => COURSE_INFO[c.id].assignments.map((a) => ({ ...a, courseId: c.id })));
/** 아직 마감 전인 과제 (오늘 마감 포함) */
export const openAssignments = () => ASSIGNMENT_LIST.filter((a) => !a.closed && a.due.getTime() >= NOW.getTime());

/** 학교 연동(진입 411:11957 · 마이 426:8952) 카운트 — 데이터에서 계산
 *  과제 = 진행 중 과제 · 공지 = 이번 주(6주차) 과목 공지 + 학사 공지 */
export const SYNC_COUNTS = {
  assignments: openAssignments().length,
  notices: COURSES.reduce((a, c) => a + COURSE_INFO[c.id].notices.filter((n) => n.thisWeek).length, 0) + ACADEMIC_NOTICES.length,
};

const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (n: number) => String(n).padStart(2, '0');
const hm = (dt: Date) => `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
const dayStart = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();

/** D-DAY / D-4 / 마감 */
export function dday(due: Date) {
  const days = Math.round((dayStart(due) - dayStart(NOW)) / 86_400_000);
  if (due.getTime() < NOW.getTime()) return '마감';
  return days === 0 ? 'D-DAY' : `D-${days}`;
}
export const ddayCount = (due: Date) => Math.round((dayStart(due) - dayStart(NOW)) / 86_400_000);

/** '오늘 23:59' / '10.13(화) 14:00' */
export function dueShort(due: Date) {
  if (dayStart(due) === dayStart(NOW)) return `오늘 ${hm(due)}`;
  return `${due.getMonth() + 1}.${due.getDate()}(${DOW[due.getDay()]}) ${hm(due)}`;
}
/** '10월 9일 (금) 23:59' */
export const dueFull = (due: Date) => `${due.getMonth() + 1}월 ${due.getDate()}일 (${DOW[due.getDay()]}) ${hm(due)}`;

/** '14시간 18분 남음' / '4일 4시간 남음' */
export function remaining(due: Date) {
  const min = Math.round((due.getTime() - NOW.getTime()) / 60_000);
  if (min <= 0) return '마감됨';
  const dd = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  if (dd > 0) return h > 0 ? `${dd}일 ${h}시간 남음` : `${dd}일 남음`;
  return `${h}시간 ${m}분 남음`;
}

/** 수강과목 카드 메타: '김OO 교수 · 금 10:00 · 디자인관 302호' */
export function cardMeta(c: Course) {
  if (c.online) return `${professorOf(c)} 교수 · 온라인 강의 · ${c.credits}학점`;
  const days = c.slots.map((s) => s.day).join('·');
  return `${professorOf(c)} 교수 · ${days} ${c.slots[0].start} · ${c.room}`;
}
/** 과목 상세 메타: '김OO 교수 · 금 10:00–11:50 · 디자인관 302호' */
export function detailMeta(c: Course) {
  if (c.online) return `${professorOf(c)} 교수 · 사이버 강의 · 주차별 온라인 수강`;
  const days = c.slots.map((s) => s.day).join('·');
  return `${professorOf(c)} 교수 · ${days} ${c.slots[0].start}–${c.slots[0].end} · ${c.room}`;
}

export const kindLabel: Record<FileKind, string> = { pdf: 'PDF', link: '링크', video: '영상' };
/** 'PDF · 4.2MB' (+ ' · 10.09') */
export const fileMeta = (f: FileItem, withDate = false) =>
  [f.kind === 'link' ? '외부 링크' : kindLabel[f.kind], f.kind === 'link' ? undefined : f.size, withDate ? f.date : undefined].filter(Boolean).join(' · ');

/** 'MB' 합계 (PDF만) → '8.7MB' */
export function totalSize(files: FileItem[]) {
  const mb = files.reduce((a, f) => {
    const m = /([\d.]+)(MB|KB)/.exec(f.size);
    if (!m) return a;
    return a + (m[2] === 'KB' ? +m[1] / 1024 : +m[1]);
  }, 0);
  return `${mb.toFixed(1)}MB`;
}

/** 제출 샘플 파일명 — Figma '서비스분석리포트_전승민.pdf'는 실명이라 가상 인물(core USER)로 바꿈 */
export const sampleFileName = (title: string, userName: string) => `${title.replace(/\s+/g, '')}_${userName}.pdf`;
export const SAMPLE_SIZE = 3.8 * 1024 * 1024;
/** 데모용 제출 시각 (Figma 400:7849 '10:24 제출') */
export const SUBMIT_TIME = '10:24';
