import { useState } from 'react';
import { toast } from '@/ui';
import type { Post } from './data';
import { useBoard } from './store';

/* ── 팀플 참여 신청 흐름 (상태만) ─────────────────────────────
 * 버튼 → 확인 시트 → 신청 완료(3/5 → 4/5, '신청 완료') · 다시 누르면 취소 확인
 * 화면은 <ApplyOverlay flow={…}/>를 Screen overlay에 둔다. */
export type ApplyFlow = ReturnType<typeof useApplyFlow>;

export function useApplyFlow() {
  const setApplied = useBoard((st) => st.setApplied);
  const applied = useBoard((st) => st.applied);
  const [target, setTarget] = useState<Post | null>(null);
  const [sheet, setSheet] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  const request = (post: Post) => {
    setTarget(post);
    if (applied[post.id]) setCancel(true);
    else {
      setNote('');
      setSheet(true);
    }
  };

  const confirm = () => {
    if (!target) return;
    setLoading(true);
    setTimeout(() => {
      setApplied(target.id, true);
      setLoading(false);
      setSheet(false);
      toast('참여 신청을 보냈어요', 'check');
    }, 650);
  };

  const confirmCancel = () => {
    if (target) setApplied(target.id, false);
    setCancel(false);
    toast('참여 신청을 취소했어요');
  };

  return {
    target,
    sheet,
    cancel,
    loading,
    note,
    setNote,
    request,
    confirm,
    confirmCancel,
    closeSheet: () => !loading && setSheet(false),
    closeCancel: () => setCancel(false),
  };
}
