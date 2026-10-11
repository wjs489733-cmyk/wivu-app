import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Chip, Icon, Screen, Segmented, Text, TopNav } from '@/ui';
import { P } from '@/app/paths';
import { CAFETERIAS, MEAL_DAYS, MEAL_TIME, MEAL_TIP, MEAL_TODAY, MENUS, type CafeteriaId, type Meal as MealT, type MealKind } from './data';
import s from './Info.module.css';

/**
 * 학식 — Figma 429:8987 (홈 '오늘의 학식' 카드 · 퀵메뉴 → PUSH)
 * 요일(월–금 9/7–9/11, 오늘 금 선택) · 식당 탭 · 시간표 기준 추천(오늘만) · 중식/석식 카드.
 * 카드를 누르면 그 끼니의 혼잡도 그래프가 펼쳐진다(기본: 중식).
 */
export function Meal() {
  const [day, setDay] = useState<number>(MEAL_TODAY);
  const [cafe, setCafe] = useState<CafeteriaId>('student');
  const [open, setOpen] = useState<MealKind>('중식');
  const isToday = day === MEAL_TODAY;
  const place = CAFETERIAS.find((c) => c.value === cafe)!.place;
  const meals = MENUS[day][cafe];

  return (
    <Screen figma="429:8987" header={<TopNav title={isToday ? '오늘의 학식' : `9월 ${day}일 학식`} fallback={P.home} />}>
      <div className={s.page}>
        <div className={s.days} role="tablist" aria-label="요일">
          {MEAL_DAYS.map((w) => {
            const on = w.d === day;
            return (
              <button key={w.d} type="button" role="tab" aria-selected={on} className={s.day} onClick={() => setDay(w.d)} aria-label={`9월 ${w.d}일 ${w.dow}요일${w.d === MEAL_TODAY ? ' 오늘' : ''}`}>
                <Text variant="caption-2" color={on ? 'on-brand' : 'tertiary'}>
                  {w.dow}
                </Text>
                <Text variant="title-2" color={on ? 'on-brand' : 'primary'} tnum>
                  {w.d}
                </Text>
              </button>
            );
          })}
        </div>

        <Segmented items={CAFETERIAS.map(({ value, label }) => ({ value, label }))} value={cafe} onChange={setCafe} />

        {isToday && cafe === 'student' && (
          <div className={s.tip}>
            <span className={s.tipIcon}>
              <Icon name="clock" size={20} />
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <Text variant="caption-2-strong" color="brand">
                {MEAL_TIP.label}
              </Text>
              <Text variant="label">{MEAL_TIP.title}</Text>
              <Text variant="caption-2" color="secondary">
                {MEAL_TIP.meta}
              </Text>
            </span>
          </div>
        )}

        <div className={s.fullDivider} role="separator" />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${day}-${cafe}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {meals.map((m) => (
              <MealCard key={m.kind} meal={m} place={place} expanded={open === m.kind} isToday={isToday} onPress={() => setOpen(m.kind)} />
            ))}
          </motion.div>
        </AnimatePresence>

        <Text variant="caption-2" color="tertiary" as="p">
          메뉴와 가격은 식당 사정에 따라 바뀔 수 있어요
        </Text>
      </div>
    </Screen>
  );
}

function MealCard({ meal, place, expanded, isToday, onPress }: { meal: MealT; place: string; expanded: boolean; isToday: boolean; onPress: () => void }) {
  const t = MEAL_TIME[meal.kind];
  return (
    <button type="button" className={s.mealCard} aria-expanded={expanded} onClick={onPress}>
      <span className={s.mealHead}>
        <Chip tone="neutral" pill className={expanded ? s.chipActive : undefined}>
          {meal.kind}
        </Chip>
        <Text variant="caption-1" color="secondary" className="truncate tnum">
          {t.range} · {place}
        </Text>
        <Text variant="label" tnum>
          {meal.price}
        </Text>
      </span>
      <Text variant="title-2" as="span">
        {meal.main}
      </Text>
      <Text variant="callout" color="secondary" as="span">
        {meal.sides}
      </Text>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.span className={s.crowd} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}>
            <span className={s.crowdHead}>
              <Text variant="caption-2-strong" color="secondary">
                {isToday ? '예상 혼잡도' : '혼잡도 기록'}
              </Text>
              <Text variant="caption-2-strong" color="warning" tnum>
                {meal.peak}
              </Text>
            </span>
            <span className={s.bars} aria-label={`혼잡도 그래프 · ${meal.peak}`} role="img">
              {meal.crowd.map((v, i) => (
                <motion.span
                  key={i}
                  className={s.bar}
                  data-level={i === meal.best ? 'best' : v >= 0.7 ? 'busy' : 'calm'}
                  style={{ height: `${Math.round(v * 100)}%` }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.03 * i, duration: 0.3 }}
                />
              ))}
            </span>
            <span className={s.axis}>
              {t.axis.map((a) => (
                <Text key={a} variant="caption-2" color="tertiary" tnum>
                  {a}
                </Text>
              ))}
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
