import { useState } from 'react';
import { useParams } from 'react-router';
import { Button, CtaBar, Screen, Text, TopNav, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { NOTICE_LIST, noticeById } from './data';
import { useInfo } from './store';
import { NoticeBadges } from './parts';
import { applyEventIdForNotice, useSchedule } from '@/screens/timetable/store';
import s from './Info.module.css';

/**
 * 학사 공지 상세 — Figma v5 688:6925 (n1 그대로) · n2–n7은 같은 템플릿의 가상 공지
 * 배지 · 제목(Title 2) · '부서 · 날짜 · 조회'(Caption 1) · 한눈에 보기 박스 · 본문(Body 2).
 * 하단: [공지별 행동(Secondary)] [캘린더에 추가(Primary)] — Figma 두 버튼 모두 캘린더(686:6385)로 DISSOLVE.
 */
export function AcademicNotice() {
  const nav = useNav();
  const { id } = useParams();
  const n = noticeById(id) ?? NOTICE_LIST[0];
  const inCalendar = useInfo((st) => st.inCalendar[n.id]);
  const addToCalendar = useInfo((st) => st.addToCalendar);
  // 참가 신청은 캘린더 일정(e1)과 같은 상태 — 어느 쪽에서 신청해도 양쪽 모두 '신청 완료'
  const applyId = applyEventIdForNotice(n.id);
  const applied = useSchedule((st) => !!applyId && st.applied.includes(applyId));
  const applyEvent = useSchedule((st) => st.apply);
  const [loading, setLoading] = useState(false);

  const toCalendar = () => nav.fade(P.calendar);

  const onCalendar = () => {
    if (!inCalendar) {
      addToCalendar(n.id);
      toast(`‘${n.calendarLabel}’ 일정을 캘린더에 추가했어요`, 'check');
    }
    toCalendar();
  };

  const onSecondary = () => {
    const a = n.secondary.action;
    if (a === 'calendar') toCalendar();
    else if (a === 'portal') toast('학교 포털 연결은 다음 버전에서 열려요');
    else if (!applied) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        if (applyId) applyEvent(applyId);
        toast('취업박람회 참가 신청을 마쳤어요', 'check');
      }, 900);
    }
  };
  const done = n.secondary.action === 'apply' && applied;

  return (
    <Screen
      figma="688:6925"
      header={<TopNav title="학사 공지" fallback={P.notices} />}
      footer={
        <CtaBar>
          <Button variant="secondary" loading={loading} disabled={done} leadingIcon={done ? 'check' : undefined} onClick={onSecondary}>
            {done ? (n.secondary.doneLabel ?? n.secondary.label) : n.secondary.label}
          </Button>
          <Button variant="primary" onClick={onCalendar}>
            {inCalendar ? '캘린더에서 보기' : '캘린더에 추가'}
          </Button>
        </CtaBar>
      }
    >
      <article className={s.article}>
        <div className={s.badges}>
          <NoticeBadges n={n} />
        </div>
        <div className={s.articleHead}>
          <Text variant="title-2" as="h1">
            {n.title}
          </Text>
          <Text variant="caption-1" color="tertiary" as="p" className="tnum">
            {n.meta}
          </Text>
        </div>

        <dl className={s.keyDates} aria-label="한눈에 보기">
          {n.keyDates.map((k) => (
            <div key={k.label} className={s.keyRow}>
              <Text variant="body-3" color="tertiary" as="dt">
                {k.label}
              </Text>
              <Text variant="body-3-strong" as="dd" className="tnum">
                {k.value}
              </Text>
            </div>
          ))}
        </dl>

        <Text variant="body-2" color="secondary" as="p" className={s.body}>
          {n.body}
        </Text>
      </article>
    </Screen>
  );
}
