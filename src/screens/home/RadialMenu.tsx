import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Icon, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useMyMenu, useOpenMenu } from './quick';
import s from './RadialMenu.module.css';

/** 닫힘 애니메이션이 끝난 뒤 이동 (ms) */
const EXIT_MS = 160;
const DEG = Math.PI / 180;
/** 자리 순서 → 위치 (Figma 675:5022): 안쪽 원 3개(가운데·왼쪽·오른쪽) → 바깥 원 5개 */
const SLOTS: { ring: 'inner' | 'outer'; angle: number }[] = [
  { ring: 'inner', angle: 0 },
  { ring: 'inner', angle: -50 },
  { ring: 'inner', angle: 50 },
  { ring: 'outer', angle: -30 },
  { ring: 'outer', angle: -60 },
  { ring: 'outer', angle: 0 },
  { ring: 'outer', angle: 30 },
  { ring: 'outer', angle: 60 },
];

/**
 * 홈 퀵메뉴 · 부채꼴 — Figma v5 675:5022 (홈 탭 길게 누르기)
 * 탭바 홈 자리(가운데 닫기 버튼)를 중심으로 흰 반원이 펼쳐지고, 내 메뉴 8개가 두 겹으로 놓인다. 왼쪽 '내 메뉴 N' · 오른쪽 '편집'.
 * 길게 누른 손가락을 떼지 않고 메뉴 위로 끌어 놓으면 바로 열린다(올라간 항목 = 파란 면, Figma의 '출석' 강조 상태).
 * 떼고 나서 눌러도 된다. 딤·닫기·Esc로 닫힘.
 */
export function RadialMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNav();
  const items = useMyMenu();
  const openMenu = useOpenMenu();
  const layer = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [hot, setHot] = useState<string | null>(null);
  const [width, setWidth] = useState(392);

  const activate = useCallback(
    (id: string) => {
      onClose();
      if (id === 'edit') {
        window.setTimeout(() => nav.push(P.myQuickMenu), EXIT_MS);
        return;
      }
      const q = items.find((x) => x.id === id);
      if (q) openMenu(q, EXIT_MS);
    },
    [items, nav, onClose, openMenu],
  );

  // 창 리스너는 열릴 때 한 번만 건다 — 최신 콜백은 ref로 읽음 (부모가 다시 그려져도 '끌어서 고르기' 상태 유지)
  const latest = useRef({ activate, onClose });
  useLayoutEffect(() => {
    latest.current = { activate, onClose };
  });
  useLayoutEffect(() => {
    if (open && layer.current) setWidth(layer.current.offsetWidth);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    menu.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && latest.current.onClose();
    // 길게 누른 손가락이 아직 눌려 있으면(armed) 끌어서 고르기 — 새로 누르면(일반 클릭) 해제
    let armed = true;
    const pick = (x: number, y: number) => (document.elementFromPoint(x, y)?.closest('[data-fan-id]') as HTMLElement | null)?.dataset.fanId ?? null;
    const down = () => {
      armed = false;
      setHot(null);
    };
    const move = (e: PointerEvent) => {
      if (armed) setHot(pick(e.clientX, e.clientY));
    };
    const up = (e: PointerEvent) => {
      if (!armed) return;
      armed = false;
      setHot(null);
      const id = pick(e.clientX, e.clientY);
      if (id) latest.current.activate(id);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [open]);

  // 바깥 원 반지름 190 · 안쪽 106 (Figma). 좁은 화면(375)에선 양 끝 메뉴가 잘리지 않게 줄인다
  const outerR = Math.min(190, (width / 2 - 31) / Math.sin(60 * DEG));
  const innerR = (outerR * 106) / 190;

  return (
    <AnimatePresence>
      {open && (
        <div className={s.layer} ref={layer}>
          <motion.div className={s.scrim} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose} />
          <motion.div
            ref={menu}
            className={s.origin}
            role="menu"
            aria-label="내 메뉴"
            tabIndex={-1}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0, transition: { duration: 0.16 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <div className={s.plane} />
            {items.map((q, i) => {
              const slot = SLOTS[i];
              const r = slot.ring === 'inner' ? innerR : outerR;
              const x = Math.sin(slot.angle * DEG) * r;
              const y = -Math.cos(slot.angle * DEG) * r;
              return (
                <motion.button
                  key={q.id}
                  type="button"
                  role="menuitem"
                  data-fan-id={q.id}
                  data-hot={hot === q.id || undefined}
                  className={s.item}
                  style={{ left: x, top: y }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1, transition: { delay: 0.02 * i, type: 'spring', stiffness: 500, damping: 30 } }}
                  onClick={() => activate(q.id)}
                >
                  <Icon name={q.icon} size={20} />
                  <Text variant="caption-2-strong" color="inherit" className={s.label}>
                    {q.label}
                  </Text>
                </motion.button>
              );
            })}
            <button type="button" className={s.close} onClick={onClose} aria-label="퀵메뉴 닫기">
              <Icon name="close" size={24} color="on-brand" />
            </button>
          </motion.div>
          <motion.div className={s.bottomRow} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <Text variant="caption-1-strong" color="tertiary" className={s.count} tnum>
              내 메뉴 {items.length}
            </Text>
            <button type="button" className={s.edit} data-fan-id="edit" data-hot={hot === 'edit' || undefined} onClick={() => activate('edit')}>
              <Icon name="edit" size={16} />
              <Text variant="caption-1-strong" color="inherit">
                편집
              </Text>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
