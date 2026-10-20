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
  /** 홈 탭을 길게 눌렀을 때(0.5초) — v5: 레이디얼 퀵메뉴. 없으면 홈으로 가서 퀵메뉴를 연다(`/home?menu=1`) */
  onHomeLongPress?: () => void;
};

/** 길게 누르기 판정 시간 (ms) — Figma 프로토타입 MOUSE_DOWN 0.5초와 같게 */
const LONG_PRESS = 500;

/** 하단 탭바 v5 (Figma 666:5059) — 출석 / 수강과목 / 홈(가운데 혹) / 시간표 / 게시판. 홈 탭을 길게 누르면 레이디얼 퀵메뉴 */
export function TabBar({ active, onActivePress, onSwipeUp, onHomeLongPress }: TabBarProps) {
  const nav = useNav();
  const screen = useScreen();
  const gesture = useRef<{ x: number; y: number; done: boolean } | null>(null);
  const suppressClick = useRef(false);
  const cleanup = useRef<() => void>(() => {});
  useEffect(() => () => cleanup.current(), []);
  const pressTimer = useRef<number | null>(null);
  const clearPress = () => {
    if (pressTimer.current !== null) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };
  useEffect(() => clearPress, []);
  const startHomePress = (e: ReactPointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    clearPress();
    const x = e.clientX;
    const y = e.clientY;
    const cancelOnMove = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - x, ev.clientY - y) > 10) stop();
    };
    const stop = () => {
      clearPress();
      window.removeEventListener('pointermove', cancelOnMove);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
    window.addEventListener('pointermove', cancelOnMove);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    pressTimer.current = window.setTimeout(() => {
      pressTimer.current = null;
      suppressClick.current = true; // 손을 뗄 때 이어지는 click(홈 이동)을 막는다
      window.setTimeout(() => (suppressClick.current = false), 600);
      navigator.vibrate?.(10);
      if (onHomeLongPress) onHomeLongPress();
      else nav.tab(`${P.home}?menu=1`);
    }, LONG_PRESS);
  };

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
              aria-description={t.key === 'home' ? '길게 누르면 내 메뉴' : undefined}
              onPointerDown={t.key === 'home' ? startHomePress : undefined}
              onContextMenu={t.key === 'home' ? (e) => e.preventDefault() : undefined}
              onClick={() => (isActive ? (onActivePress ?? screen?.scrollToTop)?.() : nav.tab(t.path))}
            >
              <Icon name={t.icon} size={24} />
              <span className={`${s.tabLabel} ${isActive ? 't-caption-2-strong' : 't-caption-2'}`}>{t.label}</span>
            </button>
          );
        })}
      </div>
      <div className={s.tabSafe} />
    </nav>
  );
}
