import { motion } from 'motion/react';
import { Button, CtaBar, Icon, Screen, Text, type IconName } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import s from './Entry.module.css';

const EASE = [0.16, 1, 0.3, 1] as const;

/** 일러스트 타일 3장 — Figma 'illust' 240×200 안의 중심 좌표 · 회전(CSS 시계 방향 = Figma 값의 반대 부호) */
const TILES: { icon: IconName; cx: number; cy: number; rotate: number }[] = [
  { icon: 'attendance', cx: 50.3, cy: 59.4, rotate: 6 },
  { icon: 'assignment', cx: 187.4, cy: 64.3, rotate: -6 },
  { icon: 'calendar', cx: 118.8, cy: 153.2, rotate: 2 },
];

/**
 * 온보딩 — Figma v5 667:4468 (v4 소개 3장 → 1장으로 합침)
 * 일러스트 → Title 1 → Body 2 (가운데 정렬) · 하단 Primary L '시작하기' → 로그인 (PUSH)
 * 일러스트(240×200): 브랜드 8% 원 184 + 흰 타일 68(r20 · elevation/card) 3장에 출석·과제·일정 아이콘 30 — 코드로 재현.
 * 모션: 원 → 타일이 차례로 떠오르며 제자리 회전 → 정지 화면은 Figma와 같음.
 */
export function Onboarding() {
  const nav = useNav();
  return (
    <Screen
      figma="667:4468"
      scroll={false}
      footer={
        <CtaBar>
          <Button block onClick={() => nav.push(P.login)}>
            시작하기
          </Button>
        </CtaBar>
      }
    >
      <div className={s.onb}>
        <div className={s.onbArt} aria-hidden>
          <motion.span
            className={s.onbDisc}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
          />
          {TILES.map((t, i) => (
            <motion.span
              key={t.icon}
              className={s.onbTile}
              style={{ left: t.cx - 34, top: t.cy - 34 }}
              initial={{ opacity: 0, y: 14, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: t.rotate }}
              transition={{ duration: 0.55, delay: 0.12 + i * 0.08, ease: EASE }}
            >
              <Icon name={t.icon} color="brand" className={s.onbIcon} />
            </motion.span>
          ))}
        </div>
        <div className={s.onbCopy}>
          <Text variant="title-1" as="h1" align="center" className={s.preLine}>
            {'캠퍼스 생활을\n한 앱에서'}
          </Text>
          <Text variant="body-2" color="secondary" as="p" align="center" className={s.preLine}>
            {'출석·과제·학교 일정을 한곳에서 확인하고\n필요한 순간에 알림을 받아요.'}
          </Text>
        </div>
      </div>
    </Screen>
  );
}
