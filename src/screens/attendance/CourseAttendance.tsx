import { useState } from 'react';
import { useParams } from 'react-router';
import { BottomSheet, Button, Chip, CtaBar, Icon, IconButton, ListGroup, OptionRow, Screen, Text, TextArea, TopNav, toast } from '@/ui';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { courseById, type Course, type CourseId } from '@/data/core';
import { AttendanceSheetHost } from './AttendanceSheetHost';
import { courseSessions, courseStats, isAttendanceCourse, nextSession, type Session, type TodayState } from './data';
import { SessionRow } from './parts';
import { appealKey, useAttendanceLocal } from './store';
import s from './Attendance.module.css';

/**
 * 과목 출석 상세 — Figma 406:8047 (모션그래픽스). 다른 과목은 같은 틀에 data.ts 기록으로 채움.
 * 하단 버튼: 결석·지각이 있으면 '출석 이의 신청하기'(시트), 오늘 인증 가능한 수업이면 '출석 인증하기'(PIN 시트).
 */
export function CourseAttendance() {
  const { id = 'service-design' } = useParams();
  const courseId: CourseId = isAttendanceCourse(id) ? id : 'service-design';
  const c = courseById(courseId);
  const complete = useApp((st) => st.attendanceComplete);
  const method = useApp((st) => st.attendanceMethod);
  const time = useApp((st) => st.attendanceTime);
  const today: TodayState = { complete, method, time };
  const appeals = useAttendanceLocal((st) => st.appeals);
  const [pin, setPin] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);

  const st = courseStats(courseId, today);
  const sessions = courseSessions(courseId, today);
  const contestable = sessions.filter((r) => r.status === '결석' || r.status === '지각');
  const pending = contestable.filter((r) => appeals[appealKey(courseId, r.date)]);
  const canAttend = sessions.some((r) => r.status === '인증 가능');
  const warn = st.absent > 0 || st.late > 0;
  const next = nextSession(courseId, today);

  const meta = c.online ? ['사이버 강의', `${c.credits}학점`, c.kind] : [`${c.professor} 교수`, compactSlots(c), c.room];

  const footer = canAttend ? (
    <CtaBar>
      <Button block onClick={() => setPin(true)}>
        출석 인증하기
      </Button>
    </CtaBar>
  ) : contestable.length ? (
    <CtaBar>
      <Button variant="soft" block disabled={pending.length === contestable.length} onClick={() => setAppealOpen(true)}>
        {pending.length === contestable.length ? '이의 신청 검토 중' : '출석 이의 신청하기'}
      </Button>
    </CtaBar>
  ) : undefined;

  return (
    <Screen
      figma="406:8047"
      header={<TopNav title="출석 상세" fallback={P.attendance} />}
      footer={footer}
      overlay={
        <>
          {canAttend && <AttendanceSheetHost open={pin} onClose={() => setPin(false)} />}
          {contestable.length > 0 && <AppealSheet open={appealOpen} onClose={() => setAppealOpen(false)} courseId={courseId} sessions={contestable} />}
        </>
      }
    >
      <div className={s.detail}>
        <div className={s.detailHead}>
          <div className={s.detailInfo}>
            <Text variant="title-1" as="h2" className="truncate">
              {c.name}
            </Text>
            <Text variant="caption-1" color="secondary" as="p" lines={2}>
              {meta.join(' · ')}
            </Text>
          </div>
          <div className={s.rate}>
            <Text variant="display" color={st.absent > 0 ? 'error' : 'brand'} tnum>
              {st.rate}%
            </Text>
            <Text variant="caption-2" color="tertiary">
              출석률
            </Text>
          </div>
        </div>

        {warn ? (
          <div className={s.banner} data-tone="error" role="note">
            <Icon name="warning" size={20} color="error" />
            <div className={s.bannerText}>
              <Text variant="label" color="error">
                결석 {st.absent}회 · 지각 {st.late}회
              </Text>
              <Text variant="caption-2" color="secondary" as="p">
                {st.absent > 0 ? (
                  <>
                    남은 수업에서 결석이 3회 더 쌓이면 학점 취득이 어려워요.
                    <br />
                    지각 3회는 결석 1회로 처리돼요.
                  </>
                ) : (
                  '지각 3회는 결석 1회로 처리돼요. 수업 시작 전에 인증해 주세요.'
                )}
              </Text>
            </div>
          </div>
        ) : (
          <div className={s.banner} data-tone="brand" role="note">
            <Icon name="status-present" size={20} color="brand" />
            <div className={s.bannerText}>
              <Text variant="label" color="brand">
                {c.online ? '빠짐없이 수강하고 있어요' : '결석 없이 출석하고 있어요'}
              </Text>
              <Text variant="caption-2" color="secondary" as="p">
                {bannerSub(c.online ?? false, next, today)}
              </Text>
            </div>
          </div>
        )}

        <div className={s.detailStats}>
          <DetailStat label="출석" value={st.present} />
          <DetailStat label="지각" value={st.late} tone="warning" />
          <DetailStat label="결석" value={st.absent} tone="error" />
          <DetailStat label="남은 수업" value={st.remaining} tone="secondary" />
        </div>

        <div className={s.fullDivider} role="separator" />

        <section className={s.sessions}>
          <Text variant="title-2" as="h2" className={s.sessionsTitle}>
            회차별 기록
          </Text>
          <ListGroup>
            {sessions.map((r) => (
              <SessionRow key={r.key} r={r} note={appeals[appealKey(courseId, r.date)] ? `이의 신청 검토 중 · ${appeals[appealKey(courseId, r.date)]}` : undefined} />
            ))}
          </ListGroup>
        </section>
      </div>
    </Screen>
  );
}

/** '월 10:30–11:45, 수 10:30–11:45' → '월·수 10:30–11:45' (같은 시간대면 요일만 묶음) */
function compactSlots(c: Course) {
  const times = new Set(c.slots.map((x) => `${x.start}–${x.end}`));
  if (times.size === 1) return `${c.slots.map((x) => x.day).join('·')} ${[...times][0]}`;
  return c.slots.map((x) => `${x.day} ${x.start}–${x.end}`).join(', ');
}

function bannerSub(online: boolean, next: Session | undefined, t: TodayState) {
  if (online) return next ? `${next.week}주차 강의는 ${next.date} (${next.dow})까지 들으면 돼요.` : '이번 학기 강의를 모두 들었어요.';
  if (!next) return t.complete ? `오늘 ${t.time} ${t.method} 인증까지 기록됐어요.` : '이번 학기 수업이 모두 끝났어요.';
  if (next.status === '인증 가능') return `오늘 ${next.start} 수업 · 10:10까지 출석을 인증해 주세요.`;
  if (next.status === '오늘') return `오늘 ${next.start} 수업이 남아 있어요.`;
  if (t.complete && next.courseId === 'service-design') return `오늘 ${t.time} ${t.method} 인증 완료 · 다음 수업 ${next.date} (${next.dow})`;
  return `다음 수업은 ${next.date} (${next.dow}) ${next.start}이에요.`;
}

function DetailStat({ label, value, tone }: { label: string; value: number; tone?: 'warning' | 'error' | 'secondary' }) {
  return (
    <div className={s.detailStat}>
      <Text variant="number" color={tone ?? 'primary'} tnum>
        {value}
      </Text>
      <Text variant="caption-2" color="secondary">
        {label}
      </Text>
    </div>
  );
}

/* ── 출석 이의 신청 시트 (Figma 목적지 없음 → 코드에서 실제 흐름으로) ── */
const REASONS = ['인증 오류', '병결', '공결', '기타'] as const;

function AppealSheet({ open, onClose, courseId, sessions }: { open: boolean; onClose: () => void; courseId: CourseId; sessions: Session[] }) {
  return (
    <BottomSheet open={open} onClose={onClose} label="출석 이의 신청">
      {/* 열릴 때마다 새로 마운트 → 선택 상태 자동 초기화 */}
      <AppealForm onClose={onClose} courseId={courseId} sessions={sessions} />
    </BottomSheet>
  );
}

function AppealForm({ onClose, courseId, sessions }: { onClose: () => void; courseId: CourseId; sessions: Session[] }) {
  const appeals = useAttendanceLocal((st) => st.appeals);
  const addAppeal = useAttendanceLocal((st) => st.addAppeal);
  const available = sessions.filter((r) => !appeals[appealKey(courseId, r.date)]);
  const [target, setTarget] = useState<string | null>(() => available[0]?.date ?? null);
  const [reason, setReason] = useState<(typeof REASONS)[number] | null>(null);
  const [memo, setMemo] = useState('');
  const [sending, setSending] = useState(false);

  const submit = () => {
    if (!target || !reason) return;
    setSending(true);
    window.setTimeout(() => {
      addAppeal(appealKey(courseId, target), reason);
      onClose();
      toast('이의 신청을 보냈어요 · 교수님 확인 후 알려드려요', 'check');
    }, 900);
  };

  return (
    <>
      <div className={s.sheetHead}>
        <Text variant="title-2" as="h2">
          출석 이의 신청
        </Text>
        <IconButton icon="close" label="닫기" onPress={onClose} />
      </div>
      <Text variant="caption-1" color="secondary" as="p">
        {courseById(courseId).name} · 담당 교수님께 전달돼요
      </Text>

      <div className={s.sheetBlock}>
        <Text variant="label" color="secondary">
          신청할 회차
        </Text>
        {available.map((r) => (
          <OptionRow
            key={r.date}
            title={`${r.week}주차 · ${r.date} (${r.dow})`}
            meta={`${r.status} · ${r.status === '결석' ? '인증 기록 없음' : `${r.time} 인증 · ${r.method}`}`}
            selected={target === r.date}
            onPress={() => setTarget(r.date)}
          />
        ))}
      </div>

      <div className={s.sheetBlock}>
        <Text variant="label" color="secondary">
          사유
        </Text>
        <div className={s.reasons} role="group" aria-label="사유">
          {REASONS.map((r) => (
            <Chip key={r} tone="outline" pill size="m" selected={reason === r} onSelect={() => setReason(r)} className={s.reasonChip}>
              {r}
            </Chip>
          ))}
        </div>
        <TextArea rows={3} placeholder="상황을 간단히 적어주세요 (선택)" value={memo} onChange={(e) => setMemo(e.target.value)} aria-label="상세 내용" />
      </div>

      <div className={s.sheetCta}>
        <Button block disabled={!target || !reason} loading={sending} onClick={submit}>
          신청하기
        </Button>
      </div>
    </>
  );
}
