import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Icon, Text } from '@/ui';
import s from './Entry.module.css';

/* 진입 화면 전용 부품 (v5) */

/** v4 경로 → v5 경로 대체(replace). 들어올 때의 전환·깊이(state)는 그대로 넘겨 뒤로 가기가 자연스럽게. */
export function Redirect({ to }: { to: string }) {
  const { state } = useLocation();
  return <Navigate to={to} replace state={state} />;
}

/** 본문 안 브랜드 텍스트 링크 + 오른쪽 셰브론 16 ('대학교 찾기 ›' · '학교 변경 ›')
 *  보이는 높이 20, 터치 영역 44 (위아래 음수 여백) */
export function ChevronLink({ children, onPress }: { children: ReactNode; onPress: () => void }) {
  return (
    <button type="button" className={`${s.chevronLink} t-body-3-strong`} onClick={onPress}>
      {children}
      <Icon name="chevron-right" size={16} />
    </button>
  );
}

/**
 * 진행 단계 — Figma 'v5/Progress Step' 666:5078 (State=Done · Active · Pending)
 * 표시 22 원: 완료 = 브랜드 면 + 체크 · 진행 중 = 브랜드 2px 링 + 8 점 · 대기 = border-strong 1.5 링
 * 제목 Body 2 (진행 중 Body 2 Strong, 대기 tertiary) · 보조 문구 Caption 1 brand는 진행 중에만.
 */
export type StepState = 'done' | 'active' | 'pending';
export function ProgressStep({ state, title, sub }: { state: StepState; title: ReactNode; sub?: ReactNode }) {
  return (
    <li className={s.pStep} aria-current={state === 'active' ? 'step' : undefined}>
      <span className={s.pMark} data-state={state} aria-hidden>
        {state === 'done' && <Icon name="check" size={16} color="on-brand" />}
      </span>
      <span className={s.pText}>
        <Text variant={state === 'active' ? 'body-2-strong' : 'body-2'} color={state === 'pending' ? 'tertiary' : 'primary'} as="span" style={{ display: 'block' }}>
          {title}
          <span className="sr-only">{state === 'done' ? ' · 완료' : state === 'active' ? ' · 진행 중' : ' · 대기'}</span>
        </Text>
        {state === 'active' && sub && (
          <Text variant="caption-1" color="brand" as="span" style={{ display: 'block' }}>
            {sub}
          </Text>
        )}
      </span>
    </li>
  );
}
