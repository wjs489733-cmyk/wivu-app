import { AnimatePresence, motion } from 'motion/react';
import { Icon, Text, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { quickItem, RADIAL_DEFAULT, type QuickItem } from '@/data/quickMenu';
import s from './RadialMenu.module.css';

/**
 * 홈 퀵메뉴(레디얼) — Figma 308:11745
 * 홈에서 활성 '홈' 탭을 다시 누르면 열림. 8개 메뉴가 원형으로 펼쳐지고 가운데 '메뉴 추가'.
 */
export function RadialMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNav();
  const items = RADIAL_DEFAULT.map(quickItem).filter(Boolean) as QuickItem[];
  const R = 118;

  const go = (q: QuickItem) => {
    onClose();
    if (!q.path) {
      toast(q.note ?? '준비 중이에요');
      return;
    }
    setTimeout(() => {
      if (q.mode === 'modal') nav.modal(q.path!);
      else if (q.mode === 'tab') nav.tab(q.path!);
      else nav.push(q.path!);
    }, 160);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className={s.layer}>
          <motion.div className={s.scrim} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className={s.dial}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            role="menu"
            aria-label="퀵메뉴"
          >
            <svg className={s.spokes} viewBox="-160 -160 320 320" aria-hidden>
              {items.map((_, i) => {
                const a = ((i + 0.5) / items.length) * Math.PI * 2 - Math.PI / 2;
                return <line key={i} x1={Math.cos(a) * 82} y1={Math.sin(a) * 82} x2={Math.cos(a) * 160} y2={Math.sin(a) * 160} />;
              })}
            </svg>
            <div className={s.inner} />
            {items.map((q, i) => {
              const a = (i / items.length) * Math.PI * 2 - Math.PI / 2;
              return (
                <motion.button
                  key={q.id}
                  type="button"
                  role="menuitem"
                  className={s.item}
                  style={{ left: `calc(50% + ${Math.cos(a) * R}px)`, top: `calc(50% + ${Math.sin(a) * R}px)` }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1, transition: { delay: 0.03 * i } }}
                  onClick={() => go(q)}
                >
                  <span className={s.itemIcon}>
                    <Icon name={q.icon} size={20} />
                  </span>
                  <Text variant="caption-2-strong">{q.label}</Text>
                </motion.button>
              );
            })}
            <button
              type="button"
              className={s.add}
              onClick={() => {
                onClose();
                setTimeout(() => nav.push(P.myQuickMenu), 160);
              }}
            >
              <Icon name="plus" size={20} color="brand" />
              <Text variant="caption-2-strong" color="brand">
                메뉴 추가
              </Text>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
