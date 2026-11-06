import { motion } from 'motion/react';
import { Button, Chip, Text, type ChipTone } from '@/ui';
import { useNow } from '@/data/clock';
import { useApp } from '@/store/app';
import { courseName, doneRecord, MISSED_BADGE, NO_OPEN_TEXT, nextClassLine, recordMeta, type Session, type SessionStatus } from './data';
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

/** v5 Badge (Brand · Warning · Error · Neutral) — 오늘 인증 창이 닫힌 결석은 '인증 마감'(빨강 soft) */
export function StatusChip({ status, missed }: { status: SessionStatus; missed?: boolean }) {
  if (missed) return <Chip tone="dangerSoft">{MISSED_BADGE}</Chip>;
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
          {r.makeup ? '보강' : `${r.week}주차`} · {when}
        </Text>
        <Text variant="caption-1" color="tertiary" as="span" className="truncate" tnum>
          {note ? `${recordMeta(r, true)} · ${note}` : recordMeta(r, true)}
        </Text>
      </span>
      <StatusChip status={r.status} missed={r.missed} />
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

/**
 * 출석 완료 본문 — v5 679:5848 (시트 안: 체크 원 · '출석 완료' · 과목·시각·방법 · [확인])
 * recordKey = 방금 완료한 수업 (store attended key). 없으면 마지막 완료 기록 → 지금 열린 수업 미리보기.
 * 그것도 없으면(인증할 수업도 기록도 없음) 같은 자리에 '지금 인증할 수 있는 수업이 없어요' + 다음 수업.
 */
export function AttendDoneBody({ onConfirm, recordKey }: { onConfirm: () => void; recordKey?: string }) {
  const attended = useApp((st) => st.attended);
  const now = useNow();
  const r = doneRecord(attended, recordKey, now);
  if (!r) {
    const next = nextClassLine(now);
    return (
      <div className={s.done} role="status">
        <Text variant="title-3" as="h2" align="center">
          {NO_OPEN_TEXT}
        </Text>
        {next && (
          <Text variant="body-3" color="secondary" as="p" align="center" tnum className={s.doneNext}>
            {next}
          </Text>
        )}
        <Button block onClick={onConfirm} className={s.doneCta}>
          확인
        </Button>
      </div>
    );
  }
  return (
    <div className={s.done} role="status">
      <motion.span className={s.doneCheck} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 20 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <motion.path vectorEffect="non-scaling-stroke" d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.15 }} />
        </svg>
      </motion.span>
      <Text variant="title-2" as="h2" align="center" className={s.doneTitle}>
        출석 완료
      </Text>
      <Text variant="body-3" color="secondary" as="p" align="center" tnum>
        {courseName(r.courseId)} · {r.time} {r.method} 인증
      </Text>
      <Button block onClick={onConfirm} className={s.doneCta}>
        확인
      </Button>
    </div>
  );
}
