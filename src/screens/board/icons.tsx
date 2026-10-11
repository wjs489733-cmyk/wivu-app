import type { CSSProperties, ReactElement } from 'react';

/* ────────────────────────────────────────────────────────────
 * 게시판 로컬 아이콘 — 아이콘 세트에 없는 채움/보조 아이콘
 * 24 viewBox · stroke 2 · round cap · currentColor (가이드 3절)
 * 공통화 후보: heart(-fill), bookmark-fill, block, link, image, reply
 * ──────────────────────────────────────────────────────────── */
export type LocalIconName = 'heart' | 'heart-fill' | 'bookmark-fill' | 'block' | 'link' | 'image' | 'reply';

const PATHS: Record<LocalIconName, ReactElement> = {
  heart: <path d="M12 19.5s-7-4.4-7-9.6A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.3c0 5.2-7 9.6-7 9.6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  'heart-fill': <path d="M12 19.5s-7-4.4-7-9.6A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.3c0 5.2-7 9.6-7 9.6Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  'bookmark-fill': <path d="M7 5H17V19L12 15.8889L7 19V5Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  block: (
    <>
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="2" />
      <path d="M6.8 17.2 17.2 6.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  link: (
    <>
      <path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5l-1 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 10.5a3.5 3.5 0 0 0-5 0L6 13a3.5 3.5 0 0 0 5 5l1-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  image: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <path d="m5 17 4.5-4.5 3 3 2.5-2.5L19 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  reply: <path d="M7 5v6a3 3 0 0 0 3 3h8m0 0-3.5-3.5M18 14l-3.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
};

export function LocalIcon({ name, size = 16, style }: { name: LocalIconName; size?: 16 | 20 | 24; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0, ...style }}>
      {PATHS[name]}
    </svg>
  );
}
