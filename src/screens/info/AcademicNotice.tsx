import { useState } from 'react';
import { useParams } from 'react-router';
import { Button, Chip, CtaBar, Icon, Screen, Text, TopNav, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { ACADEMIC_NOTICES, noticeById } from './data';
import { useInfo } from './store';
import { applyEventIdForNotice, useSchedule } from '@/screens/timetable/store';
import s from './Info.module.css';

/**
 * 학사 공지 상세 — Figma 430:9007 (n1 그대로) · n2/n3는 같은 템플릿의 가상 공지
 * 하단: '캘린더에 추가'(추가 → 토스트, 추가된 뒤엔 캘린더 탭으로) + 공지별 주요 행동 1개
 */
export function AcademicNotice() {
  const nav = useNav();
  const { id } = useParams();
  const n = noticeById(id) ?? ACADEMIC_NOTICES[0];
  const inCalendar = useInfo((st) => st.inCalendar[n.id]);
  // 참가 신청은 캘린더 일정(e1)과 같은 상태 — 어느 쪽에서 신청해도 양쪽 모두 '신청 완료'
  const applyId = applyEventIdForNotice(n.id);
  const applied = useSchedule((st) => !!applyId && st.applied.includes(applyId));
  const applyEvent = useSchedule((st) => st.apply);
  const addToCalendar = useInfo((st) => st.addToCalendar);
  const [loading, setLoading] = useState(false);

  const onCalendar = () => {
    if (inCalendar) {
      // Figma: 캘린더에 추가 → 시간표 탭 · 캘린더(392:7540) INSTANT
      nav.tab(P.calendar);
      return;
    }
    addToCalendar(n.id);
    toast(`‘${n.calendarLabel}’ 일정을 캘린더에 추가했어요`, 'check');
  };

  const onPrimary = () => {
    if (n.primary.action === 'timetableAdd') {
      nav.modal(P.timetableAdd);
    } else if (n.primary.action === 'portal') {
      toast('학교 포털 연결은 다음 버전에서 열려요');
    } else if (!applied) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        if (applyId) applyEvent(applyId);
        toast('취업박람회 참가 신청을 마쳤어요', 'check');
      }, 900);
    }
  };
  const done = n.primary.action === 'apply' && applied;

  return (
    <Screen
      figma="430:9007"
      header={<TopNav title="학사 공지" fallback={P.notices} />}
      footer={
        <CtaBar>
          <Button variant="soft" leadingIcon={inCalendar ? 'check' : undefined} onClick={onCalendar}>
            {inCalendar ? '캘린더에서 보기' : '캘린더에 추가'}
          </Button>
          <Button variant="primary" loading={loading} disabled={done} leadingIcon={done ? 'check' : undefined} onClick={onPrimary}>
            {done ? n.primary.doneLabel ?? n.primary.label : n.primary.label}
          </Button>
        </CtaBar>
      }
    >
      <article className={s.article}>
        <div className={s.chips}>
          {n.chips.map((c) => (
            <Chip key={c.label} tone={c.danger ? 'dangerSoft' : c.tone}>
              {c.label}
            </Chip>
          ))}
        </div>

        <Text variant="title-1" as="h1">
          {n.title}
        </Text>

        <div className={s.author}>
          <span className={s.authorIcon}>
            <Icon name="library" size={20} />
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <Text variant="label">{n.author}</Text>
            <Text variant="caption-2" color="tertiary" tnum>
              {n.meta}
            </Text>
          </span>
        </div>

        <section className={s.keyDates} aria-label="한눈에 보기">
          <Text variant="caption-1-strong" color="secondary" as="h2">
            한눈에 보기
          </Text>
          {n.keyDates.map((k) => (
            <div key={k.label} className={s.keyRow}>
              <Text variant="caption-1" color="secondary">
                {k.label}
              </Text>
              <Text variant="label" color={k.emphasis ? 'brand' : 'primary'} tnum>
                {k.value}
              </Text>
            </div>
          ))}
        </section>

        <Text variant="body" as="p" className={s.body}>
          {n.body}
        </Text>

        <div className={s.context}>
          <Icon name={n.context.icon} size={20} />
          <Text variant="caption-1-strong" color="brand">
            {n.context.text}
          </Text>
        </div>
      </article>
    </Screen>
  );
}
