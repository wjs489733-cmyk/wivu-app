import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Logo, Screen, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { useEntry } from './store';
import s from './Entry.module.css';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * 스플래시 — Figma v5 667:4454 (섹션 '01 진입 · 로그인 (v5)')
 * 파랑 전면 + 흰 심볼 · WivU · 약속 문구. 뒤의 흰 8% 면 두 장이 ±8°로 벌어지며 들어옴.
 * 모션: 면 0.9s → 심볼 0.6s(+0.15s) → 이름(+0.3s) → 문구(+0.45s).
 * 1.6초 후 변수 초기화(attendanceComplete=false, Selected school=대구가톨릭대학교) → 온보딩 (DISSOLVE). 화면을 누르면 바로 넘어감.
 */
export function Splash() {
  const nav = useNav();
  const reset = useApp((st) => st.reset);

  useEffect(() => {
    reset();
    useEntry.getState().clearSchool();
    const t = setTimeout(() => nav.reset(P.intro(1), 'fade'), 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 면: 흰 20%(bg-on-brand-tint) × 불투명도 0.4 = Figma #FFFFFF 8%
  const plane = { duration: 0.9, ease: EASE };
  return (
    <Screen bg="brand" figma="667:4454" scroll={false}>
      <button type="button" className={s.splash} onClick={() => nav.reset(P.intro(1), 'fade')} aria-label="WivU 시작하기">
        <div className={s.splashCenter}>
          <motion.span className={s.splashPlane} initial={{ opacity: 0, rotate: 0, scale: 0.9 }} animate={{ opacity: 0.4, rotate: 8, scale: 1 }} transition={plane} />
          <motion.span className={s.splashPlane} initial={{ opacity: 0, rotate: 0, scale: 0.9 }} animate={{ opacity: 0.4, rotate: -8, scale: 1 }} transition={{ ...plane, delay: 0.05 }} />
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease: EASE }}>
            <Logo name="logo-splash-symbol-white" height={101} />
          </motion.div>
          <div className={s.splashCopy}>
            <motion.p className={`${s.splashName} font-en`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3, ease: EASE }}>
              WivU
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45, duration: 0.5 }}>
              <Text variant="title-3" color="on-brand-muted" as="p">
                캠퍼스의 하루를, 한 흐름으로.
              </Text>
            </motion.div>
          </div>
        </div>
        <div className={s.splashFoot}>
          <Text variant="caption-1" color="on-brand" style={{ opacity: 0.7 }}>
            출석 · 과제 · 학교 일정
          </Text>
        </div>
      </button>
    </Screen>
  );
}
