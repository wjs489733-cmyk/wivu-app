import { motion, type PanInfo } from 'motion/react';
import { Button, Icon, Logo, Screen, Text, type IconName } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { FitBox, TextLink } from './parts';
import illust1 from '@/assets/onboarding/intro-1.webp';
import illust2 from '@/assets/onboarding/intro-2.webp';
import illust3 from '@/assets/onboarding/intro-3.webp';
import s from './Entry.module.css';

/**
 * 소개 1·2·3 — Figma 리디자인 553:3086 · 553:3142 · 553:3177 (섹션 553:3072, 10-15)
 * 구조: 위 회색 무대(큰 단계 번호 + 일러스트) → 경계에 걸친 기능 카드 → 아래 흰 시트(문구 + 버튼)
 * 좌우로 밀어서 넘길 수도 있음.
 */
type Step = 1 | 2 | 3;
/** 일러스트 위치 — Figma 무대(392 × 342, 내비 아래 기준)의 좌표 그대로 */
const ART: Record<Step, { src: string; left: number; top: number; width: number; height: number }> = {
  1: { src: illust1, left: 28, top: 30, width: 336, height: 252 },
  2: { src: illust2, left: 60, top: 10, width: 272, height: 272 },
  3: { src: illust3, left: 9.6, top: 2, width: 366.4, height: 315 },
};
const COPY = {
  1: { eyebrow: '하나로 모으다', title: '캠퍼스의 하루를,\n한 화면에서', desc: '출석부터 과제, 학교 일정까지\nWivU에서 한 번에 확인해요.', cta: '다음', figma: '553:3086' },
  2: { eyebrow: '제때 알려주다', title: '놓치기 전에,\n필요한 알림만', desc: '출석 시간과 과제 마감, 학사 공지까지\n꼭 필요한 순간에 알려드려요.', cta: '다음', figma: '553:3142' },
  3: { eyebrow: '나에게 맞추다', title: '자주 쓰는 기능을,\n내 손에 가깝게', desc: '나에게 필요한 기능을 골라두고\n홈에서 위로 밀어 바로 열어요.', cta: '시작하기', figma: '553:3177' },
} as const;

export function Intro({ step }: { step: Step }) {
  const nav = useNav();
  const c = COPY[step];
  const art = ART[step];
  const next = () => (step < 3 ? nav.push(P.intro((step + 1) as 2 | 3)) : nav.push(P.school));
  const skip = () => nav.push(P.school);
  const back = () => (step > 1 ? nav.back(P.intro((step - 1) as 1 | 2)) : nav.back(P.splash));
  const onPanEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 && Math.abs(info.offset.y) < 60) next();
    else if (info.offset.x > 60 && step > 1) back();
  };

  return (
    <Screen
      figma={c.figma}
      bg="soft"
      scroll={false}
      hairline={false}
      indicatorTone="dark"
      header={
        <div className={s.introNav}>
          <span>
            {step > 1 && (
              <button type="button" className={s.introBack} aria-label="뒤로" onClick={back}>
                <Icon name="back" size={24} />
              </button>
            )}
          </span>
          <Pills step={step} total={3} />
          <span className={s.introSkip}>
            <TextLink onPress={skip}>건너뛰기</TextLink>
          </span>
        </div>
      }
    >
      <motion.div className={s.intro} onPanEnd={onPanEnd} style={{ touchAction: 'pan-y' }}>
        <div className={s.stage}>
          <FitBox width={392} height={342}>
            <span className={s.numeral} aria-hidden>
              0{step}
            </span>
            <motion.img
              key={step}
              src={art.src}
              alt=""
              draggable={false}
              className={s.stageArt}
              style={{ left: art.left, top: art.top, width: art.width, height: art.height }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </FitBox>
        </div>

        <div className={s.sheet}>
          <motion.div className={s.bridge} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
            {step === 1 && <TodayCard />}
            {step === 2 && <NotiCard />}
            {step === 3 && <QuickCard />}
          </motion.div>
          <p className={`${s.eyebrow} t-caption-1-strong`}>
            <span>0{step}</span>
            {c.eyebrow}
          </p>
          <Text variant="display" as="h2" className={s.heroTitle}>
            {c.title}
          </Text>
          <Text variant="body" color="secondary" as="p" className={s.heroTitle}>
            {c.desc}
          </Text>
          <Button block onClick={next} className={s.sheetCta}>
            {c.cta}
          </Button>
        </div>
      </motion.div>
    </Screen>
  );
}

/** 진행 표시 — 현재 단계만 길게(24) */
function Pills({ step, total }: { step: number; total: number }) {
  return (
    <div className={s.pills} role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={total} aria-label={`${total}단계 중 ${step}단계`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} data-on={i + 1 === step} />
      ))}
    </div>
  );
}

/* ── 경계 카드 3종 (흰 면 · 반경 20 · Elevation/Card) ─────────── */
function TodayCard() {
  const items: { icon: IconName; label: string; value: string; done?: boolean }[] = [
    { icon: 'attendance', label: '출석', value: '완료', done: true },
    { icon: 'assignment', label: '과제', value: 'D-DAY' },
    { icon: 'calendar', label: '학교 일정', value: '10.12 월' },
  ];
  return (
    <>
      <div className={s.bridgeHead}>
        <Text variant="headline">오늘의 캠퍼스</Text>
        <Logo name="logo-wu-blue" height={15} />
      </div>
      <div className={s.today}>
        {items.map((it) => (
          <span key={it.label} className={s.todayItem}>
            <span className={s.todayIcon} data-done={it.done}>
              <Icon name={it.icon} size={20} />
            </span>
            <span>
              <Text variant="caption-2" color="tertiary" as="span" style={{ display: 'block' }}>
                {it.label}
              </Text>
              <Text variant="caption-1-strong" color={it.done ? 'brand' : 'primary'} as="span" style={{ display: 'block' }}>
                {it.value}
              </Text>
            </span>
          </span>
        ))}
      </div>
    </>
  );
}

function NotiCard() {
  return (
    <>
      <div className={s.bridgeHead}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Logo name="logo-wu-blue" height={13} />
          <Text variant="caption-2" color="secondary">
            WivU
          </Text>
        </span>
        <Text variant="caption-2" color="tertiary">
          지금
        </Text>
      </div>
      <Text variant="subhead" as="p" style={{ marginTop: 10 }}>
        출석 인증 10분 전이에요
      </Text>
      <Text variant="caption-2" color="tertiary" as="p" style={{ marginTop: 4 }}>
        서비스디자인 · 디자인관 302호
      </Text>
    </>
  );
}

function QuickCard() {
  const items: { icon: IconName; label: string }[] = [
    { icon: 'attendance', label: '출석' },
    { icon: 'student', label: '학생증' },
    { icon: 'meal', label: '학식' },
    { icon: 'calendar', label: '캘린더' },
  ];
  return (
    <>
      <Text variant="caption-1-strong">내 퀵메뉴</Text>
      <div className={s.quick}>
        {items.map((it) => (
          <span key={it.label} className={s.quickItem}>
            <Icon name={it.icon} size={24} />
            <Text variant="caption-2" color="secondary">
              {it.label}
            </Text>
          </span>
        ))}
      </div>
    </>
  );
}

/** 앱 아이콘 안 흰색 WU 마크 — 확정 로고(logo-wu-blue)를 흰색으로만 바꿔 사용 (형태 수정 없음) */
export function WuMark({ height = 15 }: { height?: number }) {
  return <Logo name="logo-wu-blue" height={height} style={{ filter: 'brightness(0) invert(1)' }} />;
}
