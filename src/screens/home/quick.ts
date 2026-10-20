import { useCallback } from 'react';
import { toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { quickItem, type QuickItem } from '@/data/quickMenu';
import { useApp } from '@/store/app';
import { MENU_OVERRIDE } from './data';

/** 내 메뉴(공용 quickMenu 상태) 8개 — 홈 '내 메뉴' 블록과 부채꼴 퀵메뉴가 같은 목록을 쓴다 */
export function useMyMenu(): QuickItem[] {
  const ids = useApp((st) => st.quickMenu);
  return ids.map(quickItem).filter(Boolean).slice(0, 8) as QuickItem[];
}

/** 메뉴 하나 열기 — 목적지가 없으면 '다음 버전' 토스트. delay: 오버레이 닫힘 애니메이션 뒤에 이동 */
export function useOpenMenu() {
  const nav = useNav();
  return useCallback(
    (q: QuickItem, delay = 0) => {
      const o = MENU_OVERRIDE[q.id];
      const path = o?.path ?? q.path;
      const mode = o?.mode ?? q.mode ?? 'push';
      if (!path) {
        toast(q.note ?? '준비 중이에요');
        return;
      }
      const run = () => (mode === 'modal' ? nav.modal(path) : mode === 'tab' ? nav.tab(path) : nav.push(path));
      if (delay) window.setTimeout(run, delay);
      else run();
    },
    [nav],
  );
}
