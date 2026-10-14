import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { Icon, type IconName } from './Icon';
import { useScreen } from './screenContext';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import s from './Screen.module.css';

export type TabKey = 'attendance' | 'courses' | 'home' | 'timetable' | 'board';

const TABS: { key: TabKey; label: string; icon: IconName; path: string }[] = [
  { key: 'attendance', label: '출석', icon: 'attendance', path: P.attendance },
  { key: 'courses', label: '수강과목', icon: 'courses', path: P.courses },
  { key: 'home', label: '홈', icon: 'home', path: P.home },
  { key: 'timetable', label: '시간표', icon: 'timetable', path: P.timetable },
  { key: 'board', label: '게시판', icon: 'board', path: P.board },
];

/** 위로 밀기 판정 거리 (px) */
const SWIPE_UP = 30;

type TabBarProps = {
  active: TabKey;
  /** 활성 탭을 다시 눌렀을 때 — 없으면 화면 맨 위로 스크롤 */
  onActivePress?: () => void;
  /** 탭바(하단 영역)에서 위로 밀었을 때 — 홈 퀵메뉴 */
  onSwipeUp?: () => void;
};

/** 하단 탭바 — 출석 / 수강과목 / 홈(가운데 범프) / 시간표 / 게시판 */
export function TabBar({ active, onActivePress, onSwipeUp }: TabBarProps) {
  const nav = useNav();
  const screen = useScreen();
  const gesture = useRef<{ x: number; y: number; done: boolean } | null>(null);
  const suppressClick = useRef(false);
  const cleanup = useRef<() => void>(() => {});
  useEffect(() => () => cleanup.current(), []);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (!onSwipeUp || (e.pointerType === 'mouse' && e.button !== 0)) return;
    cleanup.current();
    gesture.current = { x: e.clientX, y: e.clientY, done: false };
    suppressClick.current = false;
    const move = (ev: PointerEvent) => {
      const g = gesture.current;
      if (!g || g.done) return;
      const dx = ev.clientX - g.x;
      const dy = ev.clientY - g.y;
      if (dy < -SWIPE_UP && Math.abs(dy) > Math.abs(dx)) {
        g.done = true;
        suppressClick.current = true; // 밀기가 끝난 버튼에서 탭 이동(click)이 일어나지 않게
        onSwipeUp();
      }
    };
    const up = () => {
      cleanup.current();
      // 같은 버튼 위에서 손을 떼면 click이 곧바로 이어진다 → 그 뒤에 해제
      window.setTimeout(() => (suppressClick.current = false), 0);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    cleanup.current = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      gesture.current = null;
      cleanup.current = () => {};
    };
  };

  return (
    <nav
      className={s.tabBar}
      aria-label="주요 메뉴"
      data-swipe={onSwipeUp ? 'true' : undefined}
      onPointerDown={onPointerDown}
      onClickCapture={(e) => {
        if (!suppressClick.current) return;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className={s.tabBg} />
      <div className={s.tabBump} />
      <div className={s.tabRow}>
        {TABS.map((t) => {
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              type="button"
              className={`${s.tab} ${t.key === 'home' ? s.tabHome : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => (isActive ? (onActivePress ?? screen?.scrollToTop)?.() : nav.tab(t.path))}
            >
              <Icon name={t.icon} size={24} />
              <span className={s.tabLabel}>{t.label}</span>
            </button>
          );
        })}
      </div>
      <div className={s.tabSafe} />
    </nav>
  );
}
