import type { CSSProperties } from 'react';
import { Text } from '@/ui';
import { NOW, WEEK_LABEL } from '@/data/core';
import { DAYS, NOW_MIN, toMin, type TTCourse } from './data';
import { RemoveBadge } from './parts';
import s from './Timetable.module.css';

/* 이번 주 월~금 날짜 (core NOW 기준: 10월 2주차 10/5–10/9, 오늘 금 9) */
const WEEK_DATES = Array.from({ length: 5 }, (_, i) => new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - NOW.getDay() + 1 + i).getDate());
const TODAY_COL = NOW.getDay() - 1;
/* Figma 685:6192 timetable grid: 352×442 · 시간 열 28 · 요일 머리 28 · 1시간 46 */
const HOUR_H = 46;
const HEAD_H = 28;

type Props = {
  courses: TTCourse[];
  /** 편집 모드: 모든 블록에 빨간 '−' 배지 (Figma 697:7142) */
  editing?: boolean;
  onBlock: (c: TTCourse) => void;
  /** 편집 모드에서 '−'를 눌렀을 때 */
  onRemove?: (c: TTCourse) => void;
};

/**
 * 주간 시간표 그리드 v5 — core COURSES slots(+직접 추가)에서 블록 생성
 * 오늘(금) 수업 = 연파랑 면 + 파란 이름, 다른 요일 = 회색 면, 직접 추가 = 연파랑 면 + 파란 점선.
 * 기본 9~18시, 범위 밖 수업이 있으면 자동으로 늘어남.
 */
export function TimetableGrid({ courses, editing, onBlock, onRemove }: Props) {
  const slots = courses.flatMap((c) => c.slots);
  const startH = Math.min(9, ...slots.map((sl) => Math.floor(toMin(sl.start) / 60)));
  const endH = Math.max(18, ...slots.map((sl) => Math.ceil(toMin(sl.end) / 60)));
  const hours = Array.from({ length: endH - startH }, (_, i) => startH + i);
  const y = (min: number) => HEAD_H + ((min - startH * 60) / 60) * HOUR_H;
  const colLeft = (i: number) => `calc(var(--time-col) + var(--col) * ${i})`;

  return (
    <div className={s.grid} style={{ height: HEAD_H + hours.length * HOUR_H }} aria-label={`${WEEK_LABEL} 시간표`}>
      {hours.map((h) => (
        <span key={`h${h}`} className={s.hline} style={{ top: y(h * 60) }} />
      ))}
      {DAYS.map((d, i) => (
        <span key={d} className={s.dayHead} style={{ left: colLeft(i) }}>
          <Text variant={i === TODAY_COL ? 'caption-2-strong' : 'caption-2'} color={i === TODAY_COL ? 'brand' : 'tertiary'}>
            {d} {WEEK_DATES[i]}
          </Text>
        </span>
      ))}
      {hours.map((h) => (
        <Text key={h} variant="caption-2" color="tertiary" tnum className={s.hourLabel} style={{ top: y(h * 60) - 6 }}>
          {h}
        </Text>
      ))}

      {NOW_MIN >= startH * 60 && NOW_MIN <= endH * 60 && <span className={s.nowLine} style={{ top: y(NOW_MIN) - 1 }} aria-label="현재 시각 9:41" />}

      {courses.flatMap((c) =>
        c.slots.map((sl) => {
          const col = DAYS.indexOf(sl.day);
          const top = y(toMin(sl.start)) + 1;
          const h = ((toMin(sl.end) - toMin(sl.start)) / 60) * HOUR_H - 2;
          const tone = !c.core ? 'extra' : col === TODAY_COL ? 'today' : 'plain';
          const style: CSSProperties = { top, height: h, left: `calc(${colLeft(col)} + 1px)`, width: 'calc(var(--col) - 3px)' };
          const label = `${c.name} ${sl.day} ${sl.start}–${sl.end} ${c.room}${c.core ? '' : ' · 직접 추가'}`;
          return (
            <div key={`${c.id}-${sl.day}`} className={s.blockWrap} style={style}>
              <button type="button" className={s.block} data-tone={tone} data-course={c.id} aria-label={label} onClick={() => (editing ? onRemove?.(c) : onBlock(c))}>
                <Text variant="caption-2-strong" color={tone === 'plain' ? 'primary' : 'brand'} className={s.blockText}>
                  {c.blockName}
                </Text>
                <Text variant="caption-2" color={tone === 'extra' ? 'brand' : 'tertiary'} className={s.blockText}>
                  {c.blockRoom}
                </Text>
              </button>
              {editing && onRemove && <RemoveBadge label={`${c.name} 빼기`} className={s.blockBadge} onPress={() => onRemove(c)} />}
            </div>
          );
        }),
      )}
    </div>
  );
}
