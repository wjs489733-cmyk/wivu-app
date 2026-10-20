import { create } from 'zustand';
import { useApp } from '@/store/app';

/* ────────────────────────────────────────────────────────────
 * 홈 섹션 로컬 상태 — 홈 편집(v5 676:5225) 블록 켜기/끄기 · 순서
 *   '오늘 수업'(캐러셀)은 잠금 블록이라 여기 없음 — 항상 맨 위
 *   새로고침하면 초기화 (전역 useApp과 같은 정책) · 로그아웃하면 함께 초기화
 * ──────────────────────────────────────────────────────────── */
export type BlockId = 'notice' | 'todo' | 'deadline' | 'menu' | 'meal' | 'nextRoom' | 'library';

/** 홈 편집 목록 문구 (Figma 676:5225 그대로) */
export const BLOCKS: Record<BlockId, { title: string; desc: string }> = {
  notice: { title: '공지 한 줄', desc: '학사 공지 최신 1건' },
  todo: { title: '오늘 할 일', desc: '수업·일정·제출 마감' },
  deadline: { title: '마감 임박 과제', desc: '마감이 가까운 순서' },
  menu: { title: '내 메뉴', desc: '자주 쓰는 메뉴 8개' },
  meal: { title: '오늘의 학식', desc: '메뉴와 시간대별 혼잡도' },
  nextRoom: { title: '다음 강의실', desc: '다음 수업 장소와 도보 시간' },
  library: { title: '도서관 좌석', desc: '열람실 잔여 좌석' },
};
export const LOCKED_BLOCK = { title: '오늘 수업', desc: '지금·다음 수업 카드 · 출석 인증 · 항상 맨 위' };

const INITIAL_ORDER: BlockId[] = ['notice', 'todo', 'deadline', 'menu', 'meal', 'nextRoom', 'library'];
const INITIAL_ON: Record<BlockId, boolean> = { notice: true, todo: true, deadline: true, menu: true, meal: true, nextRoom: false, library: false };

type HomeBlocks = {
  order: BlockId[];
  on: Record<BlockId, boolean>;
  setOn: (id: BlockId, on: boolean) => void;
  setOrder: (order: BlockId[]) => void;
  /** 한 칸 위(-1)·아래(+1)로 — 키보드 순서 바꾸기 */
  move: (id: BlockId, dir: -1 | 1) => void;
  reset: () => void;
};

export const useHomeBlocks = create<HomeBlocks>((set) => ({
  order: INITIAL_ORDER,
  on: INITIAL_ON,
  setOn: (id, on) => set((st) => ({ on: { ...st.on, [id]: on } })),
  setOrder: (order) => set({ order }),
  move: (id, dir) =>
    set((st) => {
      const i = st.order.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= st.order.length) return st;
      const order = [...st.order];
      [order[i], order[j]] = [order[j], order[i]];
      return { order };
    }),
  reset: () => set({ order: INITIAL_ORDER, on: INITIAL_ON }),
}));

/** 홈에 보일 블록 (순서대로, 켜진 것만) */
export const useVisibleBlocks = () => {
  const order = useHomeBlocks((st) => st.order);
  const on = useHomeBlocks((st) => st.on);
  return order.filter((id) => on[id]);
};

// 로그아웃하면 홈 구성도 처음으로
useApp.subscribe((st, prev) => {
  if (st.loggedOut && !prev.loggedOut) useHomeBlocks.getState().reset();
});
