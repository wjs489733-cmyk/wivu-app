import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Icon, Screen, Text, TopNav } from '@/ui';
import { P } from '@/app/paths';
import { CAFETERIAS, MEAL_DAYS, MEAL_MONTH, MEAL_TIME, MEAL_TODAY, MENUS, type CafeteriaId, type Meal as MealT } from './data';
import { LineTabs } from './parts';
import s from './Info.module.css';

/**
 * 오늘의 학식 — Figma v5 681:5684 (홈 '오늘의 학식' 카드 · 퀵메뉴 → PUSH)
 * 요일(월–금 10/5–10/9, 오늘 금) · 식당 밑줄 탭 · 끼니별 '시간 · 장소' 한 줄 + 메뉴(가격) + 사진 자리 +
 * 시간대별 혼잡도(가장 붐비는 칸 빨강 + '가장 붐벼요' 라벨). v4의 추천 카드·접는 카드·안내 문구는 v5에서 빠짐.
 */
export function Meal() {
  const [day, setDay] = useState<number>(MEAL_TODAY);
  const [cafe, setCafe] = useState<CafeteriaId>('student');
  const isToday = day === MEAL_TODAY;
  const place = CAFETERIAS.find((c) => c.value === cafe)!.place;
  const meals = MENUS[day][cafe];

  return (
    <Screen figma="681:5684" header={<TopNav title={isToday ? '오늘의 학식' : `${MEAL_MONTH}월 ${day}일 학식`} fallback={P.home} />}>
      <div className={s.mealPage}>
        <div className={s.days} role="tablist" aria-label="요일">
          {MEAL_DAYS.map((w) => {
            const on = w.d === day;
            const today = w.d === MEAL_TODAY;
            return (
              <button key={w.d} type="button" role="tab" aria-selected={on} className={s.day} onClick={() => setDay(w.d)} aria-label={`${MEAL_MONTH}월 ${w.d}일 ${w.dow}요일${today ? ' 오늘' : ''}`}>
                <Text variant="caption-2" color={today ? 'brand' : 'tertiary'}>
                  {w.dow}
                </Text>
                <span className={s.date}>
                  <Text variant={on ? 'body-2-strong' : 'body-2'} color={on ? 'on-brand' : 'primary'} tnum>
                    {w.d}
                  </Text>
                </span>
              </button>
            );
          })}
        </div>

        <LineTabs label="식당" items={CAFETERIAS.map(({ value, label }) => ({ value, label }))} value={cafe} onChange={setCafe} />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={`${day}-${cafe}`} className={s.meals} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
            {meals.map((m) => (
              <MealBlock key={m.kind} meal={m} place={place} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </Screen>
  );
}

function MealBlock({ meal, place }: { meal: MealT; place: string }) {
  const t = MEAL_TIME[meal.kind];
  const peak = meal.crowd.indexOf(Math.max(...meal.crowd));
  return (
    <section className={s.meal} aria-label={meal.kind}>
      <Text variant="caption-1" color="tertiary" as="p" className="tnum">
        {meal.kind} | {t.range} · {place}
      </Text>
      <div className={s.menu}>
        <div className={s.menuText}>
          <Text variant="title-3" as="h2">
            {meal.main} <span className="tnum">({meal.price})</span>
          </Text>
          <Text variant="body-3" color="secondary" as="p">
            {meal.sides}
          </Text>
        </div>
        {/* 사진 자리 (Figma 'thumb · 사진 자리' 64 · r12) */}
        <span className={s.thumb} aria-hidden>
          <Icon name="meal" size={24} />
        </span>
      </div>

      <div className={s.crowd}>
        <div className={s.crowdHead}>
          <Text variant="caption-1-strong" color="secondary">
            시간대별 혼잡도
          </Text>
          <Text variant="caption-1-strong" color="error" tnum>
            {meal.peak} 가장 붐벼요
          </Text>
        </div>
        <div className={s.bars} role="img" aria-label={`시간대별 혼잡도 · ${meal.peak} 가장 붐벼요`}>
          {meal.crowd.map((v, i) => (
            <motion.span
              key={i}
              className={s.bar}
              data-peak={i === peak}
              style={{ height: `${Math.round(v * 100)}%` }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.03 * i, duration: 0.3 }}
            />
          ))}
        </div>
        <div className={s.axis}>
          {t.axis.map((a) => (
            <Text key={a} variant="caption-2" color="tertiary" tnum>
              {a}
            </Text>
          ))}
        </div>
      </div>
    </section>
  );
}
