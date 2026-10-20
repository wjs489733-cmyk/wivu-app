import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { BottomSheet, Button, Icon, OptionRow, Screen, SheetHead, Text, TopNav, toast } from '@/ui';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { courseById, type Course, type CourseId } from '@/data/core';
import { AttendanceSheetHost } from './AttendanceSheetHost';
import { appealMeta, courseSessions, courseStats, isAttendanceCourse, type Session, type TodayState } from './data';
import { ChoiceChip, SessionRow } from './parts';
import { appealKey, useAttendanceLocal } from './store';
import s from './Attendance.module.css';

/**
 * 과목 출석 상세 — Figma v5 683:5994 (모션그래픽스). 다른 과목은 같은 틀에 data.ts 기록으로 채움.
 * 머리(과목·교수·시간·강의실 + 출석률) → 안내(결석 있으면 오류 톤 · 지각만 있으면 주의 톤) → 4칸 요약 → 회차별 기록 → 하단 버튼.
 * 하단 버튼: 오늘 인증 가능한 수업이면 [출석 인증하기](출석 인증 시트), 결석·지각이 있으면 [출석 이의 신청](v5 692:7904 시트).
 * 이의 신청 시트 바로 열기: ?sheet=appeal
 */
export function CourseAttendance() {
  const { id = 'service-design' } = useParams();
  const [q] = useSearchParams();
  const courseId: CourseId = isAttendanceCourse(id) ? id : 'service-design';
  const c = courseById(courseId);
  const complete = useApp((st) => st.attendanceComplete);
  const method = useApp((st) => st.attendanceMethod);
  const time = useApp((st) => st.attendanceTime);
  const today: TodayState = { complete, method, time };
  const appeals = useAttendanceLocal((st) => st.appeals);
  const [pin, setPin] = useState(false);

  const st = courseStats(courseId, today);
  const sessions = courseSessions(courseId, today);
  const contestable = sessions.filter((r) => r.status === '결석' || r.status === '지각');
  const pending = contestable.filter((r) => appeals[appealKey(courseId, r.date)]);
  const allPending = contestable.length > 0 && pending.length === contestable.length;
  const canAttend = sessions.some((r) => r.status === '인증 가능');
  const [appealOpen, setAppealOpen] = useState(() => q.get('sheet') === 'appeal' && contestable.length > 0);

  const meta = c.online ? ['사이버 강의', `${c.credits}학점`, c.kind] : [`${c.professor} 교수`, compactSlots(c), c.room];
  const notice = st.absent > 0 ? { tone: 'error', text: '결석이 3번 더 쌓이면 학점을 받기 어려워요. 지각 3번은 결석 1번으로 처리돼요.' } : st.late > 0 ? { tone: 'warning', text: `지각이 ${st.late}번 있어요. 지각 3번은 결석 1번으로 처리돼요.` } : null;

  return (
    <Screen
      figma="683:5994"
      header={<TopNav title="출석 상세" fallback={P.attendance} />}
      overlay={
        <>
          {canAttend && <AttendanceSheetHost open={pin} onClose={() => setPin(false)} />}
          {contestable.length > 0 && <AppealSheet open={appealOpen} onClose={() => setAppealOpen(false)} courseId={courseId} sessions={contestable} />}
        </>
      }
    >
      <div className={s.detail}>
        <div className={s.detailHead}>
          <div className={s.rowText}>
            <Text variant="title-2" as="h2" className="truncate">
              {c.name}
            </Text>
            <Text variant="caption-1" color="tertiary" as="p" lines={2} tnum>
              {meta.join(' · ')}
            </Text>
          </div>
          <div className={s.rate}>
            <Text variant="title-2" color={st.absent > 0 ? 'error' : 'primary'} tnum>
              {st.rate}%
            </Text>
            <Text variant="caption-2" color="tertiary">
              출석률
            </Text>
          </div>
        </div>

        {notice && (
          <div className={s.notice} data-tone={notice.tone} role="note">
            <Icon name="warning" size={20} color={notice.tone === 'error' ? 'error' : 'warning'} />
            <Text variant="caption-1" color={notice.tone === 'error' ? 'error' : 'warning'} as="p">
              {notice.text}
            </Text>
          </div>
        )}

        <div className={s.detailStats} role="group" aria-label="출석 요약">
          <DetailStat label="출석" value={st.present} />
          <DetailStat label="지각" value={st.late} />
          <DetailStat label="결석" value={st.absent} error={st.absent > 0} />
          <DetailStat label={c.online ? '남은 강의' : '남은 수업'} value={st.remaining} />
        </div>

        <section className={s.sessions}>
          <Text variant="title-3" as="h2">
            회차별 기록
          </Text>
          <div className={s.rows}>
            {sessions.map((r) => {
              const reason = appeals[appealKey(courseId, r.date)];
              return <SessionRow key={r.key} r={r} note={reason ? `이의 신청 검토 중 (${reason})` : undefined} />;
            })}
          </div>
        </section>

        {canAttend ? (
          <Button block onClick={() => setPin(true)} className={s.detailCta}>
            출석 인증하기
          </Button>
        ) : contestable.length > 0 ? (
          <Button variant="secondary" block disabled={allPending} onClick={() => setAppealOpen(true)} className={s.detailCta}>
            {allPending ? '이의 신청 검토 중' : '출석 이의 신청'}
          </Button>
        ) : null}
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

function DetailStat({ label, value, error }: { label: string; value: number; error?: boolean }) {
  return (
    <div className={s.detailStat}>
      <Text variant="title-3" color={error ? 'error' : 'primary'} tnum>
        {value}
      </Text>
      <Text variant="caption-2" color="secondary">
        {label}
      </Text>
    </div>
  );
}

/* ── 출석 이의 신청 시트 (v5 692:7904) ─────────────────────────── */
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
      <SheetHead title="출석 이의 신청" subtitle={`${courseById(courseId).name} · 담당 교수님께 전달돼요`} onClose={onClose} />

      <div className={s.sheetBlock}>
        <Text variant="body-3-strong" color="secondary" as="h3">
          신청할 회차
        </Text>
        <div className={s.options}>
          {available.map((r) => (
            <OptionRow key={r.date} title={`${r.week}주차 · ${r.date} (${r.dow})`} meta={appealMeta(r)} selected={target === r.date} onPress={() => setTarget(r.date)} />
          ))}
        </div>
      </div>

      <div className={s.sheetBlock}>
        <Text variant="body-3-strong" color="secondary" as="h3">
          사유
        </Text>
        <div className={s.reasons} role="group" aria-label="사유">
          {REASONS.map((r) => (
            <ChoiceChip key={r} label={r} selected={reason === r} onSelect={() => setReason(r)} />
          ))}
        </div>
        <div className={s.memoField}>
          <textarea className={`${s.memoArea} t-body-1`} rows={2} placeholder="상황을 간단히 적어 주세요 (선택)" value={memo} maxLength={200} onChange={(e) => setMemo(e.target.value)} aria-label="상세 내용" />
        </div>
      </div>

      <Button block disabled={!target || !reason} loading={sending} onClick={submit} className={s.sheetCta}>
        신청하기
      </Button>
    </>
  );
}
