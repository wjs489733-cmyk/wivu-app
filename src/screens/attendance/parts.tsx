import { Chip, Icon, Text, type ChipTone } from '@/ui';
import { courseName, recordMeta, type Session, type SessionStatus } from './data';
import s from './Attendance.module.css';

/* 출석 섹션 전용 부품 — 기록 상태 칩 · 기록 행(날짜 칼럼형 / 주차 칼럼형) */

const TONE: Record<SessionStatus, ChipTone> = {
  출석: 'brand',
  지각: 'warningSoft',
  결석: 'dangerSoft',
  예정: 'neutral',
  오늘: 'outline',
  '인증 가능': 'brand',
};

export function StatusChip({ status }: { status: SessionStatus }) {
  return (
    <Chip tone={TONE[status]} pill dot={status === '인증 가능'} className={s.statusChip}>
      {status}
    </Chip>
  );
}

/** 최근 출석 기록 행 — 날짜(MM.DD/요일) · 과목 · 인증 정보 · 상태 칩 (Figma 392:7302 record row) */
export function RecordRow({ r, onPress, highlight }: { r: Session; onPress?: () => void; highlight?: boolean }) {
  return (
    <button type="button" className={s.recordRow} onClick={onPress} data-highlight={highlight}>
      <span className={s.recordDate}>
        <Text variant="caption-1-strong" color={highlight ? 'brand' : 'primary'} tnum>
          {r.date}
        </Text>
        <Text variant="caption-2" color="tertiary">
          {r.dow}
        </Text>
      </span>
      <span className={s.recordMain}>
        <Text variant="subhead" as="span" className="truncate">
          {courseName(r.courseId)}
        </Text>
        <Text variant="caption-2" color="secondary" as="span" className="truncate" tnum>
          {recordMeta(r)}
        </Text>
      </span>
      <StatusChip status={r.status} />
    </button>
  );
}

/** 회차별 기록 행 — 주차 · 날짜(요일) · 인증 정보 · 상태 칩 (Figma 406:8047 session row) */
export function SessionRow({ r, note }: { r: Session; note?: string }) {
  return (
    <div className={s.sessionRow} data-today={r.date === '09.11'}>
      <Text variant="caption-1-strong" color="secondary" className={s.sessionWeek}>
        {r.week}주차
      </Text>
      <span className={s.recordMain}>
        <Text variant="subhead" as="span" tnum>
          {/* 사이버 강의는 주차별 수강 기간 (오픈일 – 마감일) */}
          {r.opens ? `${r.opens} – ${r.date} (${r.dow})` : `${r.date} (${r.dow})`}
        </Text>
        <Text variant="caption-2" color="secondary" as="span" className="truncate" tnum>
          {recordMeta(r, true)}
        </Text>
        {note && (
          <Text variant="caption-2" color="brand" as="span" className={s.appealNote}>
            <Icon name="clock" size={16} /> {note}
          </Text>
        )}
      </span>
      <StatusChip status={r.status} />
    </div>
  );
}
