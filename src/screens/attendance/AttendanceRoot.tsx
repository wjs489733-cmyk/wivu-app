import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button, Card, Chip, Icon, IconButton, LargeHeader, ListGroup, MetaLine, ProgressBar, Screen, Section, SectionDivider, TabBar, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useHasUnread } from '@/app/useUnread';
import { useApp } from '@/store/app';
import { courseById, SEMESTER, WEEK_LABEL } from '@/data/core';
import { AttendanceSheetHost } from './AttendanceSheetHost';
import { allRecords, ATTENDANCE_COURSES, courseStats, totals, type TodayState } from './data';
import { RecordRow } from './parts';
import s from './Attendance.module.css';

const RECENT_COUNT = 4;

/**
 * 출석 탭 루트 — Figma 392:7302
 * 히어로는 전역 attendanceComplete로 출석 전(브랜드) / 완료(잉크) 자동 분기.
 * '전체 기록'(Figma 목적지 없음) → 목록을 그 자리에서 펼침.
 */
export function AttendanceRoot() {
  const nav = useNav();
  const unread = useHasUnread();
  const complete = useApp((st) => st.attendanceComplete);
  const method = useApp((st) => st.attendanceMethod);
  const time = useApp((st) => st.attendanceTime);
  const today: TodayState = { complete, method, time };
  const [pin, setPin] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const sum = totals(today);
  const records = allRecords(today);
  const shown = expanded ? records : records.slice(0, RECENT_COUNT);

  return (
    <Screen
      figma="392:7302"
      header={<LargeHeader title="출석" actions={<IconButton icon="bell" label="알림함" dot={unread} onPress={() => nav.push(P.notifications)} />} />}
      footer={<TabBar active="attendance" />}
      overlay={<AttendanceSheetHost open={pin} onClose={() => setPin(false)} />}
    >
      <div className={s.heroWrap}>
        <TodayHero onAttend={() => setPin(true)} />
      </div>

      <div className={s.stats}>
        <StatTile label="출석" value={sum.present} />
        <StatTile label="지각" value={sum.late} tone="warning" />
        <StatTile label="결석" value={sum.absent} tone="error" />
      </div>

      <SectionDivider />
      <Section title="과목별 출석" aside={`${SEMESTER} · ${WEEK_LABEL.replace('9월 ', '')}`}>
        <ListGroup>
          {ATTENDANCE_COURSES.map((id) => {
            const c = courseById(id);
            const st = courseStats(id, today);
            const warn = st.absent > 0;
            return (
              <button key={id} type="button" className={s.courseRow} onClick={() => nav.push(P.attendanceCourse(id))}>
                <span className={s.courseHead}>
                  <span className={s.courseInfo}>
                    <span className={s.courseTitle}>
                      <Text variant="subhead" className="truncate">
                        {c.name}
                      </Text>
                      {warn && <Chip tone="dangerSoft">결석 주의</Chip>}
                    </span>
                    <Text variant="caption-2" color="secondary" tnum>
                      출석 {st.present} · 지각 {st.late} · 결석 {st.absent}
                    </Text>
                  </span>
                  <Text variant="subhead" color={warn ? 'error' : 'brand'} tnum>
                    {st.rate}%
                  </Text>
                  <Icon name="chevron-right" size={16} color="tertiary" />
                </span>
                <ProgressBar value={st.rate} tone={warn ? 'error' : 'brand'} />
              </button>
            );
          })}
        </ListGroup>
      </Section>

      <SectionDivider />
      <Section title="최근 출석 기록" aside={<ExpandLink expanded={expanded} onToggle={() => setExpanded((v) => !v)} />}>
        <ListGroup>
          <AnimatePresence initial={false}>
            {shown.map((r, i) => (
              <motion.div
                key={r.key + r.courseId}
                className={s.recordItem}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1], delay: i >= RECENT_COUNT ? (i - RECENT_COUNT) * 0.03 : 0 }}
              >
                <RecordRow r={r} highlight={complete && r.date === '09.11'} onPress={() => nav.push(P.attendanceCourse(r.courseId))} />
              </motion.div>
            ))}
          </AnimatePresence>
        </ListGroup>
        {expanded && (
          <Text variant="caption-2" color="tertiary" as="p" align="center" className={s.listFoot}>
            {SEMESTER} 전체 {records.length}건 · 출석 {sum.present} · 지각 {sum.late} · 결석 {sum.absent}
          </Text>
        )}
      </Section>
    </Screen>
  );
}

/* ── 오늘 수업 히어로 (홈 히어로와 같은 패턴) ───────────────── */
function TodayHero({ onAttend }: { onAttend: () => void }) {
  const nav = useNav();
  const done = useApp((st) => st.attendanceComplete);
  const time = useApp((st) => st.attendanceTime);

  if (done) {
    return (
      <Card variant="ink" className={s.hero}>
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
          <Icon name="check-circle" size={24} color="on-brand" />
        </div>
        <MetaLine items={['디자인관 302호', '전공', '김OO 교수']} color="on-brand-muted" variant="callout" />
        <div className={s.heroActions}>
          <Button variant="onBrandGhost" grow onClick={() => nav.push(P.attendanceCourse('service-design'))}>
            출석 상세 보기
          </Button>
          <Button variant="onBrandGhost" leadingIcon="student" onClick={() => nav.modal(P.studentId)}>
            학생증
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="brand" className={s.hero}>
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
        <Button variant="onBrandGhost" leadingIcon="student" onClick={() => nav.modal(P.studentId)}>
          학생증
        </Button>
      </div>
    </Card>
  );
}

function StatTile({ label, value, tone }: { label: string; value: number; tone?: 'warning' | 'error' }) {
  return (
    <div className={s.statTile}>
      <span className={s.statValue}>
        <Text variant="number" color={tone ?? 'primary'} tnum>
          {value}
        </Text>
        <Text variant="caption-1-strong" color="secondary">
          회
        </Text>
      </span>
      <Text variant="caption-2" color="secondary">
        {label}
      </Text>
    </div>
  );
}

/** '전체 기록' ↔ '접기' — Figma 목적지 없음 → 그 자리에서 펼치기 (셰브론이 펼침 방향을 알려줌) */
function ExpandLink({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <button type="button" className={`${s.expandLink} t-caption-1`} onClick={onToggle} aria-expanded={expanded}>
      {expanded ? '접기' : '전체 기록'}
      <Icon name="chevron-right" size={16} className={s.expandIcon} />
    </button>
  );
}
