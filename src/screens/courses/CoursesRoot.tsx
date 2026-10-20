import { useRef } from 'react';
import { Chip, IconButton, LargeHeader, Screen, Section, TabBar, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useHasUnread } from '@/app/useUnread';
import { useApp } from '@/store/app';
import { onlineProgress } from '@/screens/attendance/data';
import { COURSES, SEMESTER, TODAY_CLASSES, TOTAL_CREDITS, type Course } from '@/data/core';
import { COURSE_INFO, ddayCount, dday, detailMeta } from './data';
import { useSubmissionOf } from './store';
import { ItemRow } from './parts';
import s from './Courses.module.css';

/**
 * 수강과목 탭 루트 — Figma v5 684:5962
 * '오늘 수업'(금 · core TODAY_CLASSES 순서) / '다른 날 수업' 두 묶음의 텍스트 행. 행 → 과목 상세(push).
 * Figma는 서비스디자인 행만 연결 → 코드는 6과목 모두 P.course(id)로 연결.
 * 배지: 가장 가까운 미제출 과제 D-day(오늘 = '오늘 마감' Error · 그 외 Neutral) · 오늘 마감 과제를 냈으면 '제출 완료' · 사이버 강의 '사이버'.
 */
export function CoursesRoot() {
  const nav = useNav();
  const unread = useHasUnread();
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = TODAY_CLASSES.map((id) => COURSES.find((c) => c.id === id)!).filter(Boolean);
  const others = COURSES.filter((c) => !TODAY_CLASSES.includes(c.id));

  return (
    <Screen
      figma="684:5962"
      scrollRef={scrollRef}
      header={<LargeHeader title="수강과목" actions={<IconButton icon="bell" label="알림함" dot={unread} onPress={() => nav.push(P.notifications)} />} />}
      footer={<TabBar active="courses" onActivePress={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} />}
    >
      <Text variant="caption-1" color="tertiary" as="p" className={s.rootMeta}>
        {SEMESTER} · {COURSES.length}과목 {TOTAL_CREDITS}학점
      </Text>
      <div className={s.sections}>
        <Section title="오늘 수업" padded={false} style={{ gap: 2 }}>
          <div className={s.inset}>
            {today.map((c) => (
              <CourseRow key={c.id} course={c} />
            ))}
          </div>
        </Section>
        <Section title="다른 날 수업" padded={false} style={{ gap: 2 }}>
          <div className={s.inset}>
            {others.map((c) => (
              <CourseRow key={c.id} course={c} />
            ))}
          </div>
        </Section>
      </div>
    </Screen>
  );
}

/* ── 과목 행 ─────────────────────────────────────────────────── */
function CourseRow({ course }: { course: Course }) {
  const nav = useNav();
  const info = COURSE_INFO[course.id];
  const submissionOf = useSubmissionOf(course.id);
  const complete = useApp((st) => st.attendanceComplete);

  // 사이버 강의: '사이버 강의 · 7주차 10.12 오픈' (출석 데이터의 다음 주차 오픈일에서 파생)
  const online = course.online ? onlineProgress(course.id, { complete, method: null, time: null }) : null;
  const meta = online ? ['사이버 강의', online.label.split(' · ')[1]].filter(Boolean).join(' · ') : detailMeta(course);

  const open = info.assignments.filter((a) => !a.closed).sort((a, b) => a.due.getTime() - b.due.getTime());
  const pending = open.find((a) => !submissionOf(a));
  const doneToday = open.find((a) => ddayCount(a.due) === 0 && submissionOf(a));

  let badge = null;
  if (pending && ddayCount(pending.due) === 0) badge = <Chip tone="dangerSoft">오늘 마감</Chip>;
  else if (doneToday) badge = <Chip tone="brand">제출 완료</Chip>;
  else if (pending)
    badge = (
      <Chip tone="neutral" className="font-en">
        {dday(pending.due)}
      </Chip>
    );
  else if (course.online) badge = <Chip tone="neutral">사이버</Chip>;

  return <ItemRow title={course.name} titleVariant="body-1-strong" badge={badge} meta={meta} chevron onPress={() => nav.push(P.course(course.id))} />;
}
