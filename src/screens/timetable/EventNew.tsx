import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { BottomSheet, Button, CtaBar, Icon, OptionRow, Screen, SheetHead, Switch, Text, TextField, TopNav, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { ALARM_OPTIONS, CAT, CATEGORIES, MONTHS, TIME_OPTIONS, longDate, toMin, type CalEvent, type Category } from './data';
import { useSchedule } from './store';
import { holidayOn } from './agenda';
import { MonthGrid, SmallIconButton } from './parts';
import s from './Calendar.module.css';

type Picker = 'startDate' | 'endDate' | 'startTime' | 'endTime' | 'alarm';
const PICKER_TITLE: Record<Picker, string> = {
  startDate: '시작 날짜',
  endDate: '종료 날짜',
  startTime: '시작 시간',
  endTime: '종료 시간',
  alarm: '알림',
};
const plusHour = (t: string) => TIME_OPTIONS.find((x) => toMin(x) >= toMin(t) + 60) ?? TIME_OPTIONS[TIME_OPTIONS.length - 1];
/** Figma 686:6717 기본 날짜 (캘린더에서 오늘을 보고 있을 때) */
const DEFAULT_DATE = '2026-10-14';

/**
 * 일정 추가 — Figma v5 686:6717 · 모달 (+ 날짜 선택 시트 697:7703: 같은 라우트의 상태)
 * 제목 · 분류(개인/수업/과제/학사) · 시작/종료(날짜·시간 알약 → 시트) · 하루 종일 · 알림 · 장소나 메모
 * [저장] → 로컬 스토어에 개인 일정 추가 → 그 일정 상세(697:7572)로. ?date=YYYY-MM-DD 기본 날짜 · ?edit=<id> 내 일정 수정
 * '장소나 메모' 한 칸(Figma): 첫 줄 = 장소, 둘째 줄부터 = 메모로 나눠 저장한다.
 */
export function EventNew() {
  const nav = useNav();
  const [params] = useSearchParams();
  const editing = useSchedule((st) => st.events.find((e) => e.id === params.get('edit') && e.user));
  const saveEvent = useSchedule((st) => st.saveEvent);
  const initDate = editing?.span?.[0] ?? editing?.date ?? params.get('date') ?? DEFAULT_DATE;

  const [title, setTitle] = useState(editing?.title ?? '');
  const [category, setCategory] = useState<Category>(editing?.category ?? 'personal');
  const [startDate, setStartDate] = useState(initDate);
  const [endDate, setEndDate] = useState(editing?.span?.[1] ?? initDate);
  const [start, setStart] = useState(editing?.start ?? '18:00');
  const [end, setEnd] = useState(editing?.end ?? '19:30');
  const [allDay, setAllDay] = useState(!!editing?.allDay);
  const [alarm, setAlarm] = useState(editing?.alarm ?? '30분 전');
  const [memo, setMemo] = useState(editing ? [editing.place, editing.description].filter(Boolean).join('\n') : '');
  const [picker, setPicker] = useState<Picker>('startDate');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(initDate);
  const [saving, setSaving] = useState(false);

  const sameDay = startDate === endDate;
  const open = (p: Picker) => {
    setPicker(p);
    if (p === 'startDate') setDraftDate(startDate);
    if (p === 'endDate') setDraftDate(endDate);
    setPickerOpen(true);
  };
  const close = () => setPickerOpen(false);
  const isDate = picker === 'startDate' || picker === 'endDate';

  const confirmDate = () => {
    const d = draftDate;
    if (picker === 'startDate') {
      setStartDate(d);
      if (endDate <= d) {
        setEndDate(d);
        if (toMin(end) <= toMin(start)) setEnd(plusHour(start));
      }
    } else {
      if (d < startDate) {
        toast('종료일은 시작일보다 빠를 수 없어요');
        return;
      }
      setEndDate(d);
      if (d === startDate && toMin(end) <= toMin(start)) setEnd(plusHour(start));
    }
    close();
  };
  const pickTime = (t: string) => {
    if (picker === 'startTime') {
      setStart(t);
      if (sameDay && toMin(end) <= toMin(t)) setEnd(plusHour(t));
    } else setEnd(t);
    close();
  };

  const save = () => {
    const name = title.trim();
    if (!name) return;
    setSaving(true);
    const [first = '', ...rest] = memo.trim().split('\n');
    const place = first.trim();
    const description = rest.join('\n').trim();
    const span = endDate > startDate ? ([startDate, endDate] as [string, string]) : undefined;
    const e: CalEvent = {
      id: editing?.id ?? `u${Date.now().toString(36)}`,
      title: name,
      category,
      date: startDate,
      span,
      start: allDay ? undefined : start,
      end: allDay ? undefined : end,
      allDay,
      place: place || undefined,
      onCampus: !!place,
      description: description || undefined,
      alarm: alarm === '없음' ? undefined : alarm,
      repeat: editing?.repeat,
      user: true,
    };
    window.setTimeout(() => {
      saveEvent(e);
      if (editing) {
        toast('일정을 수정했어요', 'check');
        nav.back(P.calendarEvent(e.id));
      } else {
        // Figma 686:6717 [저장] → 697:7572 일정 상세 (토스트 없이 상세가 곧 확인 · 모달을 상세로 바꿔 뒤로 = 캘린더)
        nav.fade(P.calendarEvent(e.id));
      }
    }, 350);
  };

  return (
    <Screen
      figma="686:6717"
      header={<TopNav title={editing ? '일정 수정' : '일정 추가'} leading="close" fallback={P.calendar} />}
      footer={
        <CtaBar>
          <Button block disabled={!title.trim()} loading={saving} onClick={save}>
            저장
          </Button>
        </CtaBar>
      }
      overlay={
        <BottomSheet open={pickerOpen} onClose={close} label={PICKER_TITLE[picker]}>
          <SheetHead title={PICKER_TITLE[picker]} onClose={close} />
          {isDate && (
            <>
              <DatePicker value={draftDate} onPick={setDraftDate} />
              <div className={s.sheetCta}>
                <Button block onClick={confirmDate}>
                  {longDate(draftDate)} 선택
                </Button>
              </div>
            </>
          )}
          {(picker === 'startTime' || picker === 'endTime') && (
            <div className={s.times}>
              {TIME_OPTIONS.map((t) => {
                const disabled = picker === 'endTime' && sameDay && toMin(t) <= toMin(start);
                const on = (picker === 'startTime' ? start : end) === t;
                return (
                  <button key={t} type="button" className={`${s.timeBtn} t-body-3-strong tnum`} aria-pressed={on} disabled={disabled} onClick={() => pickTime(t)}>
                    {t}
                  </button>
                );
              })}
            </div>
          )}
          {picker === 'alarm' && (
            <div className={s.options}>
              {ALARM_OPTIONS.map((o) => (
                <OptionRow
                  key={o}
                  title={o}
                  selected={alarm === o}
                  onPress={() => {
                    setAlarm(o);
                    close();
                  }}
                />
              ))}
            </div>
          )}
        </BottomSheet>
      }
    >
      <div className={s.form}>
        <TextField value={title} onChange={(ev) => setTitle(ev.target.value)} onClear={() => setTitle('')} placeholder="일정 제목" aria-label="일정 제목" maxLength={40} enterKeyHint="done" autoFocus={!editing} />

        <Text variant="body-3-strong" color="secondary" as="p" className={s.label}>
          분류
        </Text>
        <div className={s.cats} role="radiogroup" aria-label="분류">
          {CATEGORIES.map((c) => (
            <Button key={c} size="s" variant={category === c ? 'primary' : 'secondary'} role="radio" aria-checked={category === c} onClick={() => setCategory(c)}>
              {CAT[c].label}
            </Button>
          ))}
        </div>

        <Text variant="body-3-strong" color="secondary" as="p" className={s.label} data-tight="true">
          날짜와 시간
        </Text>
        <div className={s.row} data-pick="true">
          <Text variant="body-1" className={s.rowLabel} onClick={() => open('startDate')}>
            시작
          </Text>
          <button type="button" className={`${s.pick} t-body-3-strong tnum`} aria-expanded={pickerOpen && picker === 'startDate'} onClick={() => open('startDate')}>
            {longDate(startDate)}
          </button>
          {!allDay && (
            <button type="button" className={`${s.pick} t-body-3-strong tnum`} aria-expanded={pickerOpen && picker === 'startTime'} onClick={() => open('startTime')}>
              {start}
            </button>
          )}
        </div>
        <div className={s.row} data-pick="true">
          <Text variant="body-1" className={s.rowLabel} onClick={() => open('endDate')}>
            종료
          </Text>
          <button type="button" className={`${s.pick} t-body-3-strong tnum`} aria-expanded={pickerOpen && picker === 'endDate'} onClick={() => open('endDate')}>
            {longDate(endDate)}
          </button>
          {!allDay && (
            <button type="button" className={`${s.pick} t-body-3-strong tnum`} aria-expanded={pickerOpen && picker === 'endTime'} onClick={() => open('endTime')}>
              {end}
            </button>
          )}
        </div>
        <div className={s.row}>
          <Text variant="body-1" className={s.rowLabel}>
            하루 종일
          </Text>
          <Switch checked={allDay} onChange={setAllDay} label="하루 종일" />
        </div>
        <button type="button" className={s.row} onClick={() => open('alarm')} aria-label={`알림 ${alarm}`}>
          <Text variant="body-1" className={s.rowLabel}>
            알림
          </Text>
          <Text variant="body-3" color="tertiary">
            {alarm}
          </Text>
          <Icon name="chevron-right" size={20} />
        </button>

        <textarea className={`${s.memo} t-body-1`} value={memo} onChange={(ev) => setMemo(ev.target.value)} placeholder="장소나 메모 (선택)" aria-label="장소나 메모 (첫 줄은 장소)" maxLength={200} />
      </div>
    </Screen>
  );
}

/** 날짜 선택 시트 본문 (Figma 697:7703) — 고른 날은 아래 [○월 ○일 (요일) 선택]으로 확정 */
function DatePicker({ value, onPick }: { value: string; onPick: (d: string) => void }) {
  const [month, setMonth] = useState(value.slice(0, 7));
  const events = useSchedule((st) => st.events);
  const mi = MONTHS.indexOf(month);
  const [y, m] = month.split('-').map(Number);
  return (
    <div>
      <div className={s.monthRow}>
        <Text variant="body-1-strong" tnum>
          {y}년 {m}월
        </Text>
        <div>
          <SmallIconButton icon="back" label="이전 달" disabled={mi <= 0} onPress={() => setMonth(MONTHS[mi - 1])} />
          <SmallIconButton icon="chevron-right" label="다음 달" disabled={mi >= MONTHS.length - 1} onPress={() => setMonth(MONTHS[mi + 1])} />
        </div>
      </div>
      <MonthGrid
        variant="picker"
        month={month}
        selected={value}
        onSelect={(d) => {
          onPick(d);
          if (d.slice(0, 7) !== month) setMonth(d.slice(0, 7));
        }}
        isHoliday={(d) => holidayOn(events, d)}
        canSelect={(d) => MONTHS.includes(d.slice(0, 7))}
      />
    </div>
  );
}
