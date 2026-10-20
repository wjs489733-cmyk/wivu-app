import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Screen, Text, TopNav } from '@/ui';
import { useNav, useNavState } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import type { AttendOrigin } from './AttendanceSheet';
import s from './Qr.module.css';

type Phase = 'scanning' | 'recognized' | 'already';

/** 카메라를 대고 이만큼 지나면 포스터가 뷰파인더 안에 '맞춰진' 것처럼 보인다 — 인식은 사용자가 눌러야 진행 */
const ALIGN_MS = 2500;
/** 강의실 앞 출석 QR(가짜) — 카메라 화면 속 포스터로만 쓰는 데모 값 */
const CLASS_QR = 'WIVU-DEMO:SD302:W6';

/**
 * QR 출석 인증 — Figma v5 683:6109 (어두운 카메라 화면 모달)
 * 뷰파인더 → '강의실 QR을 화면 안에 맞춰 주세요' + 수업 줄 → 하단 [번호로 인증하기](→ 출석 인증 시트).
 * 실제 카메라 없이 스캔 흉내: 강의실 QR 포스터가 흔들리다 2.5초 뒤 뷰파인더 안에 맞춰진다(안내만).
 * 뷰파인더를 누르면 인식 → 출석 완료(완료 시트, DISSOLVE). 사용자 동작 없이 출석이 처리되지 않는다.
 * 이미 출석했으면 같은 틀에 '이미 출석' 상태.
 */
export function QrAttend() {
  const nav = useNav();
  const { from } = useNavState<{ from: AttendOrigin }>();
  const origin: AttendOrigin = from === 'attendance' ? 'attendance' : 'home';
  const complete = useApp((st) => st.completeAttendance);
  const doneTime = useApp((st) => st.attendanceTime);
  const doneMethod = useApp((st) => st.attendanceMethod);
  const [phase, setPhase] = useState<Phase>(() => (useApp.getState().attendanceComplete ? 'already' : 'scanning'));
  const [aligned, setAligned] = useState(false);
  const timers = useRef<number[]>([]);

  const recognize = () => {
    if (phase !== 'scanning') return;
    setPhase('recognized');
    timers.current.push(
      window.setTimeout(() => {
        complete('QR');
        // QR 기록을 완료 시트로 대체 → [확인]이면 시작한 곳으로
        nav.fade(P.attendanceDone, { replace: true, state: { from: origin } });
      }, 900),
    );
  };

  // 포스터가 뷰파인더 안에 맞춰지는 연출 (인식은 하지 않음)
  useEffect(() => {
    if (phase !== 'scanning') return;
    const t = window.setTimeout(() => setAligned(true), ALIGN_MS);
    return () => clearTimeout(t);
  }, [phase]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const already = phase === 'already';
  const steady = phase !== 'scanning' || aligned;

  return (
    <Screen
      bg="qr-dark"
      tone="light"
      scroll={false}
      figma="683:6109"
      header={<TopNav leading="close" tone="light" fallback={origin === 'attendance' ? P.attendance : P.home} />}
      footer={
        <div className={s.footer}>
          {already ? (
            <Button variant="secondary" onClick={() => nav.reset(P.attendance)}>
              출석 현황 보기
            </Button>
          ) : (
            // 이 QR 기록을 출석 인증 시트 라우트로 대체 → 시트를 닫으면 시작한 곳(홈·출석 탭·알림함)으로
            <Button variant="secondary" disabled={phase === 'recognized'} onClick={() => nav.fade(P.attendancePin, { replace: true, state: { from: origin } })}>
              번호로 인증하기
            </Button>
          )}
        </div>
      }
    >
      <div className={s.body}>
        <button type="button" className={s.viewfinder} data-phase={phase} onClick={recognize} aria-label="QR 인식하기 (데모)" disabled={phase !== 'scanning'}>
          <motion.span
            className={s.poster}
            animate={steady ? { x: 0, y: 0, rotate: 0, scale: 1, filter: 'blur(0px)' } : { x: [6, -4, 3, 6], y: [-4, 5, 2, -4], rotate: [-7, -5, -8, -7], scale: 0.86, filter: 'blur(1.2px)' }}
            transition={steady ? { duration: 0.35, ease: [0.32, 0.72, 0, 1] } : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <QRCodeSVG value={CLASS_QR} size={120} level="L" bgColor="transparent" fgColor="currentColor" />
          </motion.span>
          <span className={s.corner} data-pos="tl" />
          <span className={s.corner} data-pos="tr" />
          <span className={s.corner} data-pos="bl" />
          <span className={s.corner} data-pos="br" />
          <AnimatePresence>
            {phase !== 'scanning' && (
              <motion.span className={s.check} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 20 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <div className={s.context} role="status">
          <Text variant="title-3" color="on-brand" as="p" align="center">
            {already ? '오늘 출석은 이미 끝났어요' : phase === 'recognized' ? 'QR을 인식했어요' : '강의실 QR을 화면 안에 맞춰 주세요'}
          </Text>
          <Text variant="body-3" color="on-brand-muted" as="p" align="center" tnum>
            {already ? `서비스디자인 · ${doneTime ?? '09:52'} ${doneMethod ?? 'PIN'} 인증` : '서비스디자인 · 디자인관 302호'}
          </Text>
        </div>
      </div>
    </Screen>
  );
}
