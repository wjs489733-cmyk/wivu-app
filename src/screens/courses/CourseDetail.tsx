import { useState } from 'react';
import { useParams } from 'react-router';
import { BottomSheet, Button, Chip, IconButton, Screen, Section, SheetAction, SheetHead, Text, TopNav, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { courseStats, type TodayState } from '@/screens/attendance/data';
import { allFiles, dday, ddayCount, detailMeta, dueShort, getCourse, type Assignment } from './data';
import { useIsNew, useSubmissionOf } from './store';
import { FileRow, ItemRow } from './parts';
import { useQueryOnce } from './useQueryOnce';
import s from './Courses.module.css';

/**
 * 과목 상세 — Figma v5 684:6082 (+ 과목 메뉴 시트 702:8502 = 같은 라우트의 상태, ?sheet=menu 로 바로 열기)
 * 바로가기 4칸: 공지 → 첫 새 공지(684:6409) · 과제 → 과제 상세(684:6198) · 강의자료 → 목록(684:6453) · 출석 → 과목 출석 상세
 * '전체 3'(공지): Figma엔 목록 화면이 없어 같은 자리에서 펼침/접기 (3번째 공지로 가는 유일한 길)
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
  const sheetParam = useQueryOnce('sheet');
  const [expanded, setExpanded] = useState(false);
  const [menu, setMenu] = useState(sheetParam === 'menu');

  const hasNew = info.notices.some(isNew);
  const firstNotice = info.notices.find(isNew) ?? info.notices[0];
  const open = info.assignments.filter((a) => !a.closed).sort((a, b) => a.due.getTime() - b.due.getTime());
  const pending = open.filter((a) => !submissionOf(a));
  const main: Assignment | undefined = pending[0] ?? open[0];
  const others = open.filter((a) => a !== main);
  const files = allFiles(info);
  const notices = expanded ? info.notices : info.notices.slice(0, 2);
  // 출석 숫자는 출석 탭과 같은 데이터(attendance/data.ts)에서 파생 — 오늘 서비스디자인 인증(attendanceComplete)도 반영
  const att = courseStats(course.id, today);

  const go = (fn: () => void) => () => {
    setMenu(false);
    fn();
  };

  return (
    <Screen
      figma="684:6082"
      header={<TopNav title="과목 상세" fallback={P.courses} trailing={<IconButton icon="more" label="더보기" onPress={() => setMenu(true)} />} />}
      overlay={
        <BottomSheet open={menu} onClose={() => setMenu(false)} label={`${course.name} 메뉴`}>
          <SheetHead title={course.name} onClose={() => setMenu(false)} />
          <SheetAction icon="comment" label="과목 게시판" description="공지 · 질문 · 팀플 글 모아 보기" chevron onPress={go(() => nav.push(P.boardCourse(course.id)))} />
          <SheetAction
            icon="timetable"
            label="시간표에서 보기"
            description={course.online ? '사이버 강의 · 시간표 아래에 표시' : course.slots.map((sl) => `${sl.day} ${sl.start}–${sl.end}`).join(', ')}
            chevron
            onPress={go(() => nav.tab(P.timetable))}
          />
          {!course.online && <SheetAction icon="pin" label="강의실 위치" description={course.room} chevron onPress={go(() => nav.push(P.campusMap))} />}
        </BottomSheet>
      }
    >
      {/* 과목 머리: 배지 · Title 2 · 메타 */}
      <div className={s.head}>
        <Chip tone="neutral">
          {course.kind} · {course.credits}학점
        </Chip>
        <Text variant="title-2" as="h1" style={{ marginTop: 8 }}>
          {course.name}
        </Text>
        <Text variant="body-3" color="secondary" as="p" style={{ marginTop: 4 }}>
          {detailMeta(course)}
        </Text>
      </div>

      {/* 바로가기 4칸 (숫자 Title 3 + 라벨 Caption 1) */}
      <div className={s.stats}>
        <Stat value={info.notices.length} label="공지" color={hasNew ? 'brand' : 'primary'} onPress={() => nav.push(P.courseNotice(course.id, firstNotice.id))} />
        <Stat value={open.length} label="과제" onPress={() => (main ? nav.push(P.assignment(course.id, main.id)) : toast('진행 중인 과제가 없어요'))} />
        <Stat value={files.length} label="강의자료" onPress={() => nav.push(P.courseMaterials(course.id))} />
        <Stat value={`${att.rate}%`} label="출석" color={att.absent > 0 ? 'error' : 'primary'} onPress={() => nav.push(P.attendanceCourse(course.id))} />
      </div>

      <div className={s.sections}>
        {main && (
          <Section title={ddayCount(main.due) <= 3 ? '마감 임박 과제' : '진행 중인 과제'} padded={false} style={{ gap: 2 }}>
            <div className={s.inset}>
              <AssignmentCard courseId={course.id} a={main} done={!!submissionOf(main)} />
              {others.map((a) => {
                const done = !!submissionOf(a);
                return (
                  <ItemRow
                    key={a.id}
                    title={a.title}
                    badge={<Chip tone={done ? 'brand' : 'neutral'} className={done ? undefined : 'font-en'}>{done ? '제출 완료' : dday(a.due)}</Chip>}
                    meta={`${dueShort(a.due)} 마감 · ${done ? '제출 완료' : '미제출'}`}
                    chevron
                    onPress={() => nav.push(P.assignment(course.id, a.id))}
                  />
                );
              })}
            </div>
          </Section>
        )}

        <Section title="공지사항" more={info.notices.length > 2 ? (expanded ? '접기' : `전체 ${info.notices.length}`) : undefined} onMore={() => setExpanded((v) => !v)} padded={false} style={{ gap: 2 }}>
          <div className={s.inset}>
            {notices.map((n) => (
              <ItemRow
                key={n.id}
                title={n.title}
                badge={
                  isNew(n) ? (
                    <Chip tone="brand" className="font-en">
                      NEW
                    </Chip>
                  ) : undefined
                }
                meta={`${n.date} · 조회 ${n.views}`}
                chevron
                onPress={() => nav.push(P.courseNotice(course.id, n.id))}
              />
            ))}
          </div>
        </Section>

        <Section title="강의자료" more={`전체 ${files.length}`} onMore={() => nav.push(P.courseMaterials(course.id))} padded={false} style={{ gap: 2 }}>
          <div className={s.inset}>
            {files.slice(0, 2).map((f) => (
              <FileRow key={f.id} file={f} withDate />
            ))}
          </div>
        </Section>
      </div>
    </Screen>
  );
}

/* ── 바로가기 한 칸 ─────────────────────────────────────────── */
function Stat({ value, label, color = 'primary', onPress }: { value: number | string; label: string; color?: 'primary' | 'brand' | 'error'; onPress: () => void }) {
  return (
    <button type="button" className={s.stat} onClick={onPress} aria-label={`${label} ${value}`}>
      <Text variant="title-3" color={color} className="tnum">
        {value}
      </Text>
      <Text variant="caption-1" color="secondary">
        {label}
      </Text>
    </button>
  );
}

/* ── 과제 카드 (아웃라인 r16 · Body 1 Strong · Caption 1 · 배지 · Button M) ── */
function AssignmentCard({ courseId, a, done }: { courseId: string; a: Assignment; done: boolean }) {
  const nav = useNav();
  const n = ddayCount(a.due);
  const go = () => nav.push(P.assignment(courseId, a.id));
  return (
    <div className={s.assignCard}>
      <div className={s.assignHead}>
        <div className={s.assignText}>
          <Text variant="body-1-strong" as="h3" className="truncate">
            {a.title}
          </Text>
          <Text variant="caption-1" color="tertiary" as="p" className="truncate tnum">
            {dueShort(a.due)} 마감 · {done ? '제출 완료' : '미제출'} · PDF
          </Text>
        </div>
        {done ? (
          <Chip tone="brand">제출 완료</Chip>
        ) : (
          <Chip tone={n === 0 ? 'dangerSoft' : 'neutral'} className="font-en">
            {dday(a.due)}
          </Chip>
        )}
      </div>
      {done ? (
        <Button variant="secondary" size="m" block onClick={go}>
          제출 내역 보기
        </Button>
      ) : (
        <Button size="m" block onClick={go}>
          과제 확인하고 제출하기
        </Button>
      )}
    </div>
  );
}
