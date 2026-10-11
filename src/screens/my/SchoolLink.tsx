import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button, Dialog, Icon, ListGroup, ListRow, ProgressBar, Screen, Spinner, Text, TopNav, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { USER } from '@/data/core';
import { josa, SYNC_ITEMS } from './data';
import { useMy } from './store';
import s from './My.module.css';

const STEP_MS = 520;

/**
 * 학교 연동 관리 — Figma 426:8952
 * '지금 다시 동기화' → 항목별로 차례로 확인하는 가짜 진행 → 마지막 동기화 시각 갱신.
 * '연동 해제' → 확인창 → 학교 선택(352:1158)으로 이동해 다른 학교로 다시 연동.
 */
export function SchoolLink() {
  const nav = useNav();
  const school = useApp((st) => st.selectedSchool);
  const lastSync = useMy((st) => st.lastSync);
  const setLastSync = useMy((st) => st.setLastSync);
  /** null = 대기, 0..N = 동기화 중인 항목 순번 */
  const [step, setStep] = useState<number | null>(null);
  const [confirm, setConfirm] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const syncing = step !== null;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const sync = () => {
    if (syncing) return;
    const tick = (i: number) => {
      setStep(i);
      if (i >= SYNC_ITEMS.length) {
        timer.current = window.setTimeout(() => {
          setStep(null);
          const changed = lastSync !== '09:41';
          setLastSync('09:41');
          toast(changed ? '동기화를 마쳤어요' : '동기화를 마쳤어요 · 바뀐 내용이 없어요', 'check');
        }, 360);
        return;
      }
      timer.current = window.setTimeout(() => tick(i + 1), STEP_MS);
    };
    tick(0);
  };

  return (
    <Screen
      figma="426:8952"
      header={<TopNav title="학교 연동" fallback={P.my} />}
      overlay={
        <Dialog
          open={confirm}
          title="학교 연동을 해제할까요?"
          message="다른 학교로 바꾸려면 학교를 다시 고르고 학교 계정으로 로그인해야 해요."
          confirmLabel="해제하고 학교 변경"
          destructive
          onConfirm={() => {
            setConfirm(false);
            setTimeout(() => nav.push(P.school), 120);
          }}
          onCancel={() => setConfirm(false)}
        />
      }
    >
      <div className={s.page}>
        <div className={s.status} data-syncing={syncing}>
          <span className={s.statusMark} data-syncing={syncing}>
            {syncing ? <Spinner size={24} /> : <Icon name="check" size={24} />}
          </span>
          <div className={s.statusText} aria-live="polite">
            <Text variant="title-2" as="h2">
              {syncing ? '학교 정보를 다시 불러오고 있어요' : `${josa(school, '와/과')} 연동돼 있어요`}
            </Text>
            <Text variant="caption-1" color="secondary" as="p" className="tnum">
              {syncing
                ? `${SYNC_ITEMS[Math.min(step!, SYNC_ITEMS.length - 1)].title} 확인 중 · ${Math.min(step! + 1, SYNC_ITEMS.length)}/${SYNC_ITEMS.length}`
                : `학번 ${USER.studentId} · 마지막 동기화 오늘 ${lastSync}`}
            </Text>
          </div>
          <AnimatePresence initial={false}>
            {syncing && (
              <motion.div className={s.progressWrap} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <ProgressBar value={(step! / SYNC_ITEMS.length) * 100} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ListGroup>
          {SYNC_ITEMS.map((it, i) => {
            const state = !syncing || i < step! ? 'done' : i === step ? 'active' : 'pending';
            return (
              <ListRow
                key={it.id}
                leading={<Icon name={it.icon} size={20} color="primary" />}
                title={it.title}
                trailing={
                  <>
                    <Text variant="caption-1" color="secondary" tnum>
                      {it.value}
                    </Text>
                    <span className={s.syncCheck} aria-label={state === 'done' ? '동기화됨' : state === 'active' ? '확인 중' : '대기'}>
                      {state === 'active' ? <Spinner size={16} /> : <Icon name="check" size={16} color={state === 'done' ? 'pulse' : 'tertiary'} style={state === 'pending' ? { opacity: 0.4 } : undefined} />}
                    </span>
                  </>
                }
              />
            );
          })}
        </ListGroup>

        <Button variant="soft" block onClick={sync} disabled={syncing}>
          {syncing ? '동기화 중…' : '지금 다시 동기화'}
        </Button>

        <Text variant="caption-2" color="tertiary" as="p" className={s.note}>
          학번·비밀번호는 앱에 저장하지 않고, 학교 인증 서버 토큰으로만 동기화해요.
        </Text>

        <button type="button" className={s.textBtn} onClick={() => setConfirm(true)} disabled={syncing}>
          <Text variant="label" color="error">
            연동 해제
          </Text>
        </button>
      </div>
    </Screen>
  );
}
