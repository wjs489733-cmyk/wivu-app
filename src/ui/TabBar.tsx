import { Icon, type IconName } from './Icon';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import s from './Screen.module.css';

export type TabKey = 'attendance' | 'courses' | 'home' | 'timetable' | 'board';

const TABS: { key: TabKey; label: string; icon: IconName; path: string }[] = [
  { key: 'attendance', label: '출석', icon: 'nav-attendance', path: P.attendance },
  { key: 'courses', label: '수강과목', icon: 'nav-courses', path: P.courses },
  { key: 'home', label: '홈', icon: 'nav-home', path: P.home },
  { key: 'timetable', label: '시간표', icon: 'nav-timetable', path: P.timetable },
  { key: 'board', label: '게시판', icon: 'nav-board', path: P.board },
];

/** 하단 탭바 — 출석 / 수강과목 / 홈(가운데 범프) / 시간표 / 게시판 */
export function TabBar({ active, onActivePress }: { active: TabKey; onActivePress?: () => void }) {
  const nav = useNav();
  return (
    <nav className={s.tabBar} aria-label="주요 메뉴">
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
              onClick={() => (isActive ? onActivePress?.() : nav.tab(t.path))}
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
