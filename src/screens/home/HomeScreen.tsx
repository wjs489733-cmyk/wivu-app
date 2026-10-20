import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { BottomSheet, Button, Chip, Icon, IconButton, Screen, Section, SheetAction, SheetHead, TabBar, Text, toast, type IconName } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { NOW, USER } from '@/data/core';
import { AttendanceSheet } from '@/screens/attendance/AttendanceSheet';
import { useIsSubmitted } from '@/screens/courses/store';
import { useSchedule } from '@/screens/timetable/store';
import { useHasUnread } from '@/app/useUnread';
import { RadialMenu } from './RadialMenu';
import { useMyMenu, useOpenMenu } from './quick';
import { useVisibleBlocks, type BlockId } from './store';
import {
  CLASS_CARDS,
  DATE_LINE,
  DEADLINES,
  FREE_DAY,
  FREE_NEXT,
  LIBRARY_ROOMS,
  MEAL,
  NEXT_ROOM,
  NOTICE_LINE,
  TODO_FREE,
  TODO_TODAY,
  TODO_TODAY_MORE,
  dueBadge,
  type ClassCard,
  type TodoItem,
} from './data';
import s from './Home.module.css';

/** ?menu=1(다른 탭에서 홈 탭 길게 누름)로 이미 연 기록 — 뒤로 가기로 같은 기록에 돌아왔을 때 다시 열지 않게 */
const openedFromUrl = new Set<string>();

/**
 * 홈 v5 — Figma 674:4748(출석 전) · 675:4839(출석 완료) · 675:5022(퀵메뉴, 홈 탭 길게) · 692:6804(공강, 목 10/8)
 * 출석 완료 여부는 전역 attendanceComplete로 자동 분기 (Figma CONDITIONAL 대체).
 * 블록 구성(켜기/끄기·순서)은 홈 편집(/home/edit · 676:5225)의 로컬 스토어를 따른다. '오늘 수업'은 항상 맨 위.
 * 퀵메뉴: 홈 탭 길게 누르기(0.5초)로만 연다 — 다른 탭에서 길게 누르면 /home?menu=1로 와서 열린다. 홈 탭 짧게 = 맨 위로.
 */
export function HomeScreen({ variant = 'today' }: { variant?: 'today' | 'free-day' }) {
  const nav = useNav();
  const location = useLocation();
  const done = useApp((st) => st.attendanceComplete);
  const freeDay = variant === 'free-day';
  const fromUrl = new URLSearchParams(location.search).get('menu') === '1' && !openedFromUrl.has(location.key);
  const [radial, setRadial] = useState(fromUrl);
  const [pin, setPin] = useState(false);
  const blocks = useVisibleBlocks();

  useEffect(() => {
    if (fromUrl) openedFromUrl.add(location.key);
  }, [fromUrl, location.key]);

  return (
    <Screen
      figma={freeDay ? '692:6804' : done ? '675:4839' : '674:4748'}
      header={<HomeHeader />}
      footer={
        <div className={s.tabWrap}>
          <TabBar active="home" onHomeLongPress={() => setRadial(true)} />
        </div>
      }
      overlay={
        <>
          <RadialMenu open={radial} onClose={() => setRadial(false)} />
          {!freeDay && <AttendanceSheet open={pin} onClose={() => setPin(false)} />}
        </>
      }
    >
      <Text variant="caption-1" color="tertiary" as="p" className={s.dateLine}>
        {freeDay ? DATE_LINE.free : DATE_LINE.today}
      </Text>
      {freeDay ? <FreeDayCard /> : <ClassCarousel onAttend={() => setPin(true)} />}

      {blocks.map((id, i) => (
        <div key={id} className={s.block} data-tight={i === 0 && id === 'notice'}>
          <Block id={id} freeDay={freeDay} />
        </div>
      ))}

      <div className={s.editWrap}>
        <Button variant="secondary" size="m" block onClick={() => nav.push(P.homeEdit)}>
          홈 편집
        </Button>
      </div>
    </Screen>
  );
}

function Block({ id, freeDay }: { id: BlockId; freeDay: boolean }) {
  switch (id) {
    case 'notice':
      return <NoticeLine />;
    case 'todo':
      return <TodoBlock freeDay={freeDay} />;
    case 'deadline':
      return <DeadlineBlock freeDay={freeDay} />;
    case 'menu':
      return <MyMenuBlock />;
    case 'meal':
      return <MealBlock />;
    case 'nextRoom':
      return <NextRoomBlock freeDay={freeDay} />;
    case 'library':
      return <LibraryBlock />;
  }
}

/* ── 헤더: WivU 워드마크 · QR(학생증) · 알림 · 마이 ───────────── */
function HomeHeader() {
  const nav = useNav();
  const unread = useHasUnread();
  return (
    <div className={s.header}>
      <Text variant="title-2" color="brand" as="h1" className="font-en">
        WivU
      </Text>
      <div className={s.headerActions}>
        <IconButton icon="qr" label="모바일 학생증" onPress={() => nav.modal(P.studentId)} />
        <IconButton icon="bell" label={unread ? '알림함 · 읽지 않은 알림 있음' : '알림함'} dot={unread} onPress={() => nav.push(P.notifications)} />
        <button type="button" className={s.avatarHit} onClick={() => nav.push(P.my)} aria-label="마이·설정">
          <span className={`${s.avatar} t-caption-2-strong`} aria-hidden>
            {USER.initial}
          </span>
        </button>
      </div>
    </div>
  );
}

/* ── 오늘 수업 캐러셀 (340 카드 · 간격 12 · 다음 카드 20 노출 · 페이지 점) ── */
type SheetAct = { label: string; icon: IconName; run: () => void };
type MoreSheet = { title: string; subtitle: string; actions: SheetAct[] };

function ClassCarousel({ onAttend }: { onAttend: () => void }) {
  const nav = useNav();
  const done = useApp((st) => st.attendanceComplete);
  const time = useApp((st) => st.attendanceTime);
  const method = useApp((st) => st.attendanceMethod);
  const [page, setPage] = useState(0);
  const [sheet, setSheet] = useState<MoreSheet | null>(null);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const openMore = (c: ClassCard) =>
    setSheet({
      title: c.name,
      subtitle: c.meta,
      actions: [
        { label: '과목 상세', icon: 'courses', run: () => nav.push(P.course(c.id)) },
        { label: '이 수업 출석 기록', icon: 'attendance', run: () => nav.push(P.attendanceCourse(c.id)) },
        { label: '강의실 위치', icon: 'map', run: () => nav.push(P.campusMap) },
      ],
    });
  const runAction = (a: SheetAct) => {
    setSheet(null);
    timer.current = window.setTimeout(a.run, 200);
  };

  return (
    <>
      <div
        className={`${s.carousel} no-scrollbar`}
        aria-label="오늘 수업"
        role="region"
        onScroll={(e) => {
          const el = e.currentTarget;
          const card = el.firstElementChild as HTMLElement | null;
          if (!card) return;
          const p = Math.round(el.scrollLeft / (card.offsetWidth + 12));
          setPage(Math.max(0, Math.min(CLASS_CARDS.length - 1, p)));
        }}
        onFocus={(e) => {
          // 키보드로 화면 밖 카드의 버튼에 포커스가 가면 그 카드를 통째로 보여준다
          const el = e.currentTarget;
          const card = Array.from(el.children).find((c) => c.contains(e.target as Node)) as HTMLElement | undefined;
          if (!card) return;
          const left = el.scrollLeft + card.getBoundingClientRect().left - el.getBoundingClientRect().left - 20;
          const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
          if (Math.abs(left - el.scrollLeft) > 1) el.scrollTo({ left, behavior: reduce ? 'auto' : 'smooth' });
        }}
      >
        {CLASS_CARDS.map((c, i) => {
          if (i > 0) {
            return (
              <article key={c.id} className={s.classCard} data-tone="later" aria-label={`${c.badge} ${c.name}`}>
                <CardStatus badge={<Chip tone="neutral">{c.badge}</Chip>} status={c.status} statusColor="secondary" onMore={() => openMore(c)} name={c.name} />
                <CardTitle name={c.name} meta={c.meta} />
                <AuthWindow c={c} />
                {c.action && (
                  <Button variant="secondary" block className={s.whiteBtn} onClick={() => (c.action!.mode === 'tab' ? nav.tab(c.action!.to) : nav.push(c.action!.to))}>
                    {c.action.label}
                  </Button>
                )}
              </article>
            );
          }
          if (done) {
            return (
              <article key={c.id} className={s.classCard} data-tone="done" aria-label={`출석 완료 ${c.name}`}>
                <CardStatus
                  badge={
                    <Chip tone="white" className={s.doneBadge}>
                      출석 완료
                    </Chip>
                  }
                  status={`${time ?? '09:52'} ${method ?? 'PIN'} 인증`}
                  statusColor="on-brand"
                  onMore={() => openMore(c)}
                  name={c.name}
                  light
                />
                <CardTitle name={c.name} meta={c.meta} light />
                <Text variant="body-3" color="on-brand" as="p" className={s.doneNote}>
                  출석이 교수님께 전달됐어요
                </Text>
                <div className={s.cardActions}>
                  <Button variant="onBrand" grow onClick={() => nav.tab(P.attendance)}>
                    오늘 출석 기록 보기
                  </Button>
                  <Button variant="onBrandGhost" onClick={() => nav.modal(P.studentId)}>
                    학생증
                  </Button>
                </div>
              </article>
            );
          }
          return (
            <article key={c.id} className={s.classCard} data-tone="now" aria-label={`출석 가능 ${c.name}`}>
              <CardStatus badge={<Chip tone="brand">{c.badge}</Chip>} status={c.status} statusColor="brand" onMore={() => openMore(c)} name={c.name} />
              <CardTitle name={c.name} meta={c.meta} />
              <AuthWindow c={c} />
              <div className={s.cardActions}>
                <Button variant="primary" grow onClick={onAttend}>
                  출석 인증하기
                </Button>
                <Button variant="secondary" onClick={() => nav.modal(P.studentId)}>
                  학생증
                </Button>
              </div>
            </article>
          );
        })}
      </div>
      <div className={s.dots} aria-hidden>
        {CLASS_CARDS.map((c, i) => (
          <span key={c.id} data-on={i === page} />
        ))}
      </div>
      <BottomSheet open={!!sheet} onClose={() => setSheet(null)} label={sheet?.title}>
        {sheet && (
          <>
            <SheetHead title={sheet.title} subtitle={sheet.subtitle} onClose={() => setSheet(null)} />
            <div className={s.sheetBody}>
              {sheet.actions.map((a) => (
                <SheetAction key={a.label} label={a.label} icon={a.icon} chevron onPress={() => runAction(a)} />
              ))}
            </div>
          </>
        )}
      </BottomSheet>
    </>
  );
}

function CardStatus({ badge, status, statusColor, onMore, name, light }: { badge: ReactNode; status: string; statusColor: 'brand' | 'secondary' | 'on-brand'; onMore: () => void; name: string; light?: boolean }) {
  return (
    <div className={s.cardStatus}>
      {badge}
      <Text variant="caption-1-strong" color={statusColor} tnum className="truncate" style={{ flex: 1 }}>
        {status}
      </Text>
      <button type="button" className={s.moreBtn} onClick={onMore} aria-label={`${name} 더보기`}>
        <Icon name="more" size={20} color={light ? 'on-brand' : 'secondary'} />
      </button>
    </div>
  );
}

function CardTitle({ name, meta, light }: { name: string; meta: string; light?: boolean }) {
  return (
    <>
      <Text variant="title-2" as="h2" color={light ? 'on-brand' : 'primary'} className={s.cardTitle}>
        {name}
      </Text>
      <Text variant="body-3" color={light ? 'on-brand' : 'secondary'} as="p" className="truncate" tnum>
        {meta}
      </Text>
    </>
  );
}

/** 출석 인증 시간 막대 '09:40 인증 시작 ─ 10:10 마감' */
function AuthWindow({ c }: { c: ClassCard }) {
  return (
    <div className={s.authWindow}>
      <div className={s.track} role="progressbar" aria-label="출석 인증 시간" aria-valuenow={Math.round(c.elapsed * 100)} aria-valuemin={0} aria-valuemax={100}>
        {c.elapsed > 0 && <span style={{ width: `${c.elapsed * 100}%` }} />}
      </div>
      <div className={s.authLabels}>
        <Text variant="caption-2" color="tertiary" tnum>
          {c.opens} 인증 시작
        </Text>
        <Text variant="caption-2" color="tertiary" tnum>
          {c.closes} 마감
        </Text>
      </div>
    </div>
  );
}

/* ── 공강 카드 (692:6804) ─────────────────────────────────────── */
function FreeDayCard() {
  const nav = useNav();
  const [sheet, setSheet] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const go = (fn: () => void) => {
    setSheet(false);
    timer.current = window.setTimeout(fn, 200);
  };
  return (
    <div className={s.freeWrap}>
      <article className={s.classCard} data-tone="free" aria-label="오늘은 공강">
        <CardStatus badge={<Chip tone="neutral">오늘은 공강</Chip>} status="" statusColor="brand" onMore={() => setSheet(true)} name="공강" />
        <Text variant="title-2" as="h2" className={s.cardTitle}>
          오늘은 수업이 없어요
        </Text>
        <Text variant="body-3" color="secondary" as="p" className="truncate" tnum>
          <Text variant="body-3" color="tertiary">
            {FREE_NEXT.label}
          </Text>
          {'  '}
          {FREE_NEXT.text}
        </Text>
        <Button variant="secondary" block className={`${s.whiteBtn} ${s.freeBtn}`} onClick={() => nav.tab(P.timetable)}>
          내일 시간표 보기
        </Button>
      </article>
      <BottomSheet open={sheet} onClose={() => setSheet(false)} label="공강">
        <SheetHead title="오늘은 공강" subtitle={`${FREE_NEXT.label} · ${FREE_NEXT.text}`} onClose={() => setSheet(false)} />
        <div className={s.sheetBody}>
          <SheetAction label="내일 첫 수업 과목 상세" icon="courses" chevron onPress={() => go(() => nav.push(P.course('service-design')))} />
          <SheetAction label="캘린더에서 이번 주 보기" icon="calendar" chevron onPress={() => go(() => nav.tab(P.calendar))} />
        </div>
      </BottomSheet>
    </div>
  );
}

/* ── 공지 한 줄 ───────────────────────────────────────────── */
function NoticeLine() {
  const nav = useNav();
  return (
    <div className={s.pad}>
      <button type="button" className={s.noticeLine} onClick={() => nav.push(P.academicNotice(NOTICE_LINE.id))}>
        <Text variant="caption-1-strong">공지</Text>
        <Text variant="body-3" color="secondary" className="truncate" style={{ flex: 1, textAlign: 'left' }} tnum>
          {NOTICE_LINE.text}
        </Text>
        <Icon name="chevron-right" size={16} color="tertiary" />
      </button>
    </div>
  );
}

/* ── 오늘 할 일 ───────────────────────────────────────────── */
function TodoBlock({ freeDay }: { freeDay: boolean }) {
  const nav = useNav();
  const [expanded, setExpanded] = useState(false);
  const items = freeDay ? TODO_FREE : expanded ? [...TODO_TODAY, ...TODO_TODAY_MORE] : TODO_TODAY;
  return (
    <Section title="오늘 할 일" more="전체보기" onMore={() => nav.tab(P.calendar)} padded={false}>
      <div className={s.pad}>
        <div className={s.box} data-list>
          {items.map((it) => (
            <TodoRow key={it.time + it.title} it={it} />
          ))}
          {freeDay ? (
            <button type="button" className={s.expand} onClick={() => nav.tab(P.calendar)}>
              <Text variant="caption-1" color="secondary">
                이번 주 할 일 전체 보기
              </Text>
              <Icon name="chevron-down" size={16} color="secondary" />
            </button>
          ) : (
            <button type="button" className={s.expand} aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
              <Text variant="caption-1" color="secondary">
                {expanded ? '접기' : `다가오는 할 일 ${TODO_TODAY_MORE.length}개 더보기`}
              </Text>
              <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="secondary" />
            </button>
          )}
        </div>
      </div>
    </Section>
  );
}

function TodoRow({ it }: { it: TodoItem }) {
  const nav = useNav();
  const attended = useApp((st) => st.attendanceComplete);
  const isSubmitted = useIsSubmitted();
  const applied = useSchedule((st) => st.applied);
  const submitted = it.assignment ? isSubmitted(it.assignment.courseId, it.assignment.aid) : false;

  let meta: ReactNode = it.meta;
  let metaColor: 'tertiary' | 'error' = 'tertiary';
  if (it.attendCourse && attended) {
    meta = (
      <>
        {it.meta}{' '}
        <Text variant="caption-1" color="brand">
          · 출석 완료
        </Text>
      </>
    );
  } else if (it.assignment && submitted) {
    meta = it.assignment.doneMeta;
  } else if (it.eventId && applied.includes(it.eventId)) {
    meta = `${it.meta} · 사전 신청 완료`;
  } else if (it.urgent) {
    metaColor = 'error';
  }

  return (
    <button type="button" className={s.todoRow} onClick={() => nav.push(it.to)}>
      <span className={s.todoTime}>
        <Text variant="caption-1-strong" tnum>
          {it.time}
        </Text>
        <Text variant="caption-2" color="tertiary">
          {it.type}
        </Text>
      </span>
      <span className={s.todoText}>
        <Text variant="body-2-strong" className="truncate">
          {it.title}
        </Text>
        <Text variant="caption-1" color={metaColor} className="truncate" tnum>
          {meta}
        </Text>
      </span>
    </button>
  );
}

/* ── 마감 임박 과제 (가로 카드) ───────────────────────────── */
function DeadlineBlock({ freeDay }: { freeDay: boolean }) {
  const nav = useNav();
  const isSubmitted = useIsSubmitted();
  const base = freeDay ? FREE_DAY : NOW;
  return (
    <Section title="마감 임박 과제" more="전체보기" onMore={() => nav.tab(P.courses)} padded={false}>
      <div className={`${s.hscroll} no-scrollbar`}>
        {DEADLINES.map((d) => {
          const done = isSubmitted(d.courseId, d.aid);
          const b = done ? { label: '제출 완료', tone: 'brand' as const } : dueBadge(d.due, base);
          return (
            <button key={d.courseId + d.aid} type="button" className={s.dueCard} onClick={() => nav.push(d.to)}>
              <Chip tone={b.tone}>{b.label}</Chip>
              <Text variant="body-2-strong" className="truncate">
                {d.title}
              </Text>
              <Text variant="caption-1" color="tertiary" className="truncate">
                {d.course} · {done ? '제출 완료' : d.meta}
              </Text>
            </button>
          );
        })}
      </div>
    </Section>
  );
}

/* ── 내 메뉴 (공용 quickMenu 8개) ─────────────────────────── */
function MyMenuBlock() {
  const nav = useNav();
  const items = useMyMenu();
  const open = useOpenMenu();
  return (
    <Section title="내 메뉴" more="편집" onMore={() => nav.push(P.myQuickMenu)} padded={false}>
      <div className={s.pad}>
        <div className={`${s.box} ${s.menuGrid}`}>
          {items.map((q) => (
            <button key={q.id} type="button" className={s.menuItem} onClick={() => open(q)}>
              <Icon name={q.icon} size={24} color="primary" />
              <Text variant="caption-1" color="secondary">
                {q.label}
              </Text>
            </button>
          ))}
        </div>
      </div>
    </Section>
  );
}

/** div[role=button] — 안에 블록 요소(막대 그래프 등)가 들어가는 누를 수 있는 상자 */
function PressBox({ onPress, className, label, children }: { onPress: () => void; className?: string; label?: string; children: ReactNode }) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      className={`${s.box} ${s.pressBox} ${className ?? ''}`}
      onClick={onPress}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onPress();
        }
      }}
    >
      {children}
    </div>
  );
}

/* ── 오늘의 학식 (메뉴·가격 + 시간대별 혼잡도) ───────────── */
function MealBlock() {
  const nav = useNav();
  return (
    <Section title="오늘의 학식" more="전체 식단" onMore={() => nav.push(P.meal)} padded={false}>
      <div className={s.pad}>
        <PressBox onPress={() => nav.push(P.meal)} className={s.mealBox}>
          <div className={s.infoRow}>
            <div className={s.infoText}>
              <Text variant="body-1-strong" as="p" className="truncate" tnum>
                {MEAL.title}
              </Text>
              <Text variant="caption-1" color="tertiary" as="p" className="truncate" tnum>
                {MEAL.meta}
              </Text>
            </div>
            <span className={s.thumb} aria-hidden>
              <Icon name="meal" size={24} color="primary" />
            </span>
          </div>
          <div className={s.crowd}>
            <div className={s.crowdHead}>
              <Text variant="caption-1-strong" color="secondary">
                시간대별 혼잡도
              </Text>
              <Text variant="caption-1-strong" color="error" tnum>
                {MEAL.peakLabel}
              </Text>
            </div>
            <div className={s.bars} role="img" aria-label={`시간대별 혼잡도 · ${MEAL.peakLabel}`}>
              {MEAL.crowd.map((h, i) => (
                <span key={i} style={{ height: h }} data-peak={i === MEAL.peak} />
              ))}
            </div>
            <div className={s.axis} aria-hidden>
              {MEAL.axis.map((a) => (
                <Text key={a} variant="caption-2" color="tertiary" tnum>
                  {a}
                </Text>
              ))}
            </div>
          </div>
        </PressBox>
      </div>
    </Section>
  );
}

/* ── (기본 꺼짐) 다음 강의실 · 도서관 좌석 — v5 홈 편집에만 있는 블록, 같은 블록 문법으로 구성 ── */
function NextRoomBlock({ freeDay }: { freeDay: boolean }) {
  const nav = useNav();
  const r = freeDay ? NEXT_ROOM.free : NEXT_ROOM.today;
  return (
    <Section title="다음 강의실" more="지도 보기" onMore={() => nav.push(P.campusMap)} padded={false}>
      <div className={s.pad}>
        <PressBox onPress={() => nav.push(P.campusMap)}>
          <div className={s.infoRow}>
            <div className={s.infoText}>
              <Text variant="body-1-strong" as="p" className="truncate">
                {r.room}
              </Text>
              <Text variant="caption-1" color="tertiary" as="p" className="truncate" tnum>
                {r.meta}
              </Text>
            </div>
            <span className={s.thumb} aria-hidden>
              <Icon name="map" size={24} color="primary" />
            </span>
          </div>
        </PressBox>
      </div>
    </Section>
  );
}

function LibraryBlock() {
  return (
    <Section title="도서관 좌석" aside="09:40 기준" padded={false}>
      <div className={s.pad}>
        <PressBox onPress={() => toast('도서관 좌석 연동은 다음 버전에서 열려요')} className={s.libraryBox}>
          {LIBRARY_ROOMS.map((r) => (
            <div key={r.name} className={s.libraryRow}>
              <Text variant="body-2-strong">{r.name}</Text>
              <Text variant="caption-1-strong" color={r.left / r.total < 0.15 ? 'error' : 'brand'} tnum>
                {r.left}석 남음
                <Text variant="caption-1" color="tertiary">
                  {' '}
                  / {r.total}
                </Text>
              </Text>
            </div>
          ))}
        </PressBox>
      </div>
    </Section>
  );
}
