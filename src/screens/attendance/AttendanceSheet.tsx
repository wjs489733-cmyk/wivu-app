import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { BottomSheet, Button, IconButton, Keypad, PinBoxes, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp, type PinDigits } from '@/store/app';

type Status = 'idle' | 'checking' | 'error' | 'success';
/** 시트가 닫힌 이유 — dismiss: 딤·드래그·X·Esc / done: 인증 완료 화면으로 / qr: QR 화면으로 */
export type SheetCloseReason = 'dismiss' | 'done' | 'qr';
/** 출석 인증을 시작한 곳 — QR 화면에서 PIN으로 돌아올 때 아래 화면을 맞추는 데 씀 */
export type AttendOrigin = 'home' | 'attendance';

const MAX_TRIES = 3;

/**
 * 출석 인증 PIN 시트 — Figma 372:7253(빈) · 432:9081(입력 중) · 432:9226(확인 중) · 432:9371(오류)
 *   [확인] 버튼·2자리 (Figma 섹션 '출석 · PIN [확인] 버튼 · 2자리 번호' 508:3117): 508:3118 4자리 완료 · 508:3344 2자리 빈 · 508:3568 2자리 완료 · 508:3786 2자리 오류
 * 실제 입력 로직: 자릿수(교수님이 정한 2·4자리)만큼 칸 → 다 채우면 [확인] 활성 → 누르면 0.9초 확인 → 인증 완료(DISSOLVE).
 * 자동 제출 없음(2자리는 실수로 바로 넘어가기 쉬워서 2·4자리 공통으로 확인 버튼). Enter 키도 확인.
 * 전부 0('00'·'0000') 또는 forceError면 오류(남은 시도 차감).
 * 남은 시도 0회면 키패드를 잠그고 QR로 안내. 하드웨어 키보드(0–9 · Backspace)도 받는다.
 * 어느 화면에서든 overlay로 띄울 수 있다 (홈 히어로, 출석 탭, 시간표 수업 시트, /attendance/pin 라우트).
 */
export function AttendanceSheet({
  open,
  onClose,
  forceError = false,
  from,
  digits: digitsProp,
}: {
  open: boolean;
  onClose: (reason: SheetCloseReason) => void;
  forceError?: boolean;
  /** 시작한 곳 (없으면 지금 주소로 판단: /attendance… → 출석, 그 밖 → 홈) */
  from?: AttendOrigin;
  /** 인증 번호 자릿수 (없으면 지금 출석 세션 값) */
  digits?: PinDigits;
}) {
  const nav = useNav();
  const { pathname } = useLocation();
  const complete = useApp((st) => st.completeAttendance);
  const sessionDigits = useApp((st) => st.pinDigits);
  const len = digitsProp ?? sessionDigits;
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [left, setLeft] = useState(MAX_TRIES);
  const [forcedUsed, setForcedUsed] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  const timers = useRef<number[]>([]);

  // 열릴 때마다 처음 상태로 (렌더 중 이전 값 비교 — effect 안 setState 대신)
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setValue('');
      setStatus('idle');
      setLeft(MAX_TRIES);
      setForcedUsed(false);
    }
  }
  // 예약된 이동(QR 화면·완료 화면)은 시트가 닫혀도 실행돼야 하므로 언마운트 때만 정리
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const inPinRoute = pathname === P.attendancePin;
  const origin: AttendOrigin = from ?? (pathname.startsWith(P.attendance) ? 'attendance' : 'home');
  const locked = left === 0;

  const submit = (pin: string) => {
    setStatus('checking');
    later(() => {
      const wrong = /^0+$/.test(pin) || (forceError && !forcedUsed);
      if (wrong) {
        setForcedUsed(true);
        setStatus('error');
        setLeft((n) => Math.max(0, n - 1));
        return;
      }
      setStatus('success');
      complete('PIN');
      later(() => {
        onClose('done');
        // 시트 라우트(/attendance/pin)면 그 기록을 완료 화면으로 대체 → 완료에서 뒤로 = 시작한 곳
        // 화면 위에 띄운 시트면 그 화면을 남겨 둔다
        nav.fade(P.attendanceDone, { replace: inPinRoute });
      }, 450);
    }, 900);
  };

  const busy = status === 'checking' || status === 'success';

  const onDigit = (d: string) => {
    if (busy || locked) return;
    const base = status === 'error' ? '' : value;
    if (status === 'error') setStatus('idle');
    if (base.length >= len) return;
    setValue(base + d);
  };
  const canConfirm = value.length === len && status === 'idle' && !locked;
  const onConfirm = () => {
    if (canConfirm) submit(value);
  };
  const onDelete = () => {
    if (status === 'idle') setValue((v) => v.slice(0, -1));
  };
  const toQr = () => {
    onClose('qr');
    // 시트 라우트에서는 그 기록을 QR로 대체 → QR을 닫으면 시작한 곳(알림함·홈·출석 탭)으로
    later(() => nav.modal(P.attendanceQr, { from: origin }, { replace: inPinRoute }), 200);
  };

  // 하드웨어 키보드: 숫자 · Backspace (시트가 열려 있는 동안)
  const keyRef = useRef({ onDigit, onDelete, onConfirm });
  useEffect(() => {
    keyRef.current = { onDigit, onDelete, onConfirm };
  });
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        keyRef.current.onDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        keyRef.current.onDelete();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        keyRef.current.onConfirm();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const message = locked
    ? { text: '시도 횟수를 넘었어요 · QR로 인증해 주세요', color: 'error' as const }
    : status === 'checking'
      ? { text: '확인 중…', color: 'brand' as const }
      : status === 'error'
        ? { text: `번호가 일치하지 않아요 · 남은 시도 ${left}회`, color: 'error' as const }
        : status === 'success'
          ? { text: '출석이 인증됐어요', color: 'brand' as const }
          : value.length === len
            ? { text: '번호를 확인하고 [확인]을 눌러 주세요', color: 'secondary' as const }
            : { text: `교수님이 알려준 ${len}자리 번호를 입력하세요`, color: 'tertiary' as const };

  return (
    <BottomSheet open={open} onClose={() => onClose('dismiss')} label="출석 인증">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -4 }}>
        <Text variant="title-2" as="h2">
          출석 인증
        </Text>
        <div style={{ marginRight: -10 }}>
          <IconButton icon="close" label="닫기" onPress={() => onClose('dismiss')} />
        </div>
      </div>
      <Text variant="caption-1" color="secondary" as="p">
        서비스디자인 · 10:00 – 11:50 · 디자인관 302호
      </Text>
      <div style={{ marginTop: 20 }}>
        <PinBoxes length={len} value={status === 'error' || locked ? '•'.repeat(len) : value} status={locked ? 'error' : status} />
      </div>
      <Text variant="caption-1" color={message.color} as="p" align="center" style={{ minHeight: 18, margin: '10px 0 14px' }} role={status === 'error' || locked ? 'alert' : undefined}>
        {message.text}
      </Text>
      <Keypad
        onDigit={onDigit}
        onDelete={onDelete}
        disabled={busy || locked}
        extraKey={
          <Button variant={locked ? 'primary' : 'soft'} size="m" onClick={toQr} disabled={busy}>
            QR
          </Button>
        }
      />
      <Button variant="primary" size="l" block disabled={!canConfirm} loading={status === 'checking'} onClick={onConfirm} style={{ marginTop: 12 }}>
        확인
      </Button>
    </BottomSheet>
  );
}
