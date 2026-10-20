import { useEffect, useState } from 'react';
import { Screen, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { USER } from '@/data/core';
import { LOAD_STEPS } from './data';
import { ProgressStep, type StepState } from './parts';
import s from './Entry.module.css';

/**
 * 정보 불러오는 중 — Figma v5 669:4806
 * 세로 진행 단계 4개(v5/Progress Step)가 차례로 진행 중 → 완료. 끝나면 온보딩 완료 처리 후 홈(DISSOLVE).
 * Figma: '시간표·과제·공지 동기화' 진행 중 정지 상태 + AFTER_TIMEOUT 2초 → 홈 674:4748.
 * v5: 알림·퀵메뉴 초기 설정 단계 없음 (기본값 그대로, 마이에서 바꿈).
 */
/** 각 단계가 '진행 중'이 되는 시각(ms) · 마지막 값 = 모두 완료 */
const AT = [0, 450, 900, 1500, 1950];
const LEAVE_AFTER = 200;

export function Loading() {
  const nav = useNav();
  const school = useApp((st) => st.selectedSchool);
  const finishOnboarding = useApp((st) => st.finishOnboarding);
  /** 지금 진행 중인 단계 (LOAD_STEPS.length = 모두 완료) */
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timers = AT.slice(1).map((ms, i) => window.setTimeout(() => setActive(i + 1), ms));
    timers.push(
      window.setTimeout(() => {
        finishOnboarding();
        nav.reset(P.home, 'fade');
      }, AT[AT.length - 1] + LEAVE_AFTER),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stateOf = (i: number): StepState => (i < active ? 'done' : i === active ? 'active' : 'pending');

  return (
    <Screen figma="669:4806" scroll={false}>
      <div className={s.loadPage}>
        <Text variant="title-2" as="h1" className={s.preLine}>
          <Text variant="title-2" color="brand">
            {USER.name}님
          </Text>
          {'의 정보를\n불러오는 중이에요'}
        </Text>
        <Text variant="body-3" color="secondary" as="p" className={s.loadDesc}>
          처음 한 번만 진행돼요. 잠시만 기다려 주세요.
        </Text>
        <ol className={s.steps} aria-label="학교 정보 불러오는 중" aria-live="polite">
          {LOAD_STEPS.map((st, i) => (
            <ProgressStep key={st.title} state={stateOf(i)} title={st.title} sub={st.sub(school)} />
          ))}
        </ol>
      </div>
    </Screen>
  );
}
