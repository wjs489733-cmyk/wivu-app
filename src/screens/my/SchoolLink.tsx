import { useEffect, useRef, useState } from 'react';
import { Button, Chip, Dialog, Icon, Screen, Text, TopNav, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { USER } from '@/data/core';
import { SYNC_ITEMS } from './data';
import { useMy } from './store';
import s from './My.module.css';

/** 기준 시각(core.ts 2026-10-09 9:41) — '지금 동기화'를 누르면 이 시각으로 갱신 */
const NOW = '09:41';
const SYNC_MS = 1200;

/**
 * 학교 연동 관리 — Figma v5 701:8324 (+ 연동 해제 확인 701:8517)
 * [지금 동기화] → 잠깐 동기화 중 → 가져오는 정보 시각 갱신 + 토스트.
 * '연동 해제하고 학교 변경' → 확인창 → 연동 해제(로그아웃과 같은 초기화) → 로그인 · 대학교 검색(667:4592 = 로그인 + 학교 검색 시트).
 */
export function SchoolLink() {
  const nav = useNav();
  const school = useApp((st) => st.selectedSchool);
  const lastSync = useMy((st) => st.lastSync);
  const [syncing, setSyncing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const sync = () => {
    if (syncing) return;
    setSyncing(true);
    timer.current = window.setTimeout(() => {
      setSyncing(false);
      const changed = useMy.getState().lastSync !== NOW;
      useMy.getState().setLastSync(NOW);
      toast(changed ? '학교 정보를 새로 가져왔어요' : '이미 최신 정보예요', 'check');
    }, SYNC_MS);
  };

  const unlink = () => {
    setConfirm(false);
    window.clearTimeout(timer.current);
    // 연동 해제 = 이 학교 계정에서 나가기 → 로그아웃과 같은 초기화·잠금 후 학교 검색이 열린 로그인으로
    useApp.getState().logout();
    useMy.getState().resetMy();
    toast('학교 연동을 해제했어요');
    nav.reset(`${P.login}?school=1`, 'fade');
  };

  return (
    <Screen
      figma={confirm ? '701:8517' : '701:8324'}
      header={<TopNav title="학교 연동" fallback={P.my} />}
      overlay={
        <Dialog
          open={confirm}
          title="학교 연동을 해제할까요?"
          message="다른 학교로 바꾸려면 학교를 다시 고르고 학교 계정으로 로그인해야 해요."
          confirmLabel="해제하고 학교 변경"
          destructive
          onConfirm={unlink}
          onCancel={() => setConfirm(false)}
        />
      }
    >
      <div className={s.page}>
        <div className={s.schoolCard}>
          <span className={s.emblem}>
            <Icon name="student" size={24} />
          </span>
          <span className={s.profileText}>
            <Text variant="title-3" className="truncate">
              {school}
            </Text>
            <Text variant="caption-1" color="secondary" className="truncate tnum">
              {USER.department} {USER.year}학년 · {USER.studentId}
            </Text>
          </span>
          <Chip tone="brand">연동됨</Chip>
        </div>

        <div className={s.gap24} />
        <Text variant="body-3-strong" color="secondary" as="h2" className={s.dataHead}>
          가져오는 정보
        </Text>
        <ul aria-live="polite">
          {SYNC_ITEMS.map((label) => (
            <li key={label} className={s.dataRow}>
              <Icon name={syncing ? 'refresh' : 'check'} size={20} color={syncing ? 'tertiary' : 'brand'} className={syncing ? s.syncSpin : undefined} />
              <Text variant="body-2" className="truncate">
                {label}
              </Text>
              <Text variant="caption-1" color="tertiary" tnum>
                {syncing ? '가져오는 중' : `오늘 ${lastSync}`}
              </Text>
            </li>
          ))}
        </ul>

        <div className={s.note}>
          <Icon name="lock" size={16} color="secondary" />
          <Text variant="caption-1" color="secondary" as="p">
            학교 계정 비밀번호는 WivU에 저장하지 않아요. 학교 통합 로그인으로만 연동돼요.
          </Text>
        </div>

        <div className={s.gap24} />
        <Button variant="secondary" block leadingIcon="refresh" loading={syncing} onClick={sync}>
          지금 동기화
        </Button>
        <button type="button" className={s.textBtn} onClick={() => setConfirm(true)} disabled={syncing}>
          <Text variant="body-3-strong" color="error">
            연동 해제하고 학교 변경
          </Text>
        </button>
      </div>
    </Screen>
  );
}
