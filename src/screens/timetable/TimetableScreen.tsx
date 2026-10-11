import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button, Chip, Dialog, Icon, IconButton, Screen, TabBar, Text, TextAction, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { SEMESTER, TODAY_CLASSES, WEEK_LABEL } from '@/data/core';
import { AttendanceSheet } from '@/screens/attendance/AttendanceSheet';
import { NOW_MIN, josa, toMin, type TTCourse } from './data';
import { useMyCourses, useSchedule } from './store';
import { TimetableGrid } from './TimetableGrid';
import { ClassSheet } from './ClassSheet';
import { BellButton, ScheduleHeader } from './parts';
import sc from './Schedule.module.css';
import s from './Timetable.module.css';

/**
 * 시간표 탭 루트 — Figma 392:7472 (Schedule_v4_01_Root) + 수업 상세 시트 402:7846
 * ?sheet=<courseId> 로 시트가 열린 상태로 진입 (Figma 프레임 402:7846)
 */
export function TimetableScreen() {
  const nav = useNav();
  const [params] = useSearchParams();
  const courses = useMyCourses();
  const lastAdded = useSchedule((st) => st.lastAdded);
  const clearLastAdded = useSchedule((st) => st.clearLastAdded);
  const removeCourse = useSchedule((st) => st.removeCourse);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sheetParam = params.get('sheet');
  const [sheetCourse, setSheetCourse] = useState<TTCourse | null>(() => courses.find((c) => c.id === sheetParam) ?? null);
  const [sheetOpen, setSheetOpen] = useState(!!sheetCourse);
  const [pin, setPin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState<TTCourse | null>(null);
  // 확인창이 닫히는 애니메이션 동안 문구 유지
  const lastRemoving = useRef<TTCourse | null>(null);
  if (removing) lastRemoving.current = removing;
  const removeName = lastRemoving.current?.name ?? '';

  // 학점 규칙(단일): 학점은 수강신청 과목(core)만 센다 — 수강과목·마이·학교 연동과 같은 17학점.
  // 수업 추가로 넣은 과목은 '시간표에만 추가(학점 미반영)' — 실제 정정은 학교 포털에서 하고 동기화로 반영된다.
  const credits = courses.filter((c) => c.core).reduce((a, c) => a + c.credits, 0);
  const extraCount = courses.filter((c) => !c.core).length;
  const grid = courses.filter((c) => c.slots.length);
  const online = courses.filter((c) => !c.slots.length);
  // 오늘(금) 아직 끝나지 않은 첫 수업 → 브랜드 채움 블록 (9:41 기준 서비스디자인)
  const focusId = TODAY_CLASSES.find((id) => courses.some((c) => c.id === id && c.slots.some((sl) => sl.day === '금' && toMin(sl.end) > NOW_MIN)));

  // ?sheet= 진입: 시트 상태로만 쓰고 주소는 정리 (뒤로 돌아왔을 때 시트가 다시 열리지 않게).
  // 라우터 이동 없이 히스토리 항목만 바꿔 화면이 다시 마운트되지 않게 한다.
  useEffect(() => {
    if (!sheetParam) return;
    const [path] = window.location.hash.split('?');
    window.history.replaceState(window.history.state, '', path);
  }, [sheetParam]);

  // 방금 추가한 수업: 보이게 스크롤 + 펄스 후 해제
  useEffect(() => {
    if (!lastAdded) return;
    const el = scrollRef.current?.querySelector<HTMLElement>(`[data-course="${lastAdded}"]`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const t = window.setTimeout(clearLastAdded, 2800);
    return () => window.clearTimeout(t);
  }, [lastAdded, clearLastAdded]);

  const openSheet = (c: TTCourse) => {
    setSheetCourse(c);
    setSheetOpen(true);
  };
  const closeSheet = () => setSheetOpen(false);

  const onBlock = (c: TTCourse) => {
    if (!editing) return openSheet(c);
    if (c.core) toast('수강신청한 과목은 시간표에서 뺄 수 없어요');
    else setRemoving(c);
  };

  return (
    <Screen
      figma="392:7472"
      scrollRef={scrollRef}
      header={
        <ScheduleHeader
          tab="timetable"
          trailing={
            editing ? (
              <TextAction onPress={() => setEditing(false)}>완료</TextAction>
            ) : (
              <>
                <IconButton icon="edit" label="시간표 편집" onPress={() => setEditing(true)} />
                <BellButton />
              </>
            )
          }
        />
      }
      footer={<TabBar active="timetable" onActivePress={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} />}
      overlay={
        <>
          <ClassSheet
            open={sheetOpen}
            course={sheetCourse}
            onClose={closeSheet}
            onAttend={() => {
              closeSheet();
              window.setTimeout(() => setPin(true), 260);
            }}
            onRemove={(c) => {
              closeSheet();
              window.setTimeout(() => setRemoving(c), 260);
            }}
          />
          <AttendanceSheet open={pin} onClose={() => setPin(false)} />
          <Dialog
            open={!!removing}
            title={`${removeName}${josa(removeName || '수업', '을', '를')} 시간표에서 뺄까요?`}
            message="직접 추가한 수업이라 언제든 다시 추가할 수 있어요."
            confirmLabel="빼기"
            destructive
            onCancel={() => setRemoving(null)}
            onConfirm={() => {
              if (removing) {
                removeCourse(removing.id);
                toast(`${removing.name}${josa(removing.name, '을', '를')} 시간표에서 뺐어요`, 'check');
              }
              setRemoving(null);
            }}
          />
        </>
      }
    >
      <div className={sc.semester}>
        <Chip tone="brand" pill>
          {SEMESTER}
        </Chip>
        <Text variant="caption-1" color="secondary">
          {WEEK_LABEL} · {credits}학점
        </Text>
      </div>
      {extraCount > 0 && (
        <div className={s.extraNote} role="note">
          <span className={s.extraSwatch} aria-hidden />
          <Text variant="caption-2" color="secondary">
            점선 수업 {extraCount}개는 시간표에만 추가했어요 · 학점 미반영
          </Text>
        </div>
      )}

      {editing && (
        <div className={s.editHint} role="status">
          <Icon name="edit" size={16} />
          <Text variant="caption-1-strong" color="brand">
            {courses.some((c) => !c.core) ? '직접 추가한 수업을 눌러 시간표에서 뺄 수 있어요' : '직접 추가한 수업이 없어요 · 수업 추가로 넣어 보세요'}
          </Text>
        </div>
      )}

      <TimetableGrid courses={grid} focusId={focusId} editing={editing} newId={lastAdded} onBlock={onBlock} />

      {online.map((c) => (
        <button
          key={c.id}
          type="button"
          className={s.online}
          data-course={c.id}
          style={editing && c.core ? { opacity: 0.4 } : undefined}
          onClick={() => (c.core ? (editing ? onBlock(c) : nav.push(P.course(c.id))) : editing ? setRemoving(c) : openSheet(c))}
        >
          <Chip tone="pulse">사이버</Chip>
          <span className={s.onlineMain}>
            <Text variant="subhead" className="truncate">
              {c.name}
            </Text>
            <Text variant="caption-2" color="secondary" className="truncate">
              {c.onlineNote}
            </Text>
          </span>
          <Icon name={editing && !c.core ? 'close' : 'arrow-right'} size={20} color={editing && !c.core ? 'error' : 'primary'} />
        </button>
      ))}

      <div className={s.actions}>
        <Button variant="soft" grow leadingIcon="plus" onClick={() => nav.modal(P.timetableAdd)}>
          수업 추가
        </Button>
        <Button variant="soft" grow leadingIcon={editing ? 'check' : 'edit'} onClick={() => setEditing((v) => !v)}>
          {editing ? '편집 완료' : '시간표 편집'}
        </Button>
      </div>
    </Screen>
  );
}
