import { useRef, useState, type ReactNode } from 'react';
import { useParams } from 'react-router';
import { Button, CtaBar, Dialog, Screen, Text, TopNav, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { courseById } from '@/data/core';
import { useIsSubmitted } from '@/screens/courses/store';
import { assignmentStatus } from './agenda';
import { CAT, eventWhen, type CalEvent } from './data';
import { useSchedule } from './store';
import { CategoryBadge, EmptyNote, InfoBox, InfoRow, MapLink } from './parts';
import s from './Calendar.module.css';

/**
 * 일정 상세 — Figma v5 686:6658 (학사 · 취업박람회) · 697:7572 (내 일정) · 697:7639 (삭제 확인: 같은 라우트의 상태)
 * 배지 · 제목(Title 2) · 정보 박스(일시 / 장소+지도 / 알림) · 본문(Body 2 secondary) · 하단 버튼(일정 종류별 1~2개)
 *   학사(사전 신청): [사전 신청하기] — 신청 상태는 useSchedule.applied 단일 기준(학사 공지 n3와 공유)
 *   내 일정: [삭제] [수정] → 삭제 확인 → 캘린더로 (일정 제거)
 */
export function EventDetail() {
  const { id = 'e1' } = useParams();
  const nav = useNav();
  const event = useSchedule((st) => st.events.find((e) => e.id === id));
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
        <div style={{ padding: '8px 20px' }}>
          <EmptyNote title="일정을 찾을 수 없어요" desc="삭제됐거나 지난 일정이에요" />
        </div>
      </Screen>
    );
  }

  const course = e.courseId ? courseById(e.courseId) : null;
  const status = assignmentStatus(e, { isSubmitted });
  const alarm = e.alarm && e.alarm !== '없음' ? e.alarm : '없음';

  /* 하단 버튼: 일정 종류별 */
  let footer: ReactNode = null;
  if (e.user) {
    footer = (
      <CtaBar>
        <Button variant="secondary" onClick={() => setConfirm(true)}>
          삭제
        </Button>
        <Button onClick={() => nav.modal(`${P.calendarNew}?edit=${e.id}`)}>수정</Button>
      </CtaBar>
    );
  } else if (e.apply) {
    footer = (
      <CtaBar>
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
      </CtaBar>
    );
  } else if (e.noticeId) {
    footer = (
      <CtaBar>
        <Button variant="secondary" onClick={() => nav.push(P.academicNotice(e.noticeId))}>
          공지 원문 보기
        </Button>
      </CtaBar>
    );
  } else if (course && e.to) {
    footer = (
      <CtaBar>
        <Button onClick={() => nav.push(e.to!)}>{status === '제출 완료' ? '제출 내역 보기' : '과제 보기'}</Button>
      </CtaBar>
    );
  }

  return (
    <Screen
      figma={e.user ? '697:7572' : '686:6658'}
      // Figma 697:7572 뒤로 → 686:6385 캘린더 (저장 직후 들어와도 폼이 아니라 캘린더로)
      header={<TopNav title="일정" fallback={P.calendar} />}
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
        <CategoryBadge category={e.category} label={CAT[e.category].detail} />
        <Text variant="title-2" as="h1">
          {e.title}
        </Text>

        <div className={s.info}>
          <InfoBox>
            <InfoRow label="일시" value={eventWhen(e)} />
            {e.place && <InfoRow label="장소" value={e.place} trailing={e.onCampus ? <MapLink onPress={() => nav.push(P.campusMap)} /> : undefined} />}
            {course && <InfoRow label="과목" value={`${course.name}${status ? ` · ${status}` : ''}`} />}
            <InfoRow label="알림" value={alarm} />
          </InfoBox>
        </div>
      </div>

      {e.description && (
        <Text variant="body-2" color="secondary" as="p" className={s.descText} style={{ paddingInline: 20 }}>
          {e.description}
        </Text>
      )}
    </Screen>
  );
}
