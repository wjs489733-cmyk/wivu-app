import type { CSSProperties, ReactElement } from 'react';
import { Icon, type IconName } from '@/ui';
import { icons } from '@/icons/icons.generated';

/* ────────────────────────────────────────────────────────────
 * 게시판 로컬 아이콘
 *  - 세트(WivU Icons v2)에 있는 건 그대로 위임: heart · image · block(→ban)
 *  - 눌린 상태(채움): 세트 모양에 fill만 더함 — heart-fill · bookmark-fill
 *  - 세트에 없는 것만 같은 규격(24 · 선 1.7 · round)으로 보충: link · reply → 세트 추가 후보
 * ──────────────────────────────────────────────────────────── */
export type LocalIconName = 'heart' | 'heart-fill' | 'bookmark-fill' | 'block' | 'link' | 'image' | 'reply';

const FROM_SET: Partial<Record<LocalIconName, IconName>> = { heart: 'heart', image: 'image', block: 'ban' };
const FILLED: Partial<Record<LocalIconName, IconName>> = { 'heart-fill': 'heart', 'bookmark-fill': 'bookmark' };

const line = { stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const PATHS: Partial<Record<LocalIconName, ReactElement>> = {
  link: (
    <>
      <path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5l-1 1" {...line} />
      <path d="M13.5 10.5a3.5 3.5 0 0 0-5 0L6 13a3.5 3.5 0 0 0 5 5l1-1" {...line} />
    </>
  ),
  reply: <path d="M7 5v6a3 3 0 0 0 3 3h8m0 0-3.5-3.5M18 14l-3.5 3.5" {...line} />,
};

export function LocalIcon({ name, size = 16, style }: { name: LocalIconName; size?: 16 | 20 | 24; style?: CSSProperties }) {
  const set = FROM_SET[name];
  if (set) return <Icon name={set} size={size} style={style} />;
  const filled = FILLED[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0, ...style }}>
      {filled ? <g fill="currentColor" dangerouslySetInnerHTML={{ __html: icons[filled].body }} /> : PATHS[name]}
    </svg>
  );
}
