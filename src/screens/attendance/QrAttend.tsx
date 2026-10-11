import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Icon, Screen, Segmented, Text, TopNav } from '@/ui';
import { useNav, useNavState } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp, type AttendMethod } from '@/store/app';
import type { AttendOrigin } from './AttendanceSheet';
import s from './Qr.module.css';

type Mode = 'QR' | 'NFC';
type Phase = 'scanning' | 'recognized' | 'already';

/** 카메라를 대고 이만큼 지나면 포스터가 화면 안에 '맞춰진' 것처럼 보인다 — 인식은 사용자가 눌러야 진행 */
const ALIGN_MS = 2500;
/** 강의실 앞 출석 QR(가짜) — 카메라 화면 속 포스터로만 쓰는 데모 값 */
const CLASS_QR = 'WIVU-DEMO:SD302:W2';

/**
 * QR 출석 인증 — Figma 408:8098 (어두운 카메라 화면 모달)
 * 실제 카메라 없이 스캔을 흉내: 2.5초 뒤 포스터가 화면 안에 맞춰지고(안내만), 뷰파인더/‘QR 인식하기’를 눌러야
 * 인식 → 출석 완료(DISSOLVE). 사용자 동작 없이 출석이 처리되지 않는다.
 * 하단 세그먼트: PIN → PIN 시트 흐름(/attendance/pin, 시작한 곳 유지) · NFC → 같은 화면에서 NFC 태그 흉내.
 */
export function QrAttend() {
  const nav = useNav();
  const { from } = useNavState<{ from: AttendOrigin }>();
  const origin: AttendOrigin = from === 'attendance' ? 'attendance' : 'home';
  const complete = useApp((st) => st.completeAttendance);
  const doneTime = useApp((st) => st.attendanceTime);
  const doneMethod = useApp((st) => st.attendanceMethod);
  const [mode, setMode] = useState<Mode>('QR');
  const [phase, setPhase] = useState<Phase>(() => (useApp.getState().attendanceComplete ? 'already' : 'scanning'));
  const [aligned, setAligned] = useState(false);
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const recognize = (method: AttendMethod) => {
    if (phase !== 'scanning') return;
    clear();
    setPhase('recognized');
    timers.current.push(
      window.setTimeout(() => {
        complete(method);
        nav.fade(P.attendanceDone, { replace: false });
        // 완료 화면에서 뒤로 돌아오면 '이미 출석' 상태로 보이도록 (전환이 끝난 뒤 조용히 바꿈)
        timers.current.push(window.setTimeout(() => setPhase('already'), 320));
      }, 900),
    );
  };

  // 포스터가 화면 안에 맞춰지는 연출 (QR 모드 · 인식은 하지 않음)
  useEffect(() => {
    if (phase !== 'scanning' || mode !== 'QR') return;
    const t = window.setTimeout(() => setAligned(true), ALIGN_MS);
    return () => clearTimeout(t);
  }, [mode, phase]);
  useEffect(() => clear, []);

  const recognized = phase === 'recognized';
  const already = phase === 'already';
  const isQr = mode === 'QR';
  const steady = recognized || already || (isQr && aligned);

  return (
    <Screen
      bg="qr-dark"
      tone="light"
      indicatorTone="dark"
      scroll={false}
      figma="408:8098"
      header={<TopNav leading="close" title={isQr ? 'QR 출석 인증' : 'NFC 출석 인증'} tone="light" fallback={origin === 'attendance' ? P.attendance : P.home} />}
      footer={
        <div className={s.panel}>
          {already ? (
            <>
              <Text variant="subhead" as="p">
                오늘 서비스디자인 출석은 끝났어요
              </Text>
              <Button block onClick={() => nav.reset(P.attendance)}>
                출석 현황 보기
              </Button>
            </>
          ) : (
            <>
              <Text variant="subhead" as="p">
                다른 방법으로 인증
              </Text>
              <Segmented<'PIN' | Mode>
                items={[
                  { value: 'PIN', label: 'PIN' },
                  { value: 'QR', label: 'QR' },
                  { value: 'NFC', label: 'NFC' },
                ]}
                value={mode}
                onChange={(v) => {
                  if (recognized) return;
                  // QR 기록을 PIN 시트 라우트로 대체 → 시트를 닫으면 시작한 곳(홈·출석 탭·알림함)으로
                  if (v === 'PIN') nav.fade(P.attendancePin, { replace: true, state: { from: origin } });
                  else {
                    setMode(v);
                    setAligned(false);
                  }
                }}
              />
              <Button block loading={recognized} onClick={() => recognize(mode)}>
                {isQr ? 'QR 인식하기' : 'NFC 인식하기'}
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className={s.feed} aria-hidden />
      <div className={s.body}>
        <div className={s.context}>
          <Text variant="subhead" color="on-brand" as="p" align="center">
            서비스디자인 · 디자인관 302호
          </Text>
          <Text variant="caption-1" color="on-brand-muted" as="p" align="center">
            {already ? `${doneTime ?? '10:01'} · ${doneMethod ?? 'PIN'}${doneMethod === 'NFC' ? '로' : '으로'} 인증했어요` : isQr ? '강의실 앞 출석 QR을 화면 안에 맞춰주세요' : '강의실 출입문 옆 리더기에 휴대폰을 대주세요'}
          </Text>
        </div>

        <button
          type="button"
          className={s.viewfinder}
          data-phase={phase}
          onClick={() => recognize(mode)}
          aria-label={isQr ? 'QR 인식하기 (데모)' : 'NFC 인식하기 (데모)'}
          disabled={phase !== 'scanning'}
        >
          {isQr ? (
            <>
              <motion.span
                className={s.poster}
                animate={steady ? { x: 0, y: 0, rotate: 0, scale: 1, filter: 'blur(0px)' } : { x: [6, -4, 3, 6], y: [-4, 5, 2, -4], rotate: [-7, -5, -8, -7], scale: 0.86, filter: 'blur(1.2px)' }}
                transition={steady ? { duration: 0.35, ease: [0.32, 0.72, 0, 1] } : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <QRCodeSVG value={CLASS_QR} size={132} level="L" bgColor="transparent" fgColor="currentColor" />
              </motion.span>
              {phase === 'scanning' && <span className={s.scanLine} />}
            </>
          ) : (
            <span className={s.nfc}>
              {phase === 'scanning' && (
                <>
                  <span className={s.nfcWave} />
                  <span className={s.nfcWave} style={{ animationDelay: '0.7s' }} />
                </>
              )}
              <span className={s.nfcCore}>
                <Icon name="nfc" size={24} />
              </span>
            </span>
          )}
          <span className={s.corner} data-pos="tl" />
          <span className={s.corner} data-pos="tr" />
          <span className={s.corner} data-pos="bl" />
          <span className={s.corner} data-pos="br" />
          <AnimatePresence>
            {(recognized || already) && (
              <motion.span className={s.check} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 20 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <span className={`${s.timerPill} t-caption-2-strong`} role="status">
          {already
            ? '출석 완료 · 정상 출석으로 기록됐어요'
            : recognized
              ? `${isQr ? 'QR' : 'NFC'} 인식 완료 · 출석 처리 중…`
              : isQr && aligned
                ? 'QR이 화면 안에 들어왔어요 · 인식하기를 눌러주세요'
                : '출석 인정 시간 · 10:10까지 인증 가능'}
        </span>
      </div>
    </Screen>
  );
}
