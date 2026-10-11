import { motion, type PanInfo } from 'motion/react';
import { Button, Icon, Logo, Screen, Text, type IconName } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { EntryHeader, FitBox, TextLink } from './parts';
import illust1 from '@/assets/onboarding/intro-1.webp';
import illust2 from '@/assets/onboarding/intro-2.webp';
import illust3 from '@/assets/onboarding/intro-3.webp';
import s from './Entry.module.css';

/**
 * 소개 1·2·3 — Figma 366:9791 · 366:9817 · 410:8227
 * 캔버스 메모 반영: '건너뛰기'를 [다음] 버튼 바로 위 가운데로 이동.
 * 좌우로 밀어서 넘길 수도 있음.
 */
const COPY = {
  1: { title: '앱 세 개를 오가던 하루,\n이제 하나면 됩니다', desc: '출석부터 과제 제출, 학교 일정까지 한 화면에서 확인하고 처리합니다.', cta: '다음', img: illust1, figma: '366:9791' },
  2: { title: '마감 전에\n먼저 알려드릴게요', desc: '과제 마감, 출석 시간, 학사 공지를 놓치지 않도록 꼭 필요한 순간에만 알려드려요.', cta: '다음', img: illust2, figma: '366:9817' },
  3: { title: '나의 루틴에 맞게\n퀵메뉴를 구성해요', desc: '자주 쓰는 기능을 골라두면 홈 어디서든 위로 밀어 바로 열 수 있어요.', cta: '시작하기', img: illust3, figma: '410:8227' },
} as const;

export function Intro({ step }: { step: 1 | 2 | 3 }) {
  const nav = useNav();
  const c = COPY[step];
  const next = () => (step < 3 ? nav.push(P.intro((step + 1) as 2 | 3)) : nav.push(P.school));
  const skip = () => nav.push(P.school);
  const onPanEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 && Math.abs(info.offset.y) < 60) next();
    else if (info.offset.x > 60 && step > 1) nav.back();
  };

  return (
    <Screen
      figma={c.figma}
      scroll={false}
      header={<EntryHeader back={step > 1} progress={{ step, total: 3 }} />}
    >
      <motion.div className={s.intro} onPanEnd={onPanEnd} style={{ touchAction: 'pan-y' }}>
        <div className={s.hero}>
          <Text variant="display" as="h2" className={s.heroTitle}>
            {c.title}
          </Text>
          <Text variant="body" color="secondary" as="p">
            {c.desc}
          </Text>
        </div>

        <div className={s.introVisual}>
          <FitBox width={352} height={404}>
            <img src={c.img} alt="" className={s.illust} draggable={false} />
            {step === 1 && <Visual1 />}
            {step === 2 && <Visual2 />}
            {step === 3 && <Visual3 />}
          </FitBox>
        </div>

        <div className={s.introFoot}>
          {step < 3 && <TextLink onPress={skip}>건너뛰기</TextLink>}
          <Button block onClick={next}>
            {c.cta}
          </Button>
        </div>
      </motion.div>
    </Screen>
  );
}

const pop = (i: number) => ({
  initial: { opacity: 0, y: 14, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { delay: 0.25 + i * 0.12, duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
});

function FloatCard({ x, y, icon, iconBg, title, titleColor, meta, i }: { x: number; y: number; icon: IconName; iconBg: string; title: string; titleColor?: 'error'; meta: string; i: number }) {
  return (
    <motion.div className={s.floatCard} style={{ left: x, top: y }} {...pop(i)}>
      <span className={s.floatIcon} style={{ background: iconBg }}>
        <Icon name={icon} size={20} color="primary" />
      </span>
      <span>
        <Text variant="label" as="p" color={titleColor ?? 'primary'}>
          {title}
        </Text>
        <Text variant="caption-2" color="secondary" as="p">
          {meta}
        </Text>
      </span>
    </motion.div>
  );
}

function Visual1() {
  return (
    <>
      <motion.span className={`${s.pill} t-caption-2-strong`} {...pop(0)}>
        앱 3개 → WivU 1개
      </motion.span>
      <FloatCard i={1} x={0} y={236} icon="nav-attendance" iconBg="var(--wivu-color-bg-brand-soft)" title="출석 인증 완료" meta="서비스디자인 · 10:01" />
      <FloatCard i={2} x={120} y={296} icon="assignment" iconBg="var(--wivu-color-bg-subtle)" title="과제 마감 D-DAY" titleColor="error" meta="서비스 분석 리포트 · 23:59" />
      <FloatCard i={3} x={24} y={356} icon="nav-calendar" iconBg="var(--wivu-color-bg-pulse-soft)" title="취업박람회 9.14" meta="학생회관 대강당 · 14:00" />
    </>
  );
}

function Banner({ x, y, w, title, time, meta, i }: { x: number; y: number; w: number; title: string; time: string; meta: string; i: number }) {
  return (
    <motion.div className={s.banner} style={{ left: x, top: y, width: w }} {...pop(i)}>
      <span className={s.appIcon}>
        <WuMark />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <Text variant="label" className="truncate">
            {title}
          </Text>
          <Text variant="caption-2" color="tertiary" tnum>
            {time}
          </Text>
        </span>
        <Text variant="caption-2" color="secondary" as="p" className="truncate">
          {meta}
        </Text>
      </span>
    </motion.div>
  );
}

function Visual2() {
  return (
    <>
      <Banner i={0} x={0} y={212} w={320} title="출석 인증 10분 전이에요" time="지금" meta="서비스디자인 · 디자인관 302호" />
      <Banner i={1} x={16} y={284} w={312} title="과제 마감 3시간 전" time="20:59" meta="서비스 분석 리포트 · 오늘 23:59" />
      <Banner i={2} x={32} y={356} w={304} title="학사 공지가 올라왔어요" time="09.10" meta="2학기 수강신청 정정 기간 안내" />
    </>
  );
}

function Visual3() {
  const slots: { icon: IconName; label: string }[] = [
    { icon: 'quick-attendance', label: '출석' },
    { icon: 'student-id', label: '학생증' },
    { icon: 'meal', label: '학식' },
    { icon: 'quick-calendar', label: '캘린더' },
  ];
  return (
    <>
      <motion.span className={`${s.pill} t-caption-2-strong`} {...pop(0)}>
        <Icon name="arrow-right" size={16} style={{ transform: 'rotate(-90deg)' }} />
        홈에서 위로 밀면 열려요
      </motion.span>
      <motion.div className={s.quickPreview} {...pop(1)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="label">내 퀵메뉴</Text>
          <span className="t-micro" style={{ padding: '2px 8px', borderRadius: 999, background: 'var(--wivu-color-bg-brand-soft)', color: 'var(--wivu-color-text-brand)' }}>
            4 / 8
          </span>
        </div>
        <div className={s.slots}>
          {slots.map((sl) => (
            <span key={sl.label} className={s.slot}>
              <span className={s.slotCircle}>
                <Icon name={sl.icon} size={20} />
              </span>
              <Text variant="caption-2-strong">{sl.label}</Text>
            </span>
          ))}
          <span className={s.slot}>
            <span className={`${s.slotCircle} ${s.slotAdd}`}>
              <Icon name="plus" size={20} />
            </span>
            <Text variant="caption-2-strong" color="tertiary">
              추가
            </Text>
          </span>
        </div>
      </motion.div>
    </>
  );
}

/** 앱 아이콘 안 흰색 WU 마크 — 확정 로고(logo-wu-blue)를 흰색으로만 바꿔 사용 (형태 수정 없음) */
export function WuMark({ height = 15 }: { height?: number }) {
  return <Logo name="logo-wu-blue" height={height} style={{ filter: 'brightness(0) invert(1)' }} />;
}

