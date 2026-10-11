import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Logo, Screen, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import s from './Entry.module.css';

/**
 * 스플래시 — Figma 334:9435
 * 1.6초 후 변수 초기화(attendanceComplete=false, Selected school=대구가톨릭대학교) → 소개 1 (DISSOLVE)
 * 화면을 누르면 바로 넘어감.
 */
export function Splash() {
  const nav = useNav();
  const reset = useApp((st) => st.reset);

  useEffect(() => {
    reset();
    const t = setTimeout(() => nav.reset(P.intro(1), 'fade'), 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen bg="brand" figma="334:9435" scroll={false}>
      <button type="button" className={s.splash} onClick={() => nav.reset(P.intro(1), 'fade')} aria-label="WivU 시작하기">
        <motion.div className={s.splashField} initial={{ opacity: 0, rotate: -6, scale: 0.92 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
          <Logo name="splash-brand-field" height={352} />
        </motion.div>
        <div className={s.splashLogo}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}>
            <Logo name="logo-splash-symbol-white" height={121} />
          </motion.div>
        </div>
        <motion.div className={s.splashTag} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45, duration: 0.5 }}>
          <Text variant="headline" color="on-brand">
            캠퍼스의 하루를, 한 흐름으로.
          </Text>
        </motion.div>
        <div className={s.splashFoot}>
          <Text variant="caption-1" color="on-brand-muted">
            출석 · 과제 · 학교 일정
          </Text>
        </div>
      </button>
    </Screen>
  );
}
