import { useRef, useState, type ReactNode } from 'react';
import { useParams } from 'react-router';
import { Button, Chip, CtaBar, Dialog, Icon, IconButton, Screen, SectionDivider, Switch, Text, TopNav, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { courseById } from '@/data/core';
import { useIsSubmitted } from '@/screens/courses/store';
import { assignmentStatus } from './agenda';
import { CAT, dday, longDate, type CalEvent } from './data';
import { useSchedule } from './store';
import { CatDot, EmptyNote, InfoBox, InfoRow, MapChip } from './parts';
import s from './Calendar.module.css';

/**
 * 일정 상세 — Figma 404:7979 (Calendar_v4_02_EventDetail)
 * 학사·과제·개인 일정 공통. 알림 토글은 로컬 스토어에 저장, 개인 일정은 수정·삭제 가능.
 */
export function EventDetail() {
  const { id = 'e1' } = useParams();
  const nav = useNav();
  const event = useSchedule((st) => st.events.find((e) => e.id === id));
  const alarmOn = useSchedule((st) => !!st.alarms[id]);
  const setAlarm = useSchedule((st) => st.setAlarm);
  // 사전 신청은 이 스토어 하나가 기준 (학사 공지 n3의 '참가 신청하기'도 같은 값을 읽고 씀)
  const applied = useSchedule((st) => st.applied.includes(id));
  const apply = useSchedule((st) => st.apply);
  const removeEvent = useSchedule((st) => st.removeEvent);
  const isSubmitted = useIsSubmitted();
  const [applying, setApplying] = useState(false);
  const [confirm, setConfirm] = useState(false);
  // 삭제 직후 화면이 내려가는 동안 내용 유지
  const last = useRef<CalEvent | undefined>(event);
  if (event) last.current = event;
  const e = event ?? last.current;

  if (!e) {
    return (
      <Screen header={<TopNav title="일정" fallback={P.calendar} />}>
        <div style={{ padding: 16 }}>
          <EmptyNote icon="calendar" title="일정을 찾을 수 없어요" desc="삭제됐거나 지난 일정이에요" />
        </div>
      </Screen>
    );
  }

  const cat = CAT[e.category];
  const d = dday(e.date);
  const dateText = e.span ? `${longDate(e.span[0])} – ${longDate(e.span[1])}` : longDate(e.date);
  const timeText = e.allDay ? '하루 종일' : e.start && e.end ? `${e.start} – ${e.end}` : `${e.start ?? e.end} 마감`;
  const course = e.courseId ? courseById(e.courseId) : null;
  const status = assignmentStatus(e, { isSubmitted });
  const edit = () => (e.user ? nav.modal(`${P.calendarNew}?edit=${e.id}`) : toast('학교에서 등록한 일정은 수정할 수 없어요'));

  const alarmText = e.alarm && e.alarm !== '없음' ? e.alarm : null;

  /* 하단 버튼: 일정 종류별 */
  let footer: ReactNode = null;
  if (e.user) {
    footer = (
      <CtaBar>
        <Button variant="outline" onClick={() => setConfirm(true)}>
          삭제
        </Button>
        <Button onClick={edit}>수정하기</Button>
      </CtaBar>
    );
  } else if (e.noticeId) {
    footer = (
      <CtaBar>
        <Button variant="soft" onClick={() => nav.push(P.academicNotice(e.noticeId))}>
          공지 원문 보기
        </Button>
        {e.apply ? (
          <Button
            loading={applying}
            disabled={applied}
            leadingIcon={applied ? 'check' : undefined}
            onClick={() => {
              setApplying(true);
              window.setTimeout(() => {
                setApplying(false);
                apply(e.id);
                toast('사전 신청을 완료했어요', 'check');
              }, 900);
            }}
          >
            {applied ? '신청 완료' : '사전 신청하기'}
          </Button>
        ) : (
          <Button leadingIcon="plus" onClick={() => nav.modal(P.timetableAdd)}>
            수업 추가
          </Button>
        )}
      </CtaBar>
    );
  } else if (course) {
    footer = (
      <CtaBar>
        <Button variant="soft" onClick={() => nav.push(P.course(course.id))}>
          과목 상세
        </Button>
        {e.to && <Button onClick={() => nav.push(e.to!)}>{status === '제출 완료' ? '제출 내역 보기' : '과제 보기'}</Button>}
      </CtaBar>
    );
  } else if (e.place && e.onCampus) {
    footer = (
      <CtaBar>
        <Button variant="soft" leadingIcon="map" onClick={() => nav.push(P.campusMap)}>
          강의실 지도에서 보기
        </Button>
      </CtaBar>
    );
  }

  return (
    <Screen
      figma="404:7979"
      header={<TopNav title="일정" fallback={P.calendar} trailing={<IconButton icon="edit" label="일정 수정" onPress={edit} />} />}
      footer={footer}
      overlay={
        <Dialog
          open={confirm}
          title="이 일정을 삭제할까요?"
          message="삭제한 일정은 되돌릴 수 없어요."
          confirmLabel="삭제"
          destructive
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            setConfirm(false);
            removeEvent(e.id);
            toast('일정을 삭제했어요', 'check');
            nav.back(P.calendar);
          }}
        />
      }
    >
      <div className={s.detail}>
        <div className={s.detailHead}>
          <Chip tone={cat.tone}>
            <CatDot category={e.category} />
            {cat.detail}
          </Chip>
          <Text variant="title-1" as="h1">
            {e.title}
          </Text>
          <Text variant="caption-1-strong" color={d === '지난 일정' ? 'tertiary' : 'brand'}>
            {[d, status ?? e.note].filter(Boolean).join(' · ')}
          </Text>
        </div>

        <InfoBox>
          <InfoRow icon="calendar" label="날짜" value={dateText} />
          <InfoRow icon="clock" label="시간" value={timeText} />
          {e.place && <InfoRow icon="pin" label="장소" value={e.place} trailing={e.onCampus ? <MapChip onPress={() => nav.push(P.campusMap)} /> : undefined} />}
          {course && <InfoRow icon="courses" label="과목" value={`${course.name} · ${course.professor} 교수`} />}
          {e.repeat && e.repeat !== '반복 안 함' && <InfoRow icon="clock" label="반복" value={e.repeat} />}
          <InfoRow icon="notice" label="출처" value={e.user ? '직접 추가한 일정' : e.source ?? cat.detail} />
        </InfoBox>

        <div className={s.alarm}>
          <Icon name="bell" size={20} color={alarmOn ? 'primary' : 'secondary'} />
          <span className={s.alarmMain}>
            <Text variant="label">알림</Text>
            <Text variant="caption-2" color="secondary">
              {alarmText ? (alarmOn ? alarmText : `꺼짐 · ${alarmText}`) : '설정한 알림이 없어요'}
            </Text>
          </span>
          <Switch
            checked={alarmOn && !!alarmText}
            label="일정 알림"
            onChange={(v) => {
              if (!alarmText) {
                toast('일정 수정에서 알림 시간을 먼저 정해 주세요');
                return;
              }
              setAlarm(e.id, v);
              toast(v ? `알림을 켰어요 · ${alarmText}` : '알림을 껐어요', v ? 'bell' : undefined);
            }}
          />
        </div>
      </div>

      {e.description && (
        <>
          <SectionDivider />
          <div className={s.desc}>
            <Text variant="title-2" as="h2">
              상세 내용
            </Text>
            <Text variant="body" as="p" className={s.descText}>
              {e.description}
            </Text>
          </div>
        </>
      )}
    </Screen>
  );
}
