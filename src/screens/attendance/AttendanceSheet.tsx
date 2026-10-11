import { useEffect, useRef, useState } from 'react';
import { BottomSheet, Button, IconButton, Keypad, PinBoxes, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';

type Status = 'idle' | 'checking' | 'error' | 'success';

/**
 * 출석 인증 PIN 시트 — Figma 372:7253(빈) · 432:9081(입력 중) · 432:9226(확인 중) · 432:9371(오류)
 * 실제 입력 로직: 아무 4자리 → 0.9초 확인 → 인증 완료(DISSOLVE). '0000' 또는 forceError면 오류(남은 시도 차감).
 * 어느 화면에서든 overlay로 띄울 수 있다 (홈 히어로, 출석 탭, 시간표 수업 시트).
 */
export function AttendanceSheet({ open, onClose, forceError = false }: { open: boolean; onClose: () => void; forceError?: boolean }) {
  const nav = useNav();
  const complete = useApp((st) => st.completeAttendance);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [left, setLeft] = useState(3);
  const failedOnce = useRef(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (open) {
      setValue('');
      setStatus('idle');
      setLeft(3);
      failedOnce.current = false;
    }
    return () => timers.current.forEach(clearTimeout);
  }, [open]);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const submit = (pin: string) => {
    setStatus('checking');
    later(() => {
      const wrong = pin === '0000' || (forceError && !failedOnce.current);
      if (wrong) {
        failedOnce.current = true;
        setStatus('error');
        setLeft((n) => Math.max(0, n - 1));
        return;
      }
      setStatus('success');
      complete('PIN');
      later(() => {
        onClose();
        nav.fade(P.attendanceDone, { replace: false });
      }, 450);
    }, 900);
  };

  const onDigit = (d: string) => {
    if (status === 'checking' || status === 'success') return;
    const base = status === 'error' ? '' : value;
    if (status === 'error') setStatus('idle');
    const next = (base + d).slice(0, 4);
    setValue(next);
    if (next.length === 4) submit(next);
  };

  const message =
    status === 'checking'
      ? { text: '확인 중…', color: 'brand' as const }
      : status === 'error'
        ? { text: `번호가 일치하지 않아요 · 남은 시도 ${left}회`, color: 'error' as const }
        : status === 'success'
          ? { text: '출석이 인증됐어요', color: 'brand' as const }
          : { text: '교수님이 알려준 4자리 번호를 입력하세요', color: 'tertiary' as const };

  return (
    <BottomSheet open={open} onClose={onClose} label="출석 인증">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -4 }}>
        <Text variant="title-2" as="h2" style={{ fontSize: 20 }}>
          출석 인증
        </Text>
        <div style={{ marginRight: -10 }}>
          <IconButton icon="close" label="닫기" onPress={onClose} />
        </div>
      </div>
      <Text variant="caption-1" color="secondary" as="p">
        서비스디자인 · 10:00 – 11:50 · 디자인관 302호
      </Text>
      <div style={{ marginTop: 20 }}>
        <PinBoxes value={status === 'error' ? '••••' : value} status={status} />
      </div>
      <Text variant="caption-1" color={message.color} as="p" align="center" style={{ minHeight: 18, margin: '10px 0 14px' }} role={status === 'error' ? 'alert' : undefined}>
        {message.text}
      </Text>
      <Keypad
        onDigit={onDigit}
        onDelete={() => status === 'idle' && setValue((v) => v.slice(0, -1))}
        disabled={status === 'checking' || status === 'success'}
        extraKey={
          <Button
            variant="soft"
            size="m"
            onClick={() => {
              onClose();
              later(() => nav.modal(P.attendanceQr), 200);
            }}
          >
            QR
          </Button>
        }
      />
    </BottomSheet>
  );
}
