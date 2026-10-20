import { motion } from 'motion/react';
import { Button, CtaBar, Screen, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import illust from '@/assets/onboarding/intro-1.webp';
import s from './Entry.module.css';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * 온보딩 — Figma v5 667:4468 (v4 소개 3장 → 1장으로 합침)
 * 일러스트 → Title 1 → Body 2 (가운데 정렬) · 하단 Primary L '시작하기' → 로그인 (PUSH)
 * 일러스트: Figma는 '임시(단순 일러스트로 교체)' 자리표시 → 기존 소개 1 일러스트(intro-1.webp)를 같은 높이(200)로 사용.
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
        <motion.img
          src={illust}
          alt=""
          draggable={false}
          className={s.onbArt}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        />
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
