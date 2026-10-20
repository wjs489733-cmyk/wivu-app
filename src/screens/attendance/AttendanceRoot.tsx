import { useState } from 'react';
import { Button, Chip, Icon, IconButton, LargeHeader, Screen, TabBar, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useHasUnread } from '@/app/useUnread';
import { useApp } from '@/store/app';
import { courseById, SEMESTER, SEMESTER_WEEK } from '@/data/core';
import { AttendanceSheetHost } from './AttendanceSheetHost';
import { ATTENDANCE_COURSES, courseStats, todaySessions, totals, type CourseStats, type TodayState } from './data';
import s from './Attendance.module.css';

/**
 * 출석 탭 루트 — Figma v5 683:5844
 * 이번 학기 요약(출석·지각·결석) → 오늘 수업(인증 가능 수업만 [출석 인증]) → 과목별 출석(출석률 · 결석 주의).
 * [출석 인증] → 이 화면 위에 출석 인증 시트(v5 679:5188). 과목 행 → 과목 출석 상세(push).
 */
export function AttendanceRoot() {
  const nav = useNav();
  const unread = useHasUnread();
  const complete = useApp((st) => st.attendanceComplete);
  const method = useApp((st) => st.attendanceMethod);
  const time = useApp((st) => st.attendanceTime);
  const today: TodayState = { complete, method, time };
  const [pin, setPin] = useState(false);

  const sum = totals(today);

  return (
    <Screen
      figma="683:5844"
      header={<LargeHeader title="출석" actions={<IconButton icon="bell" label="알림함" dot={unread} onPress={() => nav.push(P.notifications)} />} />}
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
            {todaySessions(today).map((r) => {
              const c = courseById(r.courseId);
              return (
                <div key={r.courseId} className={s.row}>
                  <span className={s.rowText}>
                    <Text variant="body-1-strong" className="truncate">
                      {c.name}
                    </Text>
                    <Text variant="caption-1" color="tertiary" className="truncate" tnum>
                      {r.start}–{r.end} · {c.room}
                    </Text>
                  </span>
                  {r.status === '인증 가능' ? (
                    <Button size="s" onClick={() => setPin(true)}>
                      출석 인증
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
        </section>

        <section className={s.block}>
          <Text variant="title-3" as="h2">
            과목별 출석
          </Text>
          <div className={s.rows}>
            {ATTENDANCE_COURSES.map((id) => {
              const st = courseStats(id, today);
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
                  <Icon name="chevron-right" size={20} color="tertiary" />
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
