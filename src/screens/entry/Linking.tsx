import { useEffect, useState } from 'react';
import { Icon, Logo, Screen, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { USER } from '@/data/core';
import { SYNC_STEPS } from './data';
import s from './Entry.module.css';

/**
 * 학교 정보 연동 중 — Figma 411:11957
 * 진행률 링 0→100%, 체크리스트가 차례로 완료 → 2.4초 후 알림 설정(DISSOLVE). Figma는 72% 정지 상태 + 2.2초 타이머.
 */
const DURATION = 2400;

export function Linking() {
  const nav = useNav();
  const school = useApp((st) => st.selectedSchool);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / DURATION);
      setPct(Math.round((1 - Math.pow(1 - p, 2)) * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => nav.reset(P.setupNotifications, 'fade'), 250);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const R = 64;
  const C = 2 * Math.PI * R;
  // 체크리스트 단계: 0–30 계정, 30–60 과목, 60–92 동기화, 92+ 준비
  const stateOf = (i: number) => {
    const edges = [30, 60, 92, 101];
    const prev = i === 0 ? 0 : edges[i - 1];
    if (i === 3) return pct >= 100 ? 'active' : 'todo';
    return pct >= edges[i] ? 'done' : pct >= prev ? 'active' : 'todo';
  };

  return (
    <Screen figma="411:11957" scroll={false}>
      <div className={s.page} style={{ height: '100%', paddingTop: 0 }}>
        <div className={s.ringWrap} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="학교 정보 연동">
          <svg width="136" height="136" viewBox="0 0 136 136" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="68" cy="68" r={R} fill="none" stroke="var(--wivu-color-bg-brand-soft)" strokeWidth="8" />
            <circle cx="68" cy="68" r={R} fill="none" stroke="var(--wivu-color-bg-brand)" strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} />
          </svg>
          <div className={s.ringLogo}>
            <Logo name="logo-wu-blue" height={38} />
          </div>
        </div>
        <Text variant="caption-1-strong" color="brand" align="center" as="p" tnum style={{ marginTop: 12 }}>
          {pct}%
        </Text>
        <Text variant="title-1" as="h1" align="center" style={{ marginTop: 20 }}>
          {USER.name}님의 학교 정보를
          <br />
          불러오고 있어요
        </Text>
        <Text variant="callout" color="secondary" align="center" as="p" style={{ marginTop: 8 }}>
          처음 한 번만 진행돼요 · 잠시만 기다려 주세요
        </Text>

        <div className={s.checklist}>
          {SYNC_STEPS.map((st, i) => {
            const state = stateOf(i);
            return (
              <div key={st.title} className={s.step}>
                <span className={s.stepDot} data-state={state}>
                  {state === 'done' && <Icon name="check" size={16} />}
                </span>
                <span>
                  <Text variant="subhead" color={state === 'todo' ? 'tertiary' : 'primary'} as="p">
                    {st.title}
                  </Text>
                  <Text variant="caption-2" color={state === 'active' && i === 2 ? 'brand' : 'secondary'} as="p">
                    {st.meta(school)}
                  </Text>
                </span>
              </div>
            );
          })}
        </div>

        <div className={s.secure}>
          <Icon name="check" size={16} color="tertiary" />
          <Text variant="caption-2" color="tertiary">
            학사 시스템과 암호화된 연결로 안전하게 동기화 중
          </Text>
        </div>
      </div>
    </Screen>
  );
}
