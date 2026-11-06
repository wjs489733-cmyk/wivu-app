import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Icon, Screen, Text, TopNav } from '@/ui';
import { P } from '@/app/paths';
import { NOW } from '@/data/core';
import { sameDay } from '@/data/clock';
import { isWeekend } from '@/data/today';
import { CAFETERIAS, MEAL_DAYS, MEAL_TIME, MEAL_WEEKEND, mealClosedText, mealsOn, type CafeteriaId, type Meal as MealT } from './data';
import { LineTabs } from './parts';
import s from './Info.module.css';

/**
 * 오늘의 학식 — Figma v5 681:5684 (홈 '오늘의 학식' 카드 · 퀵메뉴 → PUSH)
 * 요일(이번 주 월–금, 오늘 = 실제 오늘) · 식당 밑줄 탭 · 끼니별 '시간 · 장소' 한 줄 + 메뉴(가격) + 사진 자리 +
 * 시간대별 혼잡도(가장 붐비는 칸 빨강 + '가장 붐벼요' 라벨). v4의 추천 카드·접는 카드·안내 문구는 v5에서 빠짐.
 * 주말(실시간 11-06): 요일 줄에 토·일이 붙고(오늘 = 토/일), 토·일은 '주말에는 ○○식당을 운영하지 않아요' 빈 상태.
 */
export function Meal() {
  // 날짜 단위라 앱을 연 날(NOW) 기준 — 자정이 지나면 clock이 새로고침
  const days = isWeekend(NOW) ? [...MEAL_DAYS, ...MEAL_WEEKEND] : MEAL_DAYS;
  const todayIdx = Math.max(0, days.findIndex((w) => sameDay(w.date, NOW)));
  const [idx, setIdx] = useState<number>(todayIdx);
  const [cafe, setCafe] = useState<CafeteriaId>('student');
  const day = days[idx];
  const isToday = idx === todayIdx;
  const cafeteria = CAFETERIAS.find((c) => c.value === cafe)!;
  const meals = mealsOn(day.date, cafe);

  return (
    <Screen figma="681:5684" header={<TopNav title={isToday ? '오늘의 학식' : `${day.m}월 ${day.d}일 학식`} fallback={P.home} />}>
      <div className={s.mealPage}>
        <div className={s.days} data-cols={days.length} role="tablist" aria-label="요일">
          {days.map((w, i) => {
            const on = i === idx;
            const today = i === todayIdx;
            return (
              <button key={w.dow} type="button" role="tab" aria-selected={on} className={s.day} onClick={() => setIdx(i)} aria-label={`${w.m}월 ${w.d}일 ${w.dow}요일${today ? ' 오늘' : ''}`}>
                <Text variant="caption-2" color={today ? 'brand' : 'tertiary'}>
                  {w.dow}
                </Text>
                <span className={s.date}>
                  <Text variant={on ? 'body-2-strong' : 'body-2'} color={on ? 'on-brand' : 'primary'}>
                    {w.d}
                  </Text>
                </span>
              </button>
            );
          })}
        </div>

        <LineTabs label="식당" items={CAFETERIAS.map(({ value, label }) => ({ value, label }))} value={cafe} onChange={setCafe} />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={`${idx}-${cafe}`} className={s.meals} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
            {meals ? (
              meals.map((m) => <MealBlock key={m.kind} meal={m} place={cafeteria.place} />)
            ) : (
              <div className={s.empty}>
                <Icon name="meal" size={24} color="tertiary" />
                <Text variant="body-3" color="secondary">
                  {mealClosedText(cafeteria.label)}
                </Text>
              </div>
            )}
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
      <Text variant="caption-1" color="tertiary" as="p">
        {meal.kind} | {t.range} · {place}
      </Text>
      <div className={s.menu}>
        <div className={s.menuText}>
          <Text variant="title-3" as="h2">
            {meal.main} <span>({meal.price})</span>
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
          <Text variant="caption-1-strong" color="error">
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
            <Text key={a} variant="caption-2" color="tertiary">
              {a}
            </Text>
          ))}
        </div>
      </div>
    </section>
  );
}
