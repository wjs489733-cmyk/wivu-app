import { useState } from 'react';
import { useParams } from 'react-router';
import {
  BottomSheet,
  Button,
  Card,
  Chip,
  IconButton,
  LeadingIcon,
  ListGroup,
  ListRow,
  NewBadge,
  Screen,
  Section,
  SectionDivider,
  Text,
  Tile,
  TopNav,
  toast,
  type ChipTone,
} from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { SEMESTER } from '@/data/core';
import { useApp } from '@/store/app';
import { courseStats, nextAttendLabel, type TodayState } from '@/screens/attendance/data';
import { allFiles, ddayCount, dday, detailMeta, dueShort, getCourse, professorOf, type Assignment } from './data';
import { useIsNew, useSubmissionOf } from './store';
import { FileRow } from './parts';
import s from './Courses.module.css';

/**
 * 과목 상세 — Figma 398:7666 (Course_v4_02_Detail, 새 규칙 적용 프레임)
 * 4타일: 공지 → 첫 공지 상세 · 과제 → 과제 상세 · 강의자료 → 자료 목록 · 출석 → 과목별 출석
 * '전체 3'(공지): Figma에 목록 화면이 없어 카드 안에서 펼침/접기
 */
export function CourseDetail() {
  const { id } = useParams();
  const { course, info } = getCourse(id);
  const nav = useNav();
  const isNew = useIsNew(course.id);
  const submissionOf = useSubmissionOf(course.id);
  const complete = useApp((st) => st.attendanceComplete);
  const attendTime = useApp((st) => st.attendanceTime);
  const attendMethod = useApp((st) => st.attendanceMethod);
  const today: TodayState = { complete, method: attendMethod, time: attendTime };
  const [expanded, setExpanded] = useState(false);
  const [menu, setMenu] = useState(false);

  const newCount = info.notices.filter(isNew).length;
  const firstNotice = info.notices.find(isNew) ?? info.notices[0];
  const open = info.assignments.filter((a) => !a.closed).sort((a, b) => a.due.getTime() - b.due.getTime());
  const pending = open.filter((a) => !submissionOf(a));
  const main: Assignment | undefined = pending[0] ?? open[0] ?? info.assignments[0];
  const others = open.filter((a) => a !== main);
  const files = allFiles(info);
  const notices = expanded ? info.notices : info.notices.slice(0, 2);

  // 출석 숫자는 출석 탭과 같은 데이터(attendance/data.ts)에서 파생 — 오늘 서비스디자인 인증(attendanceComplete)도 반영
  const att = courseStats(course.id, today);
  const todayAttend = course.id === 'service-design' && complete;
  const attendNext = todayAttend ? `오늘 ${attendTime ?? '10:01'} 출석 완료 · ${attendMethod ?? 'PIN'} 인증` : nextAttendLabel(course.id, today);
  const attendWarn = att.absent > 0;

  const assignmentSub = pending.length > 0 ? `${pending.length}개 진행` : open.length > 0 ? '제출 완료' : main ? '모두 마감' : '없음';

  return (
    <Screen
      figma="398:7666"
      header={<TopNav title="과목 상세" fallback={P.courses} trailing={<IconButton icon="more" label="더보기" onPress={() => setMenu(true)} />} />}
      overlay={
        <BottomSheet open={menu} onClose={() => setMenu(false)} label={`${course.name} 메뉴`}>
          <Text variant="title-2" as="h2" style={{ marginBottom: 8 }}>
            {course.name}
          </Text>
          <ListGroup plain style={{ paddingInline: 0 }}>
            <ListRow
              leading={<LeadingIcon icon="board" />}
              title="과목 게시판"
              meta="공지 · 질문 · 팀플 글 모아 보기"
              chevron
              onPress={() => {
                setMenu(false);
                nav.push(P.boardCourse(course.id));
              }}
            />
            <ListRow
              leading={<LeadingIcon icon="timetable" />}
              title="시간표에서 보기"
              meta={course.online ? '사이버 강의 · 시간표 하단 표시' : course.slots.map((sl) => `${sl.day} ${sl.start}–${sl.end}`).join(', ')}
              chevron
              onPress={() => {
                setMenu(false);
                nav.tab(P.timetable);
              }}
            />
            {!course.online && (
              <ListRow
                leading={<LeadingIcon icon="pin" />}
                title="강의실 위치"
                meta={course.room}
                chevron
                onPress={() => {
                  setMenu(false);
                  nav.push(P.campusMap);
                }}
              />
            )}
          </ListGroup>
        </BottomSheet>
      }
    >
      {/* 과목 헤더: 칩 · Title 1 · 메타 */}
      <div className={s.detailHero}>
        <div className={s.chips}>
          <Chip tone="brand">{course.kind}</Chip>
          <Chip tone="neutral">{course.credits}학점</Chip>
          <Chip tone="neutral">{SEMESTER}</Chip>
          {course.online && <Chip tone="pulse">사이버</Chip>}
        </div>
        <Text variant="title-1" as="h1">
          {course.name}
        </Text>
        <Text variant="caption-1" color="secondary" as="p">
          {detailMeta(course)}
        </Text>
      </div>

      {/* 4열 타일 */}
      <div className={s.tiles}>
        <Tile icon="notice" label="공지" sub={newCount > 0 ? `${newCount}개 새 글` : `${info.notices.length}개`} subColor={newCount > 0 ? 'brand' : 'tertiary'} onPress={() => nav.push(P.courseNotice(course.id, firstNotice.id))} />
        <Tile
          icon="assignment"
          label="과제"
          sub={assignmentSub}
          subColor={assignmentSub === '제출 완료' ? 'brand' : 'tertiary'}
          onPress={() => (main ? nav.push(P.assignment(course.id, main.id)) : toast('진행 중인 과제가 없어요'))}
        />
        <Tile icon="materials" label="강의자료" sub={`${files.length}개`} onPress={() => nav.push(P.courseMaterials(course.id))} />
        <Tile icon="attendance" label="출석" sub={`${att.rate}%`} subColor={attendWarn ? 'error' : 'tertiary'} onPress={() => nav.push(P.attendanceCourse(course.id))} />
      </div>

      {main && (
        <>
          <SectionDivider />
          <Section title={main.closed ? '지난 과제' : ddayCount(main.due) <= 3 ? '마감 임박 과제' : '진행 중인 과제'}>
            <AssignmentCard courseId={course.id} a={main} done={!!submissionOf(main)} />
            {others.length > 0 && (
              <ListGroup style={{ marginTop: 12 }}>
                {others.map((a) => {
                  const done = !!submissionOf(a);
                  return (
                    <ListRow
                      key={a.id}
                      title={a.title}
                      meta={`${dueShort(a.due)} 마감 · ${done ? '제출 완료' : '미제출'}`}
                      trailing={<Chip tone={done ? 'brand' : 'neutral'}>{done ? '제출 완료' : dday(a.due)}</Chip>}
                      chevron
                      onPress={() => nav.push(P.assignment(course.id, a.id))}
                    />
                  );
                })}
              </ListGroup>
            )}
          </Section>
        </>
      )}

      <SectionDivider />
      <Section title="공지사항" more={info.notices.length > 2 ? (expanded ? '접기' : `전체 ${info.notices.length}`) : undefined} onMore={() => setExpanded((v) => !v)}>
        <ListGroup>
          {notices.map((n) => (
            <ListRow
              key={n.id}
              title={n.title}
              titleAddon={isNew(n) ? <NewBadge /> : undefined}
              meta={
                <Text variant="caption-2" color="secondary" className="truncate tnum">
                  {n.date} · {professorOf(course)} 교수
                </Text>
              }
              onPress={() => nav.push(P.courseNotice(course.id, n.id))}
            />
          ))}
        </ListGroup>
      </Section>

      <SectionDivider />
      <Section title="강의자료" more={`전체 ${files.length}`} onMore={() => nav.push(P.courseMaterials(course.id))}>
        <div className={s.fileList}>
          {files.slice(0, 2).map((f) => (
            <FileRow key={f.id} file={f} withDate titleVariant="subhead" />
          ))}
        </div>
      </Section>

      <SectionDivider />
      <Section title="출석 현황">
        <Card variant="subtle" className={s.attendCard} onPress={() => nav.push(P.attendanceCourse(course.id))} aria-label="과목 출석 현황 보기">
          <div className={s.attendInfo}>
            <Text variant="subhead" as="p" className="tnum">
              출석 {att.present} · 지각 {att.late} · 결석 {att.absent}
            </Text>
            <Text variant="caption-2" color="secondary" as="p" className="truncate">
              {attendNext}
            </Text>
          </div>
          <Text variant="number" color={attendWarn ? 'error' : 'brand'} tnum>
            {att.rate}%
          </Text>
        </Card>
      </Section>
    </Screen>
  );
}

/* ── 마감 임박 과제 카드 (brand-soft, Button v4 Primary M) ────────── */
function AssignmentCard({ courseId, a, done }: { courseId: string; a: Assignment; done: boolean }) {
  const nav = useNav();
  const n = ddayCount(a.due);
  const tone: ChipTone = done ? 'white' : a.closed ? 'white' : n === 0 ? 'danger' : n <= 3 ? 'dangerSoft' : 'white';
  const go = () => nav.push(P.assignment(courseId, a.id));
  return (
    <Card variant="soft" className={s.assignCard}>
      <div className={s.assignHead}>
        <div className={s.cardInfo}>
          <Text variant="headline" as="h3" className="truncate">
            {a.title}
          </Text>
          <Text variant="caption-2" color="secondary" as="p" className="truncate">
            {a.closed ? `${dueShort(a.due)} 마감됨` : `${dueShort(a.due)} 마감`} · {done ? '제출 완료' : '미제출'} · PDF
          </Text>
        </div>
        <Chip tone={tone} pill icon={done ? 'check' : undefined}>
          {done ? '제출 완료' : dday(a.due)}
        </Chip>
      </div>
      {done || a.closed ? (
        <Button variant="outline" size="m" block onClick={go}>
          {done ? '제출 내역 보기' : '과제 보기'}
        </Button>
      ) : (
        <Button size="m" block onClick={go}>
          과제 확인하고 제출하기
        </Button>
      )}
    </Card>
  );
}
