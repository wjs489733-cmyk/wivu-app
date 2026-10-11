import { motion } from 'motion/react';
import { Button, Icon, Screen, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import s from './AttendanceDone.module.css';

/** 출석 인증 완료 — Figma 372:7221 (브랜드 배경, DISSOLVE로 진입) */
export function AttendanceDone() {
  const nav = useNav();
  const time = useApp((st) => st.attendanceTime) ?? '10:01';
  const method = useApp((st) => st.attendanceMethod) ?? 'PIN';
  return (
    <Screen bg="brand" figma="372:7221" scroll={false}>
      <div className={s.wrap}>
        <div className={s.center}>
          <motion.div className={s.badge} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}>
            <span className={s.halo} />
            <span className={s.circle}>
              <motion.svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--wivu-color-bg-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.35 }} />
              </motion.svg>
            </span>
          </motion.div>
          <Text variant="display" color="on-brand" as="h1" align="center" style={{ marginTop: 40 }}>
            출석 완료
          </Text>
          <Text variant="body" color="on-brand-muted" as="p" align="center" style={{ marginTop: 4 }}>
            서비스디자인 · {time} 인증
          </Text>
          <div className={s.info}>
            <Text variant="label" color="on-brand" as="p">
              디자인관 302호 · 10:00 – 11:50
            </Text>
            <Text variant="caption-1" color="on-brand-muted" as="p" style={{ marginTop: 4 }}>
              정상 출석으로 기록되었습니다 · {method} 인증
            </Text>
          </div>
        </div>
        <div className={s.actions}>
          <Button variant="onBrand" block onClick={() => nav.reset(P.home)}>
            홈으로
          </Button>
          <button type="button" className={`${s.link} t-label`} onClick={() => nav.reset(P.attendance)}>
            오늘 출석 현황 보기 <Icon name="chevron-right" size={16} />
          </button>
        </div>
      </div>
    </Screen>
  );
}
