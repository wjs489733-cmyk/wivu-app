import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button, Chip, CtaBar, Dialog, Icon, LargeHeader, Screen, TabBar, Text, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { SEMESTER, WEEK_LABEL } from '@/data/core';
import { AttendanceSheet } from '@/screens/attendance/AttendanceSheet';
import { josa, type TTCourse } from './data';
import { useMyCourses, useSchedule } from './store';
import { TimetableGrid } from './TimetableGrid';
import { ClassSheet } from './ClassSheet';
import { BellButton, RemoveBadge, ScheduleHeader } from './parts';
import s from './Timetable.module.css';

/** 수강신청 과목의 '−'를 눌렀을 때 (프로토타입에선 뺄 수 없음 — 실제 정정은 학교 포털) */
const ENROLLED_TOAST = '수강신청한 과목은 학교 포털에서 바꿀 수 있어요';

/**
 * 시간표 탭 루트 — Figma v5 685:6192 (+ 수업 상세 시트 685:6329)
 * 편집 모드(같은 라우트의 상태) — 697:7142 시간표 편집 · 697:7306 수업 빼기 확인
 *   [시간표 편집] → 헤더 '시간표 편집', 안내 배너, 모든 블록에 '−', 하단 [수업 추가] [완료], 탭바 숨김.
 *   직접 추가한 수업 '−' → 확인창 → 빼기(→ 시간표 탭). 수강신청 과목 '−' → 토스트(학교 포털 안내).
 * 진입 쿼리: ?sheet=<courseId> 시트 열린 상태 · ?edit=1 편집 모드
 */
export function TimetableScreen() {
  const nav = useNav();
  const [params] = useSearchParams();
  const courses = useMyCourses();
  const removeCourse = useSchedule((st) => st.removeCourse);
  const lastAdded = useSchedule((st) => st.lastAdded);
  const clearLastAdded = useSchedule((st) => st.clearLastAdded);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sheetParam = params.get('sheet');
  const [sheetCourse, setSheetCourse] = useState<TTCourse | null>(() => courses.find((c) => c.id === sheetParam) ?? null);
  const [sheetOpen, setSheetOpen] = useState(!!sheetCourse);
  const [pin, setPin] = useState(false);
  const [editing, setEditing] = useState(params.get('edit') === '1');
  const [removing, setRemoving] = useState<TTCourse | null>(null);
  // 확인창이 닫히는 애니메이션 동안 문구 유지
  const lastRemoving = useRef<TTCourse | null>(null);
  if (removing) lastRemoving.current = removing;
  const removeName = lastRemoving.current?.name ?? '';

  // Figma 685:6192 '6과목 17학점' · 697:7142 '7과목 20학점' — 시간표에 놓인 과목 기준(직접 추가 포함)으로 센다
  const credits = courses.reduce((a, c) => a + c.credits, 0);
  const grid = courses.filter((c) => c.slots.length);
  const online = courses.filter((c) => !c.slots.length);

  // 주소 정리: ?sheet=는 한 번만 쓰고 지우고, 편집 모드는 ?edit=1로 남긴다
  // (수업 추가 모달에서 돌아와도 편집 모드 유지). 라우터 이동 없이 히스토리 항목만 바꿔 다시 마운트되지 않게.
  useEffect(() => {
    const [path] = window.location.hash.split('?');
    const next = editing ? `${path}?edit=1` : path;
    if (window.location.hash !== next) window.history.replaceState(window.history.state, '', next);
  }, [editing]);

  useEffect(() => {
    if (lastAdded) clearLastAdded();
  }, [lastAdded, clearLastAdded]);

  const openSheet = (c: TTCourse) => {
    setSheetCourse(c);
    setSheetOpen(true);
  };
  const closeSheet = () => setSheetOpen(false);
  const askRemove = (c: TTCourse) => (c.core ? toast(ENROLLED_TOAST) : setRemoving(c));
  const startEdit = () => {
    setEditing(true);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  return (
    <Screen
      figma="685:6192"
      scrollRef={scrollRef}
      header={editing ? <LargeHeader title="시간표 편집" /> : <ScheduleHeader tab="timetable" trailing={<BellButton />} />}
      footer={
        editing ? (
          <CtaBar>
            <Button variant="secondary" onClick={() => nav.modal(P.timetableAdd)}>
              수업 추가
            </Button>
            <Button onClick={() => setEditing(false)}>완료</Button>
          </CtaBar>
        ) : (
          <TabBar active="timetable" onActivePress={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} />
        )
      }
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
              // Figma 697:7306 [빼기] → 685:6192 (편집 끝난 시간표)
              setEditing(false);
            }}
          />
        </>
      }
    >
      <Text variant="caption-1" color="tertiary" as="p" className={s.summary}>
        {SEMESTER} · {WEEK_LABEL} · {courses.length}과목 {credits}학점
      </Text>

      <div className={s.body}>
        {editing && (
          <div className={s.hint} role="status">
            <Icon name="info" size={20} />
            <Text variant="caption-1" color="brand">
              − 를 눌러 수업을 빼요. 직접 추가한 수업은 점선으로 보여요.
            </Text>
          </div>
        )}

        <TimetableGrid courses={grid} editing={editing} onBlock={openSheet} onRemove={askRemove} />

        <div style={{ marginTop: 16 }}>
          {online.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                type="button"
                className={s.online}
                style={{ flex: 1, minWidth: 0 }}
                data-course={c.id}
                onClick={() => (c.core ? nav.push(P.course(c.id)) : editing ? askRemove(c) : openSheet(c))}
              >
                <Chip tone="neutral">사이버</Chip>
                <span className={s.onlineMain}>
                  <Text variant="body-2-strong" className="truncate">
                    {c.name}
                  </Text>
                  <Text variant="caption-1" color="tertiary" className="truncate">
                    {c.onlineNote}
                  </Text>
                </span>
                {!(editing && !c.core) && <Icon name="chevron-right" size={20} />}
              </button>
              {editing && !c.core && (
                <span className={s.onlineRemove}>
                  <RemoveBadge label={`${c.name} 빼기`} onPress={() => askRemove(c)} />
                </span>
              )}
            </div>
          ))}
        </div>

        {!editing && (
          <div className={s.actions}>
            <Button variant="secondary" size="m" grow leadingIcon="plus" onClick={() => nav.modal(P.timetableAdd)}>
              수업 추가
            </Button>
            <Button variant="secondary" size="m" grow onClick={startEdit}>
              시간표 편집
            </Button>
          </div>
        )}
      </div>
    </Screen>
  );
}
