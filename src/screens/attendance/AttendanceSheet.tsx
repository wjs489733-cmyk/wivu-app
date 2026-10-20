import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { BottomSheet, Button, Keypad, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp, type PinDigits } from '@/store/app';
import { AttendDoneBody } from './parts';
import s from './Attendance.module.css';

type Status = 'idle' | 'checking' | 'error' | 'done';
/** 시트가 닫힌 이유 — dismiss: 딤·드래그·X·Esc(입력 중) / done: 출석 완료 후 [확인]·닫기 / qr: QR 화면으로 */
export type SheetCloseReason = 'dismiss' | 'done' | 'qr';
/** 출석 인증을 시작한 곳 — QR 화면·완료 뒤 돌아갈 곳과 아래 화면을 맞추는 데 씀 */
export type AttendOrigin = 'home' | 'attendance';

const MAX_TRIES = 3;
/** ?error=1 흐름 시작 화면(679:5633)에 보이는 틀린 번호 */
const DEMO_WRONG = '4821';

/**
 * 출석 인증 시트 — Figma v5 679:5188 입력 전 · 679:5413 입력 완료 · 679:5633 오류 · 679:5848 완료 · 692:6987 자릿수 지정(2자리)
 *   묶음 1: '출석 인증' + 수업 줄(가운데) / 묶음 2: 출석번호 입력칸 1개 + [인증하기] / 묶음 3: 'QR · NFC로 인증하기' / 아래 키패드(왼쪽 아래 빈칸)
 * 실제 입력 로직: 키패드·하드웨어 키보드(0–9 · Backspace · Enter)로 입력. 자동 제출 없음.
 *   자릿수를 모르면(기본) 2~4자리 유연 입력 → 2자리부터 [인증하기] 활성. 수업이 자릿수를 알려주면(2·4) 그 자리 수를 다 채워야 활성.
 *   0.9초 확인 → 성공이면 completeAttendance('PIN') 후 같은 시트가 '출석 완료'로 바뀜 → [확인]으로 닫힘.
 *   전부 0('00'·'0000') 또는 이미 틀린 번호면 오류(남은 시도 차감). forceError(?error=1)는 오류 상태(4821 · 2번 남음)로 시작.
 *   남은 시도 0회면 입력을 잠그고 QR · NFC로 안내.
 * 어느 화면에서든 overlay로 띄울 수 있다 (홈 히어로, 출석 탭, 과목 출석 상세, 시간표 수업 시트, /attendance/pin 라우트).
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
  /** 인증 번호 자릿수 (없으면 지금 출석 세션 값, 그것도 없으면 2~4자리 유연 입력) */
  digits?: PinDigits;
}) {
  const nav = useNav();
  const { pathname } = useLocation();
  const complete = useApp((st) => st.completeAttendance);
  const sessionDigits = useApp((st) => st.pinDigits);
  const exact = digitsProp ?? sessionDigits;
  const maxLen = exact ?? 4;
  const minLen = exact ?? 2;

  const initial = () =>
    forceError
      ? { value: DEMO_WRONG.slice(0, maxLen), status: 'error' as Status, left: MAX_TRIES - 1, wrong: [DEMO_WRONG.slice(0, maxLen)] }
      : { value: '', status: 'idle' as Status, left: MAX_TRIES, wrong: [] as string[] };
  const [st, setSt] = useState(initial);
  const [wasOpen, setWasOpen] = useState(open);
  const timers = useRef<number[]>([]);

  // 열릴 때마다 처음 상태로 (렌더 중 이전 값 비교 — effect 안 setState 대신)
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSt(initial());
  }
  // 예약된 이동(QR 화면)은 시트가 닫혀도 실행돼야 하므로 언마운트 때만 정리
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const inPinRoute = pathname === P.attendancePin;
  const origin: AttendOrigin = from ?? (pathname.startsWith(P.attendance) ? 'attendance' : 'home');
  const { value, status, left } = st;
  const locked = left === 0;
  const busy = status === 'checking' || status === 'done';

  const submit = () => {
    const pin = value;
    setSt((x) => ({ ...x, status: 'checking' }));
    later(() => {
      setSt((x) => {
        const wrong = /^0+$/.test(pin) || x.wrong.includes(pin);
        if (wrong) return { ...x, status: 'error', left: Math.max(0, x.left - 1), wrong: x.wrong.includes(pin) ? x.wrong : [...x.wrong, pin] };
        return { ...x, status: 'done' };
      });
    }, 900);
  };
  // 성공 판정은 setState 안에서 하므로, 완료 상태가 되면 전역 출석을 기록
  const recorded = useRef(false);
  useEffect(() => {
    if (status === 'done' && !recorded.current) {
      recorded.current = true;
      complete('PIN');
    }
    if (status !== 'done') recorded.current = false;
  }, [status, complete]);

  const onDigit = (d: string) => {
    if (busy || locked) return;
    setSt((x) => {
      // 오류 뒤 첫 숫자는 새로 입력 시작
      const base = x.status === 'error' ? '' : x.value;
      if (base.length >= maxLen) return x;
      return { ...x, value: base + d, status: 'idle' };
    });
  };
  const onDelete = () => {
    if (busy || locked) return;
    setSt((x) => ({ ...x, value: x.value.slice(0, -1), status: 'idle' }));
  };
  const canConfirm = value.length >= minLen && (status === 'idle' || status === 'error') && !locked;
  const onConfirm = () => {
    if (canConfirm) submit();
  };
  const toQr = () => {
    onClose('qr');
    // 시트 라우트에서는 그 기록을 QR로 대체 → QR을 닫으면 시작한 곳(알림함·홈·출석 탭)으로
    later(() => nav.modal(P.attendanceQr, { from: origin }, { replace: inPinRoute }), 200);
  };

  // 하드웨어 키보드: 숫자 · Backspace · Enter (시트가 열려 있는 동안)
  const keyRef = useRef({ onDigit, onDelete, onConfirm, done: false, close: () => {} });
  useEffect(() => {
    keyRef.current = { onDigit, onDelete, onConfirm, done: status === 'done', close: () => onClose('done') };
  });
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const k = keyRef.current;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        k.onDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        k.onDelete();
      } else if (e.key === 'Enter') {
        // 키패드 버튼에 포커스가 남아 있어도 Enter = 인증하기(완료 상태면 확인)
        e.preventDefault();
        if (k.done) k.close();
        else k.onConfirm();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const sub = exact ? `서비스디자인 · 이 수업은 ${exact}자리 번호를 써요` : '서비스디자인 · 디자인관 302호';
  const placeholder = exact ? `출석번호 ${exact}자리` : '출석번호 2~4자리';
  const error = locked
    ? '번호를 3번 틀렸어요. QR · NFC로 인증해 주세요.'
    : status === 'error'
      ? `번호가 맞지 않아요. ${left}번 더 시도할 수 있어요.`
      : null;
  // 입력칸 상태: 오류(빨강) · 입력 완료(자리 다 채움 = 회색 면) · 입력 중(흰 면 + 파란 테두리 + 커서)
  const field = error ? 'error' : value.length >= maxLen || status === 'checking' ? 'filled' : 'focused';

  return (
    <BottomSheet open={open} onClose={() => onClose(status === 'done' ? 'done' : 'dismiss')} label="출석 인증">
      {status === 'done' ? (
        <AttendDoneBody onConfirm={() => onClose('done')} />
      ) : (
        <>
          <div className={s.pinHead}>
            <Text variant="title-3" as="h2" align="center">
              출석 인증
            </Text>
            <Text variant="body-3" color="secondary" as="p" align="center">
              {sub}
            </Text>
          </div>

          <div className={s.pinForm}>
            <div className={s.pinFieldWrap}>
              <div className={s.pinField} data-state={field} role="textbox" aria-readonly="true" aria-label={placeholder} aria-invalid={!!error}>
                {value ? (
                  <span className="t-body-1 tnum">{value}</span>
                ) : (
                  <span className="t-body-1" style={{ color: 'var(--wivu-color-text-placeholder)' }}>
                    {placeholder}
                  </span>
                )}
                {field === 'focused' && <span className={s.pinCaret} data-empty={!value} aria-hidden />}
              </div>
              {error && (
                <Text variant="caption-1" color="error" as="p" role="alert">
                  {error}
                </Text>
              )}
            </div>
            <Button block disabled={!canConfirm} loading={status === 'checking'} onClick={onConfirm}>
              인증하기
            </Button>
          </div>

          <div className={s.pinAlt}>
            <Button variant="tertiary" size="m" onClick={toQr} disabled={status === 'checking'}>
              QR · NFC로 인증하기
            </Button>
          </div>

          <div className={s.pinPad}>
            <Keypad onDigit={onDigit} onDelete={onDelete} disabled={busy || locked} />
          </div>
        </>
      )}
    </BottomSheet>
  );
}
