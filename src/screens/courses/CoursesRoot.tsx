import { useRef, useState } from 'react';
import { Card, Chip, Icon, IconButton, LargeHeader, ProgressBar, Screen, SearchField, Section, SectionDivider, TabBar, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useHasUnread } from '@/app/useUnread';
import { useApp } from '@/store/app';
import { onlineProgress } from '@/screens/attendance/data';
import { COURSES, SEMESTER, TOTAL_CREDITS, type Course } from '@/data/core';
import { COURSE_INFO, allFiles, cardMeta, ddayCount, professorOf } from './data';
import { useIsNew, useSubmissionOf } from './store';
import { CountChip } from './parts';
import s from './Courses.module.css';

/**
 * 수강과목 탭 루트 — Figma 392:7404 (Course_v4_01_Root)
 * Figma는 서비스디자인 카드만 과목 상세로 연결 → 코드는 6과목 모두 P.course(id)로 연결.
 * 검색창은 실제로 과목명·교수명 필터링.
 */
export function CoursesRoot() {
  const nav = useNav();
  const unread = useHasUnread();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const match = (c: Course) => !query || `${c.name} ${professorOf(c)}`.toLowerCase().includes(query);
  const majors = COURSES.filter((c) => c.kind === '전공' && match(c));
  const generals = COURSES.filter((c) => c.kind === '교양' && match(c));
  const empty = majors.length + generals.length === 0;

  return (
    <Screen
      figma="392:7404"
      scrollRef={scrollRef}
      header={<LargeHeader title="수강과목" actions={<IconButton icon="bell" label="알림함" dot={unread} onPress={() => nav.push(P.notifications)} />} />}
      footer={<TabBar active="courses" onActivePress={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} />}
    >
      <div className={s.searchWrap}>
        <SearchField value={q} onChange={setQ} placeholder="과목명, 교수명으로 검색" />
      </div>
      <div className={s.semester}>
        <Chip tone="brand" pill>
          {SEMESTER}
        </Chip>
        <Text variant="caption-1" color="secondary">
          {COURSES.length}과목 · {TOTAL_CREDITS}학점
        </Text>
      </div>

      {empty ? (
        <div className={s.empty}>
          <Icon name="search" size={24} color="tertiary" />
          <Text variant="subhead" as="p" align="center">
            ‘{q.trim()}’에 맞는 과목이 없어요
          </Text>
          <Text variant="caption-1" color="tertiary" as="p" align="center">
            과목명이나 교수명을 다시 확인해 주세요
          </Text>
        </div>
      ) : (
        <>
          {majors.length > 0 && (
            <Section title="전공" aside={`${majors.length}과목`}>
              <div className={s.cardList}>
                {majors.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            </Section>
          )}
          {majors.length > 0 && generals.length > 0 && <SectionDivider />}
          {generals.length > 0 && (
            <Section title="교양" aside={`${generals.length}과목`}>
              <div className={s.cardList}>
                {generals.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </Screen>
  );
}

/* ── 과목 카드 ───────────────────────────────────────────────── */
function CourseCard({ course }: { course: Course }) {
  const nav = useNav();
  const info = COURSE_INFO[course.id];
  const isNew = useIsNew(course.id);
  const submissionOf = useSubmissionOf(course.id);
  const complete = useApp((st) => st.attendanceComplete);
  // 사이버 강의 진도는 출석 데이터(주차별 수강 기록)에서 파생
  const online = course.online ? onlineProgress(course.id, { complete, method: null, time: null }) : null;

  const weekNotices = info.notices.filter((n) => n.thisWeek);
  const hasNew = weekNotices.some(isNew);
  const open = info.assignments.filter((a) => !a.closed);
  const todayDue = open.find((a) => ddayCount(a.due) === 0);
  const todayDone = todayDue ? submissionOf(todayDue) : null;

  return (
    <Card variant="outline" className={s.courseCard} onPress={() => nav.push(P.course(course.id))} aria-label={`${course.name} 과목 상세`}>
      <div className={s.cardHead}>
        <div className={s.cardInfo}>
          <div className={s.titleRow}>
            <Text variant="headline" as="h3" className="truncate">
              {course.name}
            </Text>
            {course.online && <Chip tone="pulse">사이버</Chip>}
          </div>
          <Text variant="caption-2" color="secondary" as="p" className="truncate">
            {cardMeta(course)}
          </Text>
        </div>
        <Icon name="arrow-right" size={20} color="primary" />
      </div>

      {online ? (
        <div className={s.progressBlock}>
          <div className={s.progressLabel}>
            <Text variant="caption-2" color="secondary" className="truncate">
              {online.label}
            </Text>
            <Text variant="caption-2-strong" color="brand" tnum style={{ flexShrink: 0 }}>
              진도율 {online.progress}%
            </Text>
          </div>
          <ProgressBar value={online.progress} />
        </div>
      ) : (
        <div className={s.counts}>
          <CountChip icon="notice" label="공지" count={weekNotices.length} dot={hasNew} />
          <CountChip icon="assignment" label="과제" count={open.length} />
          <CountChip icon="materials" label="자료" count={allFiles(info).length} />
          <span style={{ flex: 1 }} />
          {todayDue &&
            (todayDone ? (
              <Text variant="caption-2-strong" color="brand">
                제출 완료
              </Text>
            ) : (
              <Text variant="caption-2-strong" color="error">
                오늘 마감
              </Text>
            ))}
        </div>
      )}
    </Card>
  );
}
