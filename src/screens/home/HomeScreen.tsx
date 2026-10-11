import { useRef, useState } from 'react';
import {
  Button,
  Card,
  Chip,
  Icon,
  IconButton,
  ListGroup,
  MetaLine,
  Screen,
  Section,
  SectionDivider,
  TabBar,
  Text,
  toast,
} from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { USER } from '@/data/core';
import { AttendanceSheet } from '@/screens/attendance/AttendanceSheet';
import { NOTIFICATIONS } from '@/screens/info/data';
import { RadialMenu } from './RadialMenu';
import { FLOW_FREE_DAY, FLOW_TODAY, HOME_NOTICES, MEALS, WEEK, type FlowItem } from './data';
import s from './Home.module.css';

/**
 * 홈 — Figma 308:11640(출석 전) · 308:11881(출석 완료) · 433:9519(공강, 목 9/10)
 * 출석 완료 여부는 전역 상태(attendanceComplete)로 자동 분기 → Figma의 CONDITIONAL 대체
 */
export function HomeScreen({ variant = 'today', openPin = false, pinError = false }: { variant?: 'today' | 'free-day'; openPin?: boolean; pinError?: boolean }) {
  const nav = useNav();
  const school = useApp((st) => st.selectedSchool);
  const read = useApp((st) => st.readNotifications);
  const unread = NOTIFICATIONS.some((n) => n.unread && !read.includes(n.id));
  const [radial, setRadial] = useState(false);
  const [pin, setPin] = useState(openPin);
  const freeDay = variant === 'free-day';

  return (
    <Screen
      figma={freeDay ? '433:9519' : '308:11640'}
      header={
        <div className={s.header}>
          <div className={s.month}>
            <Text variant="title-3" as="h1">
              2026년 9월
            </Text>
            <Text variant="caption-2" color="secondary">
              {school}
            </Text>
          </div>
          <div className={s.headerActions}>
            <button type="button" className={`${s.avatar} t-caption-1-strong`} onClick={() => nav.push(P.my)} aria-label="마이·설정">
              {USER.initial}
            </button>
            <IconButton icon="bell" label={unread ? '알림함 · 읽지 않은 알림 있음' : '알림함'} dot={unread} onPress={() => nav.push(P.notifications)} />
          </div>
        </div>
      }
      footer={<TabBar active="home" onActivePress={() => setRadial((v) => !v)} />}
      overlay={
        <>
          <RadialMenu open={radial} onClose={() => setRadial(false)} />
          {!freeDay && (
            <AttendanceSheet
              open={pin}
              forceError={pinError}
              onClose={() => {
                setPin(false);
                // 라우트(/attendance/pin)로 들어온 경우: 시트가 내려간 뒤 홈 주소로 정리
                if (openPin) setTimeout(() => nav.reset(P.home, 'none'), 320);
              }}
            />
          )}
        </>
      }
    >
      <WeekStrip selected={freeDay ? 10 : 11} />
      {freeDay ? <FreeDayHero /> : <HeroCarousel onAttend={() => setPin(true)} />}
      <QuickCards freeDay={freeDay} />

      <SectionDivider />
      <Section title="이어서 할 일" more="일정 전체" onMore={() => nav.tab(P.calendar)}>
        <Timeline items={freeDay ? FLOW_FREE_DAY : FLOW_TODAY} />
      </Section>

      <SectionDivider />
      <Section title="오늘의 학식" more="식단 전체" onMore={() => nav.push(P.meal)}>
        <Card variant="outline" onPress={() => nav.push(P.meal)} style={{ textAlign: 'left' }}>
          {MEALS.map((m, i) => (
            <div key={m.kind} className={s.meal} data-first={i === 0}>
              <div className={s.mealHead}>
                <Chip tone={m.tone} pill>
                  {m.kind}
                </Chip>
                <Text variant="caption-1" color="secondary">
                  {m.time}
                </Text>
              </div>
              <Text variant="subhead" color={i === 0 ? 'primary' : 'secondary'} as="p">
                {m.menu}
              </Text>
            </div>
          ))}
        </Card>
      </Section>

      <SectionDivider />
      <Section title="학사 공지" more="공지 전체" onMore={() => nav.push(P.academicNotice('n1'))}>
        <ListGroup>
          {HOME_NOTICES.map((n) => (
            <button key={n.id} type="button" className={s.noticeRow} onClick={() => nav.push(P.academicNotice(n.id))}>
              <Chip tone={n.tone}>{n.tag}</Chip>
              <Text variant="label" className="truncate" style={{ flex: 1 }}>
                {n.title}
              </Text>
              <Text variant="caption-2" color="tertiary" tnum>
                {n.date}
              </Text>
            </button>
          ))}
        </ListGroup>
      </Section>
    </Screen>
  );
}

/* ── 주간 날짜 스트립 ─────────────────────────────────────────── */
function WeekStrip({ selected }: { selected: number }) {
  const nav = useNav();
  return (
    <div className={s.week} role="tablist" aria-label="이번 주">
      {WEEK.map((w) => {
        const on = w.d === selected;
        return (
          <button
            key={w.d}
            type="button"
            role="tab"
            aria-selected={on}
            className={s.day}
            onClick={() => {
              if (on) return;
              if (w.d === 11) nav.fade(P.home);
              else if (w.d === 10) nav.fade(P.homeFreeDay);
              else toast(`${w.dow}요일 일정은 프로토타입에 포함되지 않았어요`);
            }}
          >
            <Text variant="caption-2" color={on ? 'on-brand-muted' : 'tertiary'}>
              {w.dow}
            </Text>
            <Text variant="subhead" color={on ? 'on-brand' : 'primary'} tnum>
              {w.d}
            </Text>
          </button>
        );
      })}
    </div>
  );
}

/* ── 오늘 수업 히어로 캐러셀 ─────────────────────────────────── */
function HeroCarousel({ onAttend }: { onAttend: () => void }) {
  const nav = useNav();
  const done = useApp((st) => st.attendanceComplete);
  const time = useApp((st) => st.attendanceTime);
  const ref = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  const cards = [
    done ? (
      <Card key="sd" variant="ink" className={s.hero}>
        <div className={s.heroTop}>
          <Chip tone="onBrand" size="m" className={s.doneChip}>
            <span className={s.brandDot} />
            출석 완료 · {time} 인증
          </Chip>
          <Text variant="caption-1-strong" color="on-brand-muted" tnum>
            10:00 – 11:50
          </Text>
        </div>
        <div className={s.heroTitle}>
          <Text variant="display" color="on-brand" as="h2">
            서비스디자인
          </Text>
          <Icon name="status-present" size={24} color="on-brand" />
        </div>
        <MetaLine items={['디자인관 302호', '전공', '김OO 교수']} color="on-brand-muted" variant="callout" />
        <div className={s.heroActions}>
          <Button variant="onBrandGhost" grow onClick={() => nav.push(P.courseMaterials('service-design'))}>
            강의자료 보기
          </Button>
          <Button variant="onBrandGhost" leadingIcon="student-id" onClick={() => nav.modal(P.studentId)}>
            학생증
          </Button>
        </div>
      </Card>
    ) : (
      <Card key="sd" variant="brand" className={s.hero}>
        <div className={s.heroTop}>
          <Chip tone="onBrand" size="m" dot>
            출석 가능 · 10:10까지
          </Chip>
          <Text variant="caption-1-strong" color="on-brand-muted" tnum>
            10:00 – 11:50
          </Text>
        </div>
        <Text variant="display" color="on-brand" as="h2" className={s.heroTitle}>
          서비스디자인
        </Text>
        <MetaLine items={['디자인관 302호', '전공', '김OO 교수']} color="on-brand-muted" variant="callout" />
        <div className={s.heroActions}>
          <Button variant="onBrand" grow onClick={onAttend}>
            출석 인증하기
          </Button>
          <Button variant="onBrandGhost" leadingIcon="student-id" onClick={() => nav.modal(P.studentId)}>
            학생증
          </Button>
        </div>
      </Card>
    ),
    <NextCard
      key="bd"
      variant={done ? 'brand' : 'ink'}
      chip="다음 수업 · 13:00 시작"
      time="13:00 – 14:50"
      name="브랜드디자인"
      meta={['디자인관 401호', '전공', '이OO 교수']}
      primary={{ label: '강의실 위치 보기', onPress: () => nav.push(P.campusMap) }}
    />,
    <NextCard
      key="ux"
      variant="ink"
      chip="오늘 마지막 수업"
      time="15:00 – 16:50"
      name="UX 리서치"
      meta={['정보관 210호', '전공', '박OO 교수']}
      primary={{ label: '과목 상세', onPress: () => nav.push(P.course('ux-research')) }}
    />,
  ];

  return (
    <>
      <div
        ref={ref}
        className={`${s.carousel} no-scrollbar`}
        onScroll={(e) => {
          const el = e.currentTarget;
          const card = el.firstElementChild as HTMLElement | null;
          if (card) setPage(Math.round(el.scrollLeft / (card.offsetWidth + 12)));
        }}
      >
        {cards}
      </div>
      <div className={s.dots} aria-hidden>
        {cards.map((_, i) => (
          <span key={i} data-on={i === page} />
        ))}
      </div>
    </>
  );
}

function NextCard({ variant, chip, time, name, meta, primary }: { variant: 'brand' | 'ink'; chip: string; time: string; name: string; meta: string[]; primary: { label: string; onPress: () => void } }) {
  const nav = useNav();
  return (
    <Card variant={variant} className={s.hero}>
      <div className={s.heroTop}>
        <Chip tone="onBrand" size="m" className={s.nextChip}>
          <span className={s.brandDot} />
          {chip}
        </Chip>
        <Text variant="caption-1-strong" color="on-brand-muted" tnum>
          {time}
        </Text>
      </div>
      <Text variant="display" color="on-brand" as="h2" className={s.heroTitle}>
        {name}
      </Text>
      <MetaLine items={meta} color="on-brand-muted" variant="callout" />
      <div className={s.heroActions}>
        <Button variant="onBrandGhost" grow onClick={primary.onPress}>
          {primary.label}
        </Button>
        <Button variant="onBrandGhost" leadingIcon="student-id" onClick={() => nav.modal(P.studentId)}>
          학생증
        </Button>
      </div>
    </Card>
  );
}

/* ── 공강 히어로 (433:9519) ──────────────────────────────────── */
function FreeDayHero() {
  const nav = useNav();
  return (
    <div className={s.freeWrap}>
      <Card variant="soft" className={s.freeHero}>
        <Chip tone="white" size="m" pill className={s.freeChip}>
          공강 · 수업 없는 날
        </Chip>
        <Text variant="title-1" as="h2" style={{ marginTop: 12 }}>
          오늘은 수업이 없어요
        </Text>
        <Text variant="callout" color="secondary" as="p" style={{ marginTop: 8 }}>
          밀린 과제를 끝내기 좋은 날이에요. 내일 첫 수업은 10:00 서비스디자인이에요.
        </Text>
        <div className={s.heroActions} style={{ marginTop: 20 }}>
          <Button variant="primary" grow leadingIcon="assignment" onClick={() => nav.push(P.assignment())}>
            과제 이어서 하기
          </Button>
          <Button variant="onBrand" grow leadingIcon="rental" onClick={() => toast('스터디룸 예약은 다음 버전에서 열려요')}>
            스터디룸 예약
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ── 과제 / 다음 강의실 카드 ─────────────────────────────────── */
function QuickCards({ freeDay }: { freeDay: boolean }) {
  const nav = useNav();
  const submitted = useApp((st) => st.assignmentSubmitted);
  return (
    <div className={s.quick}>
      <Card variant="outline" className={s.quickCard}>
        <Text variant="caption-2-strong" color="secondary" as="p">
          {freeDay ? '이번 주 과제' : '이 수업 과제'}
        </Text>
        <Text variant="headline" as="p" className="truncate" style={{ marginTop: 6 }}>
          서비스 분석 리포트
        </Text>
        <Text variant="caption-2" color={submitted ? 'brand' : 'secondary'} as="p">
          {submitted ? '제출 완료 · 다시 제출 가능' : freeDay ? '내일 23:59 마감 · D-1' : '오늘 23:59 마감 · 미제출'}
        </Text>
        <div className={s.quickFoot}>
          <Button variant={submitted ? 'soft' : 'primary'} size="s" onClick={() => nav.push(P.assignment())}>
            {submitted ? '제출 내역' : '제출하기'}
          </Button>
        </div>
      </Card>
      <Card variant="soft" className={s.quickCard} onPress={() => nav.push(P.campusMap)}>
        <Text variant="caption-2-strong" color="brand" as="p">
          {freeDay ? '내일 첫 수업' : '다음 강의실'}
        </Text>
        <Text variant="headline" as="p" style={{ marginTop: 6 }}>
          {freeDay ? '디자인관 302호' : '디자인관 401호'}
        </Text>
        <Text variant="caption-2" color="secondary" as="p">
          {freeDay ? '10:00 서비스디자인' : '13:00 브랜드디자인'}
        </Text>
        <Text variant="caption-2" color="secondary" as="p">
          {freeDay ? '금 · 9월 11일' : '도보 4분'}
        </Text>
        <div className={s.quickFoot}>
          <Button variant="onBrand" size="s" trailingIcon="arrow-right" tabIndex={-1}>
            지도 보기
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ── 이어서 할 일 타임라인 ───────────────────────────────────── */
function Timeline({ items }: { items: FlowItem[] }) {
  const nav = useNav();
  const submitted = useApp((st) => st.assignmentSubmitted);
  return (
    <ol className={s.timeline}>
      {items.map((it) => {
        const done = it.kind === 'assignment' && submitted;
        return (
          <li key={it.time + it.title} className={s.flowRow}>
            <span className={s.node} data-done={done} />
            <Text variant="subhead" tnum className={s.flowTime}>
              {it.time}
            </Text>
            <span className={s.flowMain}>
              <Text variant="subhead" as="p" className="truncate" color={done ? 'tertiary' : 'primary'}>
                {it.title}
              </Text>
              <Text variant="caption-1" color="secondary" as="p" className="truncate">
                {done ? '서비스디자인 · 제출 완료' : it.meta}
              </Text>
            </span>
            <Button variant="soft" size="s" onClick={() => it.to && nav.push(it.to)}>
              {done ? '확인' : it.action}
            </Button>
          </li>
        );
      })}
    </ol>
  );
}
