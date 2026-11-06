import { useState } from 'react';
import { Button, Chip, Icon, IconButton, LargeHeader, Screen, TabBar, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useHasUnread } from '@/app/useUnread';
import { useApp } from '@/store/app';
import { useNow } from '@/data/clock';
import { courseById, SEMESTER, SEMESTER_WEEK } from '@/data/core';
import { remainingToday } from '@/data/today';
import { AttendanceSheetHost } from './AttendanceSheetHost';
import {
  ALL_DONE_TEXT,
  ATTENDANCE_COURSES,
  attendTarget,
  courseStats,
  freeDayText,
  MISSED_BADGE,
  MISSED_TEXT,
  NO_OPEN_TEXT,
  nextClassLine,
  todaySessions,
  totals,
  type CourseStats,
  type TodayState,
} from './data';
import s from './Attendance.module.css';

/**
 * 출석 탭 루트 — Figma v5 683:5844
 * 이번 학기 요약(출석·지각·결석) → 오늘 수업(인증 가능 수업만 [출석 인증]) → 과목별 출석(출석률 · 결석 주의).
 * [출석 인증] → 이 화면 위에 출석 인증 시트(v5 679:5188). 과목 행 → 과목 출석 상세(push).
 * 실시간(11-06): 오늘 수업 = today.ts classesOn(now) · 상태는 매 분 다시 계산 (data.ts 규칙 4)
 *   인증 창이 닫혔는데 기록 없음 → '인증 마감' 배지 + [이의 신청] / 오늘 수업 없음 → 공강·휴강 행
 *   지금 인증할 수업이 없으면 오늘 수업 아래 안내('지금 인증할 수 있는 수업이 없어요' · 다음 수업)
 */
export function AttendanceRoot() {
  const nav = useNav();
  const unread = useHasUnread();
  const now = useNow();
  const complete = useApp((st) => st.attendanceComplete);
  const method = useApp((st) => st.attendanceMethod);
  const time = useApp((st) => st.attendanceTime);
  const attended = useApp((st) => st.attended);
  const today: TodayState = { complete, method, time, attended };
  const [pin, setPin] = useState(false);

  const sum = totals(today, now);
  const rows = todaySessions(today, now);
  const target = attendTarget(now, attended);
  const canAttendNow = !!target.session && !target.rec;
  const next = nextClassLine(now);
  const free = rows.length === 0 ? freeDayText(now) : null;
  const allDone = rows.length > 0 && remainingToday(now).length === 0;

  return (
    <Screen
      figma="683:5844"
      // v5 683:5844 헤더 종 아이콘엔 안 읽음 점이 없다 → 점은 aria-label로만 알림
      header={<LargeHeader title="출석" actions={<IconButton icon="bell" label={unread ? '알림함 · 새 알림 있음' : '알림함'} onPress={() => nav.push(P.notifications)} />} />}
      footer={<TabBar active="attendance" />}
      overlay={<AttendanceSheetHost open={pin} onClose={() => setPin(false)} />}
    >
      <div className={s.page}>
        <Text variant="caption-1" color="tertiary" as="p">
          {SEMESTER} · {SEMESTER_WEEK}주차 · 오프라인 {ATTENDANCE_COURSES.length}과목
        </Text>

        <div className={s.summary} role="group" aria-label="이번 학기 요약">
          <SummaryStat label="출석" value={sum.present} />
          <SummaryStat label="지각" value={sum.late} />
          <SummaryStat label="결석" value={sum.absent} error={sum.absent > 0} />
        </div>

        <section className={s.block}>
          <Text variant="title-3" as="h2">
            오늘 수업
          </Text>
          <div className={s.rows}>
            {free && (
              <div className={s.row}>
                <span className={s.rowText}>
                  <Text variant="body-1-strong" className="truncate">
                    {free.title}
                  </Text>
                  {next && (
                    <Text variant="caption-1" color="tertiary" className="truncate" tnum>
                      {next}
                    </Text>
                  )}
                </span>
                <Text variant="caption-1" color="tertiary">
                  {free.tag}
                </Text>
              </div>
            )}
            {rows.map((r) => {
              const c = courseById(r.courseId);
              return (
                <div key={r.key} className={s.row}>
                  <span className={s.rowText}>
                    {r.missed ? (
                      <span className={s.rowTitle}>
                        <Text variant="body-1-strong" className="truncate">
                          {c.name}
                        </Text>
                        <Chip tone="dangerSoft">{MISSED_BADGE}</Chip>
                      </span>
                    ) : (
                      <Text variant="body-1-strong" className="truncate">
                        {c.name}
                      </Text>
                    )}
                    <Text variant="caption-1" color="tertiary" className="truncate" tnum>
                      {r.missed ? MISSED_TEXT : `${r.start}–${r.end} · ${c.room}`}
                    </Text>
                  </span>
                  {r.status === '인증 가능' ? (
                    <Button size="s" onClick={() => setPin(true)}>
                      출석 인증
                    </Button>
                  ) : r.missed ? (
                    <Button size="s" variant="secondary" onClick={() => nav.push(`${P.attendanceCourse(r.courseId)}?sheet=appeal`)}>
                      이의 신청
                    </Button>
                  ) : r.status === '출석' ? (
                    <Text variant="caption-1" color="tertiary" tnum>
                      {r.time} 출석
                    </Text>
                  ) : (
                    <Text variant="caption-1" color="tertiary">
                      예정
                    </Text>
                  )}
                </div>
              );
            })}
          </div>
          {!free && !canAttendNow && (
            <div className={s.notice} data-tone="neutral" role="note">
              <Icon name="clock" size={18} color="tertiary" />
              <span className={s.rowText}>
                <Text variant="body-3-strong" as="p">
                  {allDone ? ALL_DONE_TEXT : NO_OPEN_TEXT}
                </Text>
                {next && (
                  <Text variant="caption-1" color="tertiary" as="p" tnum>
                    {next}
                  </Text>
                )}
              </span>
            </div>
          )}
        </section>

        <section className={s.block}>
          <Text variant="title-3" as="h2">
            과목별 출석
          </Text>
          <div className={s.rows}>
            {ATTENDANCE_COURSES.map((id) => {
              const st = courseStats(id, today, now);
              const warn = st.absent > 0;
              return (
                <button key={id} type="button" className={`${s.row} ${s.rowPress}`} onClick={() => nav.push(P.attendanceCourse(id))}>
                  <span className={s.rowText}>
                    <span className={s.rowTitle}>
                      <Text variant="body-1" className="truncate">
                        {courseById(id).name}
                      </Text>
                      {warn && <Chip tone="dangerSoft">결석 주의</Chip>}
                    </span>
                    <Text variant="caption-1" color="tertiary" className="truncate" tnum>
                      {countLine(st)}
                    </Text>
                  </span>
                  <Text variant="body-2-strong" color={warn ? 'error' : 'primary'} tnum>
                    {st.rate}%
                  </Text>
                  <Icon name="chevron-right" size={18} color="tertiary" />
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </Screen>
  );
}

/** '출석 6 · 결석 0' / '출석 5 · 지각 1' / '출석 4 · 지각 1 · 결석 1' (v5 과목 행 문구 규칙) */
function countLine(st: CourseStats) {
  const parts = [`출석 ${st.present}`];
  if (st.late) parts.push(`지각 ${st.late}`);
  if (st.absent || !st.late) parts.push(`결석 ${st.absent}`);
  return parts.join(' · ');
}

function SummaryStat({ label, value, error }: { label: string; value: number; error?: boolean }) {
  return (
    <div className={s.summaryStat}>
      <Text variant="title-2" color={error ? 'error' : 'primary'} tnum>
        {value}
      </Text>
      <Text variant="caption-1" color="secondary">
        {label}
      </Text>
    </div>
  );
}
