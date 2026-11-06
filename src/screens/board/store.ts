import { useMemo } from 'react';
import { create } from 'zustand';
import { useNow } from '@/data/clock';
import { POSTS, RECENT_SEARCHES, seedComments, seedVisible, type BoardId, type Comment, type Post } from './data';

/* ────────────────────────────────────────────────────────────
 * 게시판 섹션 상태 (섹션 로컬 zustand — 전역 useApp은 건드리지 않음)
 * 새로고침하면 초기화 (전시용 의도된 동작)
 * ──────────────────────────────────────────────────────────── */
type BoardState = {
  /** 내가 쓴 글 (최신이 앞) */
  created: Post[];
  /** 글 수정 (내 글 메뉴 '수정하기' → 글쓰기 화면) — id → 바뀐 필드 */
  edits: Record<string, Partial<Post>>;
  /** 최근 검색어 (검색 레이어 699:8103) */
  recent: string[];
  /** 글·댓글 공감 (id → on). 없으면 시드 likedByMe */
  liked: Record<string, boolean>;
  scrapped: Record<string, boolean>;
  /** 글별로 내가 단 댓글 */
  added: Record<string, Comment[]>;
  /** 팀플 참여 신청 */
  applied: Record<string, boolean>;
  /** 차단·삭제로 숨긴 글 */
  hidden: string[];
  /** 방문한 게시판 (새 글 점 지우기) */
  seen: string[];

  addPost: (p: Post) => void;
  updatePost: (id: string, patch: Partial<Post>) => void;
  pushRecent: (q: string) => void;
  removeRecent: (q: string) => void;
  toggleLike: (id: string, initial?: boolean) => boolean;
  toggleScrap: (id: string) => boolean;
  addComment: (postId: string, c: Omit<Comment, 'id' | 'postId'>) => Comment;
  setApplied: (postId: string, v: boolean) => void;
  hide: (postId: string) => void;
  markSeen: (boardId: BoardId) => void;
};

export const useBoard = create<BoardState>((set, get) => ({
  created: [],
  edits: {},
  recent: RECENT_SEARCHES,
  liked: {},
  scrapped: {},
  added: {},
  applied: {},
  hidden: [],
  seen: [],

  addPost: (p) => set((st) => ({ created: [p, ...st.created] })),
  updatePost: (id, patch) => set((st) => ({ edits: { ...st.edits, [id]: { ...st.edits[id], ...patch } } })),
  pushRecent: (q) => set((st) => ({ recent: [q, ...st.recent.filter((r) => r !== q)].slice(0, 8) })),
  removeRecent: (q) => set((st) => ({ recent: st.recent.filter((r) => r !== q) })),
  toggleLike: (id, initial = false) => {
    const next = !(get().liked[id] ?? initial);
    set((st) => ({ liked: { ...st.liked, [id]: next } }));
    return next;
  },
  toggleScrap: (id) => {
    const next = !get().scrapped[id];
    set((st) => ({ scrapped: { ...st.scrapped, [id]: next } }));
    return next;
  },
  addComment: (postId, c) => {
    const list = get().added[postId] ?? [];
    const comment: Comment = { ...c, id: `${postId}-m${list.length + 1}`, postId };
    set((st) => ({ added: { ...st.added, [postId]: [...list, comment] } }));
    return comment;
  },
  setApplied: (postId, v) => set((st) => ({ applied: { ...st.applied, [postId]: v } })),
  hide: (postId) => set((st) => ({ hidden: [...st.hidden, postId] })),
  markSeen: (boardId) => set((st) => (st.seen.includes(boardId) ? st : { seen: [...st.seen, boardId] })),
}));

/* ── 파생 데이터 훅 ─────────────────────────────────────────── */

/** 보이는 글 전체 (내가 쓴 글이 맨 앞 · 수정 내용 반영)
 *  시드 글은 작성 시각(postedAt)이 지금 이전인 것만 — 매 분 다시 계산 (내가 쓴 글은 항상) */
export function useAllPosts(): Post[] {
  const created = useBoard((st) => st.created);
  const hidden = useBoard((st) => st.hidden);
  const edits = useBoard((st) => st.edits);
  const now = useNow();
  return useMemo(
    () => [...created, ...POSTS.filter((p) => seedVisible(p.postedAt, now))].filter((p) => !hidden.includes(p.id)).map((p) => (edits[p.id] ? { ...p, ...edits[p.id] } : p)),
    [created, hidden, edits, now],
  );
}

/** 지금까지 달린 시드 댓글 (작성 시각이 지금 이전) */
const seedSoFar = (post: Post, now: Date) => seedComments(post).filter((c) => seedVisible(c.at, now));

export function usePost(pid: string | undefined): Post | undefined {
  const all = useAllPosts();
  return all.find((p) => p.id === pid);
}

/** 공감·댓글·스크랩 수 (시드 + 내 반응) */
export function usePostStats(post: Post) {
  const liked = useBoard((st) => st.liked[post.id]) ?? !!post.likedByMe;
  const scrapped = useBoard((st) => !!st.scrapped[post.id]);
  const mine = useBoard((st) => st.added[post.id]);
  const now = useNow();
  return {
    liked,
    likeCount: post.likes - (post.likedByMe ? 1 : 0) + (liked ? 1 : 0),
    scrapped,
    // 시드 댓글 수(post.comments)는 시드 댓글이 다 달린 뒤의 수 → 지금까지 달린 것만 센다
    commentCount: seedSoFar(post, now).length + (mine?.length ?? 0),
  };
}

/** 시드 댓글 + 내가 단 댓글을 스레드 순서(부모 → 답글)로 */
export function useThread(post: Post) {
  const mine = useBoard((st) => st.added[post.id]);
  const now = useNow();
  return useMemo(() => {
    const all = [...seedSoFar(post, now), ...(mine ?? [])];
    const roots = all.filter((c) => !c.parent);
    const out: Comment[] = [];
    for (const r of roots) {
      out.push(r);
      out.push(...all.filter((c) => c.parent === r.id));
    }
    return { comments: out, total: all.length };
  }, [post, mine, now]);
}

/** 팀플 모집 현황 */
export function useRecruit(post: Post) {
  const applied = useBoard((st) => !!st.applied[post.id]);
  const r = post.recruit;
  const current = (r?.current ?? 0) + (applied ? 1 : 0);
  return { applied, current, max: r?.max ?? 0, full: !!r && !applied && r.current >= r.max };
}
