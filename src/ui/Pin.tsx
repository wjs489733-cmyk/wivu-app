import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Icon } from './Icon';
import s from './Pin.module.css';

/* ── PIN 칸 (68×76 r16, 자릿수 2·4): 입력됨 = 점, 현재 칸 = 커서, 남은 칸 = brand-soft ── */
export function PinBoxes({ value, length = 4, status = 'idle' }: { value: string; length?: number; status?: 'idle' | 'checking' | 'error' | 'success' }) {
  return (
    <motion.div
      className={s.boxes}
      animate={status === 'error' ? { x: [0, -10, 10, -8, 8, -4, 0] } : { x: 0 }}
      transition={{ duration: 0.42 }}
      style={{ ['--pin-n' as string]: length }}
      aria-label={`PIN ${length}자리 중 ${value.length}자리 입력됨`}
    >
      {Array.from({ length }, (_, i) => {
        const filled = i < value.length;
        const current = i === value.length && status === 'idle';
        return (
          <div key={i} className={s.box} data-filled={filled} data-current={current} data-status={status}>
            {filled ? <span className={s.dot} /> : current ? <span className={s.caret} /> : null}
          </div>
        );
      })}
    </motion.div>
  );
}

/* ── 숫자 키패드 3×4 ───────────────────────────────────────── */
type KeypadProps = {
  onDigit: (d: string) => void;
  onDelete: () => void;
  /** 왼쪽 아래 칸 (예: 'QR' 버튼) */
  extraKey?: ReactNode;
  disabled?: boolean;
};
export function Keypad({ onDigit, onDelete, extraKey, disabled }: KeypadProps) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  return (
    // 잠겨도 extraKey(QR 등)는 따로 쓸 수 있어야 하므로 컨테이너에 aria-disabled를 두지 않는다 — 숫자 키 각각이 disabled
    <div className={s.keypad} role="group" aria-label="숫자 키패드">
      {keys.map((k) => (
        <button key={k} type="button" className={`${s.key} t-title-2`} onClick={() => onDigit(k)} disabled={disabled}>
          {k}
        </button>
      ))}
      <div className={s.extra}>{extraKey}</div>
      <button type="button" className={`${s.key} t-title-2`} onClick={() => onDigit('0')} disabled={disabled}>
        0
      </button>
      <button type="button" className={s.key} onClick={onDelete} disabled={disabled} aria-label="지우기">
        <Icon name="backspace" size={24} />
      </button>
    </div>
  );
}
