import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { BottomSheet, Button, Chip, CtaBar, Icon, IconButton, OptionRow, Screen, Switch, Text, TextField, TopNav, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { ALARM_OPTIONS, CAT, CATEGORIES, MONTHS, REPEAT_OPTIONS, TIME_OPTIONS, longDate, toMin, type CalEvent, type Category } from './data';
import { useSchedule } from './store';
import { holidayOn } from './agenda';
import { CatDot, MonthGrid, SmallIconButton } from './parts';
import s from './Calendar.module.css';

type Picker = 'startDate' | 'endDate' | 'startTime' | 'endTime' | 'alarm' | 'repeat';
const PICKER_TITLE: Record<Picker, string> = {
  startDate: '시작 날짜',
  endDate: '종료 날짜',
  startTime: '시작 시간',
  endTime: '종료 시간',
  alarm: '알림',
  repeat: '반복',
};
const plusHour = (t: string) => TIME_OPTIONS.find((x) => toMin(x) >= toMin(t) + 60) ?? TIME_OPTIONS[TIME_OPTIONS.length - 1];

/**
 * 일정 추가 — Figma 405:8022 (Calendar_v4_03_EventAdd) · 모달
 * 제목·카테고리·날짜/시간(시트 피커)·하루 종일·장소·알림·반복 → 저장하면 로컬 스토어에 추가되고 캘린더가 그 날짜를 선택.
 * ?date=YYYY-MM-DD 기본 날짜, ?edit=<id> 개인 일정 수정
 */
export function EventNew() {
  const nav = useNav();
  const [params] = useSearchParams();
  const editing = useSchedule((st) => st.events.find((e) => e.id === params.get('edit') && e.user));
  const saveEvent = useSchedule((st) => st.saveEvent);
  const initDate = editing?.span?.[0] ?? editing?.date ?? params.get('date') ?? '2026-10-14';

  const [title, setTitle] = useState(editing?.title ?? '');
  const [category, setCategory] = useState<Category>(editing?.category ?? 'personal');
  const [startDate, setStartDate] = useState(initDate);
  const [endDate, setEndDate] = useState(editing?.span?.[1] ?? initDate);
  const [start, setStart] = useState(editing?.start ?? '18:00');
  const [end, setEnd] = useState(editing?.end ?? '19:30');
  const [allDay, setAllDay] = useState(!!editing?.allDay);
  const [place, setPlace] = useState(editing?.place ?? '');
  const [alarm, setAlarm] = useState(editing?.alarm ?? '30분 전');
  const [repeat, setRepeat] = useState(editing?.repeat ?? '반복 안 함');
  const [picker, setPicker] = useState<Picker>('startDate');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const sameDay = startDate === endDate;
  const open = (p: Picker) => {
    setPicker(p);
    setPickerOpen(true);
  };
  const close = () => setPickerOpen(false);

  const pickDate = (d: string) => {
    if (picker === 'startDate') {
      setStartDate(d);
      if (endDate < d) setEndDate(d);
      if (endDate === d || endDate < d) {
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
      place: place.trim() || undefined,
      onCampus: !!place.trim(),
      meta: [allDay ? '하루 종일' : start, place.trim()].filter(Boolean).join(' · '),
      alarm: alarm === '없음' ? undefined : alarm,
      repeat,
      user: true,
    };
    window.setTimeout(() => {
      saveEvent(e);
      toast(editing ? '일정을 수정했어요' : `${longDate(startDate)}에 일정을 추가했어요`, 'check');
      nav.back(P.calendar);
    }, 350);
  };

  return (
    <Screen
      figma="405:8022"
      header={<TopNav title={editing ? '일정 수정' : '일정 추가'} leading="close" fallback={P.calendar} />}
      footer={
        <CtaBar>
          <Button block disabled={!title.trim()} loading={saving} onClick={save}>
            저장하기
          </Button>
        </CtaBar>
      }
      overlay={
        <BottomSheet open={pickerOpen} onClose={close} label={PICKER_TITLE[picker]}>
          <div className={s.sheetHead}>
            <Text variant="title-2" as="h2">
              {PICKER_TITLE[picker]}
            </Text>
            <IconButton icon="close" label="닫기" onPress={close} />
          </div>
          {(picker === 'startDate' || picker === 'endDate') && <DatePicker value={picker === 'startDate' ? startDate : endDate} onPick={pickDate} />}
          {(picker === 'startTime' || picker === 'endTime') && (
            <div className={s.times}>
              {TIME_OPTIONS.map((t) => {
                const disabled = picker === 'endTime' && sameDay && toMin(t) <= toMin(start);
                const on = (picker === 'startTime' ? start : end) === t;
                return (
                  <button key={t} type="button" className={`${s.timeBtn} t-label tnum`} aria-pressed={on} disabled={disabled} onClick={() => pickTime(t)}>
                    {t}
                  </button>
                );
              })}
            </div>
          )}
          {(picker === 'alarm' || picker === 'repeat') && (
            <div className={s.options}>
              {(picker === 'alarm' ? ALARM_OPTIONS : REPEAT_OPTIONS).map((o) => (
                <OptionRow
                  key={o}
                  title={o}
                  selected={(picker === 'alarm' ? alarm : repeat) === o}
                  onPress={() => {
                    if (picker === 'alarm') setAlarm(o);
                    else setRepeat(o);
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
        <TextField label="제목" value={title} onChange={(ev) => setTitle(ev.target.value)} onClear={() => setTitle('')} placeholder="팀 프로젝트 회의 (서비스디자인)" maxLength={40} enterKeyHint="done" />

        <div className={s.field}>
          <Text variant="label" color="secondary" as="p">
            카테고리
          </Text>
          <div className={s.cats} role="radiogroup" aria-label="카테고리">
            {CATEGORIES.map((c) => (
              <Chip key={c} size="m" pill tone="neutral" selected={category === c} onSelect={() => setCategory(c)} className={s.catChip}>
                <CatDot category={c} />
                {CAT[c].label}
              </Chip>
            ))}
          </div>
        </div>

        <div className={s.field}>
          <Text variant="label" color="secondary" as="p">
            날짜와 시간
          </Text>
          <div className={s.group}>
            <div className={s.groupRow}>
              <Text variant="body" color="secondary" className={s.rowLabel}>
                시작
              </Text>
              <button type="button" className={`${s.pick} t-label tnum`} aria-expanded={pickerOpen && picker === 'startDate'} onClick={() => open('startDate')}>
                {longDate(startDate)}
              </button>
              {!allDay && (
                <button type="button" className={`${s.pick} t-label tnum`} aria-expanded={pickerOpen && picker === 'startTime'} onClick={() => open('startTime')}>
                  {start}
                </button>
              )}
            </div>
            <div className={s.groupRow}>
              <Text variant="body" color="secondary" className={s.rowLabel}>
                종료
              </Text>
              <button type="button" className={`${s.pick} t-label tnum`} aria-expanded={pickerOpen && picker === 'endDate'} onClick={() => open('endDate')}>
                {longDate(endDate)}
              </button>
              {!allDay && (
                <button type="button" className={`${s.pick} t-label tnum`} aria-expanded={pickerOpen && picker === 'endTime'} onClick={() => open('endTime')}>
                  {end}
                </button>
              )}
            </div>
            <div className={s.groupRow}>
              <Text variant="body" color="secondary" className={s.rowLabel}>
                하루 종일
              </Text>
              <Switch checked={allDay} onChange={setAllDay} label="하루 종일" />
            </div>
          </div>
        </div>

        <TextField label="장소" value={place} onChange={(ev) => setPlace(ev.target.value)} onClear={() => setPlace('')} placeholder="중앙도서관 그룹스터디룸 3" maxLength={40} />

        <div className={s.field}>
          <Text variant="label" color="secondary" as="p">
            옵션
          </Text>
          <div className={s.group}>
            <button type="button" className={s.groupRow} onClick={() => open('alarm')}>
              <Text variant="body" color="secondary" className={s.rowLabel}>
                알림
              </Text>
              <Text variant="label">{alarm}</Text>
              <Icon name="chevron-right" size={16} />
            </button>
            <button type="button" className={s.groupRow} onClick={() => open('repeat')}>
              <Text variant="body" color="secondary" className={s.rowLabel}>
                반복
              </Text>
              <Text variant="label">{repeat}</Text>
              <Icon name="chevron-right" size={16} />
            </button>
          </div>
        </div>
      </div>
    </Screen>
  );
}

/** 날짜 선택 시트 — 캘린더와 같은 MonthGrid */
function DatePicker({ value, onPick }: { value: string; onPick: (d: string) => void }) {
  const [month, setMonth] = useState(value.slice(0, 7));
  const events = useSchedule((st) => st.events);
  const mi = MONTHS.indexOf(month);
  const [y, m] = month.split('-').map(Number);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginRight: -8 }}>
        <Text variant="headline" tnum>
          {y}년 {m}월
        </Text>
        <div style={{ display: 'flex' }}>
          <SmallIconButton icon="chevron-right" flip label="이전 달" disabled={mi <= 0} onPress={() => setMonth(MONTHS[mi - 1])} />
          <SmallIconButton icon="chevron-right" label="다음 달" disabled={mi >= MONTHS.length - 1} onPress={() => setMonth(MONTHS[mi + 1])} />
        </div>
      </div>
      <MonthGrid month={month} selected={value} onSelect={onPick} isHoliday={(d) => holidayOn(events, d)} canSelect={(d) => MONTHS.includes(d.slice(0, 7))} />
    </div>
  );
}
