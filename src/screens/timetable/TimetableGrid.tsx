import type { CSSProperties } from 'react';
import { Icon, Text } from '@/ui';
import { NOW, WEEK_LABEL } from '@/data/core';
import { DAYS, NOW_MIN, toMin, type TTCourse } from './data';
import s from './Timetable.module.css';

/* 이번 주 월~금 날짜 (core NOW 기준: 10월 2주차 10/5–10/9, 오늘 금 9) */
const WEEK_DATES = Array.from({ length: 5 }, (_, i) => new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - NOW.getDay() + 1 + i).getDate());
const TODAY_COL = NOW.getDay() - 1;
const HOUR_H = 52;
const HEAD_H = 32;

type Props = {
  courses: TTCourse[];
  /** 브랜드 채움으로 강조할 과목 (오늘 다음 수업) */
  focusId?: string;
  /** 편집 모드: 직접 추가한 과목만 강조 + 빼기 배지 */
  editing?: boolean;
  /** 방금 추가한 과목 (테두리 펄스) */
  newId?: string | null;
  onBlock: (c: TTCourse) => void;
};

/**
 * 주간 시간표 그리드 — core COURSES slots(+직접 추가)에서 블록 생성
 * 기본 9~18시, 범위 밖 수업이 있으면 자동으로 늘어남.
 */
export function TimetableGrid({ courses, focusId, editing, newId, onBlock }: Props) {
  const slots = courses.flatMap((c) => c.slots);
  const startH = Math.min(9, ...slots.map((sl) => Math.floor(toMin(sl.start) / 60)));
  const endH = Math.max(18, ...slots.map((sl) => Math.ceil(toMin(sl.end) / 60)));
  const hours = Array.from({ length: endH - startH }, (_, i) => startH + i);
  const y = (min: number) => HEAD_H + ((min - startH * 60) / 60) * HOUR_H;
  const colLeft = (i: number) => `calc(var(--time-col) + var(--col) * ${i})`;

  return (
    <div className={s.grid} style={{ height: HEAD_H + hours.length * HOUR_H }} aria-label={`${WEEK_LABEL} 시간표`}>
      <div className={s.todayCol} />
      {/* 가로 줄: 헤더 아래 + 매 시 */}
      {[...hours, endH].map((h) => (
        <span key={`h${h}`} className={s.hline} style={{ top: y(h * 60) }} />
      ))}
      {/* 세로 줄 */}
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={`v${i}`} className={s.vline} style={{ left: colLeft(i) }} />
      ))}
      {DAYS.map((d, i) => (
        <span key={d} className={s.dayHead} style={{ left: colLeft(i) }}>
          <Text variant="caption-2-strong" color={i === TODAY_COL ? 'brand' : 'secondary'}>
            {d} {WEEK_DATES[i]}
          </Text>
        </span>
      ))}
      {hours.map((h) => (
        <Text key={h} variant="caption-2" color="tertiary" tnum className={s.hourLabel} style={{ top: y(h * 60) + 4 }}>
          {h}
        </Text>
      ))}

      {courses.flatMap((c) =>
        c.slots.map((sl) => {
          const col = DAYS.indexOf(sl.day);
          const top = y(toMin(sl.start)) + 1;
          const h = ((toMin(sl.end) - toMin(sl.start)) / 60) * HOUR_H - 2;
          const focus = c.id === focusId && !editing;
          const style: CSSProperties = { top, height: h, left: `calc(${colLeft(col)} + 2px)`, width: 'calc(var(--col) - 4px)' };
          return (
            <button
              key={`${c.id}-${sl.day}`}
              type="button"
              className={s.block}
              style={style}
              data-focus={focus}
              data-dim={editing && c.core}
              data-new={newId === c.id}
              data-extra={!c.core}
              data-course={c.id}
              aria-label={`${c.name} ${sl.day} ${sl.start}–${sl.end} ${c.room}${editing && !c.core ? ' · 눌러서 빼기' : ''}`}
              onClick={() => onBlock(c)}
            >
              <Text variant="caption-2-strong" color={focus ? 'on-brand' : 'brand'} className={s.blockText}>
                {c.blockName}
              </Text>
              {h >= 44 && (
                <Text variant="caption-2" color={focus ? 'on-brand' : 'secondary'} className={s.blockText}>
                  {c.blockRoom}
                </Text>
              )}
              {editing && !c.core && (
                <span className={s.removeBadge} aria-hidden>
                  <Icon name="close" size={16} />
                </span>
              )}
            </button>
          );
        }),
      )}

      {NOW_MIN >= startH * 60 && NOW_MIN <= endH * 60 && <span className={s.nowLine} style={{ top: y(NOW_MIN) }} aria-label="현재 시각 9:41" />}
    </div>
  );
}
