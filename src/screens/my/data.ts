import { QUICK_ITEMS, quickItem } from '@/data/quickMenu';

/* 마이·설정 데이터 — Figma v5 681:5941 · 701:8603 · 701:8324 · 676:5007 텍스트 그대로 */

/** 알림 종류 키 — 초기 설정(entry/Setup)도 같은 키로 저장한다(attendance·assignment·notice·board) */
export type NotiKey = 'attendance' | 'assignment' | 'notice' | 'board' | 'team' | 'meal';
export type QuietKey = 'quiet';

type ToggleItem<K> = { id: K; title: string; meta?: string; on: boolean };

/** 알림 설정 그룹 (701:8603) — 기본값도 Figma 그대로 (수업 3개만 켜짐) */
export const NOTI_GROUPS: { title: string; items: ToggleItem<NotiKey | QuietKey>[] }[] = [
  {
    title: '수업',
    items: [
      { id: 'attendance', title: '출석 인증 알림', meta: '인증이 열리면 바로 · 수업 시작 5분 전', on: true },
      { id: 'assignment', title: '과제 마감 알림', meta: '마감 24시간 전 · 3시간 전', on: true },
      { id: 'notice', title: '수업 공지', meta: '휴강 · 보강 · 강의실 변경', on: true },
    ],
  },
  {
    title: '게시판',
    items: [
      { id: 'board', title: '댓글 · 답글', meta: '내 글과 내 댓글에 달리면', on: false },
      { id: 'team', title: '팀플 신청 · 수락', on: false },
    ],
  },
  { title: '학교', items: [{ id: 'meal', title: '학식 메뉴', meta: '매일 11:00 · 오늘 메뉴 미리 보기', on: false }] },
  { title: '방해 금지', items: [{ id: 'quiet', title: '방해 금지 시간', meta: '23:00 – 08:00 · 출석 알림은 예외', on: false }] },
];

const ALL_TOGGLES = NOTI_GROUPS.flatMap((g) => g.items);
/** 알림 종류(방해 금지 제외) — '지금 N개 켜짐' 집계 대상. 초기 설정 화면도 이 목록의 id로 저장 여부를 거른다 */
export const NOTI_TYPES = ALL_TOGGLES.filter((o): o is ToggleItem<NotiKey> => o.id !== 'quiet');
export const INITIAL_TOGGLES = Object.fromEntries(ALL_TOGGLES.map((o) => [o.id, o.on])) as Record<NotiKey | QuietKey, boolean>;

/** 학교 연동으로 가져오는 정보 (701:8324) */
export const SYNC_ITEMS = ['시간표 · 수강과목', '출석 기록', '과제 · 공지 · 강의자료', '모바일 학생증 · 도서관 출입'];

export const APP_VERSION = '1.0.0';

/* ── 내 메뉴 (676:5007) ─────────────────────────────────────────
 * 고를 수 있는 12개 — Figma 2열 그리드 순서 그대로. 항목·이름은 공통 카탈로그(@/data/quickMenu) 그대로. */
export type MenuItem = { id: string; label: string };
export const MENU_ORDER = ['student-id', 'attendance', 'meal', 'assignment', 'calendar', 'notice', 'map', 'rental', 'library', 'exam', 'qr', 'shuttle'];

export function menuItem(id: string): MenuItem | undefined {
  const q = quickItem(id);
  return q ? { id, label: q.label } : undefined;
}
/** 그리드 목록: v5 12개 + 지금 담겨 있지만 v5 목록에 없는 것(예: 예전 구성의 '게시판') — 담긴 메뉴가 안 보이는 일이 없게 */
export function menuCatalog(...selected: string[][]): MenuItem[] {
  const extra = [...new Set(selected.flat())].filter((id) => !MENU_ORDER.includes(id) && QUICK_ITEMS.some((q) => q.id === id));
  return [...MENU_ORDER, ...extra].map(menuItem).filter(Boolean) as MenuItem[];
}

/** 받침 유무로 조사 고르기 — josa('도서관', '을/를') → '도서관을' */
export function josa(word: string, pair: '와/과' | '을/를' | '이/가' | '은/는') {
  const last = word.charCodeAt(word.length - 1);
  const hasBatchim = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  const [noBatchim, batchim] = pair === '와/과' ? ['와', '과'] : pair === '을/를' ? ['를', '을'] : pair === '이/가' ? ['가', '이'] : ['는', '은'];
  return `${word}${hasBatchim ? batchim : noBatchim}`;
}
