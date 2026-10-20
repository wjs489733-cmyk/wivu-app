import { motion } from 'motion/react';
import { Button, Chip, Text, type ChipTone } from '@/ui';
import { useApp } from '@/store/app';
import { recordMeta, type Session, type SessionStatus } from './data';
import s from './Attendance.module.css';

/* 출석 섹션 전용 부품 — v5 상태 배지 · 회차 행 · 선택 칩 · 출석 완료 본문 */

const TONE: Record<SessionStatus, ChipTone> = {
  출석: 'brand',
  지각: 'warningSoft',
  결석: 'dangerSoft',
  예정: 'neutral',
  오늘: 'neutral',
  '인증 가능': 'brand',
};
/** '오늘'(아직 시작 전인 오늘 수업)은 v5 문구대로 '예정'으로 보인다 */
const LABEL: Partial<Record<SessionStatus, string>> = { 오늘: '예정' };

/** v5 Badge (Brand · Warning · Error · Neutral) */
export function StatusChip({ status }: { status: SessionStatus }) {
  return <Chip tone={TONE[status]}>{LABEL[status] ?? status}</Chip>;
}

/** 회차별 기록 행 — '1주차 · 09.01 (화)' + 인증 정보 + 상태 배지 (v5 683:5994 회차 행) */
export function SessionRow({ r, note }: { r: Session; note?: string }) {
  // 사이버 강의는 주차별 수강 기간 (오픈일 – 마감일)
  const when = r.opens ? `${r.opens} – ${r.date} (${r.dow})` : `${r.date} (${r.dow})`;
  return (
    <div className={s.sessionRow}>
      <span className={s.rowText}>
        <Text variant="body-2" as="span" className="truncate" tnum>
          {r.week}주차 · {when}
        </Text>
        <Text variant="caption-1" color="tertiary" as="span" className="truncate" tnum>
          {note ? `${recordMeta(r, true)} · ${note}` : recordMeta(r, true)}
        </Text>
      </span>
      <StatusChip status={r.status} />
    </div>
  );
}

/** v5 Choice Chip (h38 · pill · Body 3 Strong) — 공통 Chip(m)은 28 높이라 로컬로 둔다 (공통화 후보) */
export function ChoiceChip({ label, selected, onSelect }: { label: string; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" className={`${s.choiceChip} t-body-3-strong`} data-selected={selected} aria-pressed={selected} onClick={onSelect}>
      {label}
    </button>
  );
}

/** 출석 완료 본문 — v5 679:5848 (시트 안: 체크 원 · '출석 완료' · 과목·시각·방법 · [확인]) */
export function AttendDoneBody({ onConfirm }: { onConfirm: () => void }) {
  const time = useApp((st) => st.attendanceTime) ?? '10:01';
  const method = useApp((st) => st.attendanceMethod) ?? 'PIN';
  return (
    <div className={s.done} role="status">
      <motion.span className={s.doneCheck} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 20 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.15 }} />
        </svg>
      </motion.span>
      <Text variant="title-2" as="h2" align="center" className={s.doneTitle}>
        출석 완료
      </Text>
      <Text variant="body-3" color="secondary" as="p" align="center" tnum>
        서비스디자인 · {time} {method} 인증
      </Text>
      <Button block onClick={onConfirm} className={s.doneCta}>
        확인
      </Button>
    </div>
  );
}
