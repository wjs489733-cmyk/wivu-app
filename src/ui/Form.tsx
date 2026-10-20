import { useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';
import { Text } from './primitives';
import s from './Form.module.css';

/* ── Text field v5 (Figma 666:4886: h52 r12, bg/subtle → 포커스 시 흰 배경 + 브랜드 1.5 보더, 오류 빨간 보더) ── */
type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label?: string;
  error?: string | boolean;
  hint?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** 비밀번호 '표시' 토글 */
  reveal?: boolean;
  onClear?: () => void;
};
export function TextField({ label, error, hint, leading, trailing, reveal, onClear, type = 'text', className, id, ...rest }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [shown, setShown] = useState(false);
  const isPw = type === 'password';
  return (
    <div className={`${s.field} ${className ?? ''}`}>
      {label && (
        <label htmlFor={inputId} className="t-body-3-strong" style={{ color: 'var(--wivu-color-text-secondary)' }}>
          {label}
        </label>
      )}
      <div className={s.control} data-error={!!error}>
        {leading}
        <input id={inputId} className={`${s.input} t-body-1`} type={isPw && shown ? 'text' : type} aria-invalid={!!error} {...rest} />
        {onClear && rest.value ? (
          <button type="button" className={s.clear} onClick={onClear} aria-label="지우기">
            <Icon name="close" size={16} />
          </button>
        ) : null}
        {isPw && reveal && (
          <button type="button" className={`${s.reveal} t-body-3-strong`} onClick={() => setShown((v) => !v)}>
            {shown ? '숨김' : '표시'}
          </button>
        )}
        {trailing}
      </div>
      {typeof error === 'string' && error ? (
        <Text variant="caption-1" color="error" className={s.message} role="alert">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption-1" color="tertiary" className={s.message}>
          {hint}
        </Text>
      ) : null}
    </div>
  );
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${s.textarea} t-body-2 ${className ?? ''}`} {...rest} />;
}

/* ── Search field (h44 r12 bg/subtle) ───────────────────────── */
export function SearchField({ value, onChange, placeholder = '검색', autoFocus }: { value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }) {
  return (
    <div className={s.search}>
      <Icon name="search" size={20} color="secondary" />
      <input className={`${s.searchInput} t-body-2`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} type="search" enterKeyHint="search" />
      {value && (
        <button type="button" className={s.clearRound} onClick={() => onChange('')} aria-label="지우기">
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  );
}

/* ── Checkbox v5 (20, r6, 라벨 Body 3 secondary) ──────────────────────────────────────── */
export function Checkbox({ checked, onChange, label, round }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; round?: boolean }) {
  return (
    <label className={s.check}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span className={s.box} data-checked={checked} data-round={round}>
        {checked && <Icon name="check" size={16} />}
      </span>
      {label && <Text variant="body-3" color="secondary">{label}</Text>}
    </label>
  );
}

/* ── Switch (iOS형, on = brand) ─────────────────────────────── */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={s.switch} data-on={checked} onClick={() => onChange(!checked)}>
      <span className={s.knob} />
    </button>
  );
}

/* ── Segmented text tabs ('시간표 | 캘린더') ─────────────────── */
export function TextTabs<T extends string>({ items, value, onChange }: { items: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className={s.textTabs} role="tablist">
      {items.map((it) => (
        <button key={it.value} type="button" role="tab" aria-selected={it.value === value} className={`${s.textTab} t-title-2`} onClick={() => onChange(it.value)}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* ── Segmented control (pill) ───────────────────────────────── */
export function Segmented<T extends string>({ items, value, onChange }: { items: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className={s.segmented} role="tablist">
      {items.map((it) => (
        <button key={it.value} type="button" role="tab" aria-selected={it.value === value} className={`${s.segment} t-body-3-strong`} onClick={() => onChange(it.value)}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* ── 선택 행 (라디오처럼) ───────────────────────────────────── */
export function OptionRow({ title, meta, selected, onPress, icon }: { title: ReactNode; meta?: ReactNode; selected: boolean; onPress: () => void; icon?: IconName }) {
  return (
    <button type="button" className={s.option} data-selected={selected} onClick={onPress} aria-pressed={selected}>
      {icon && <Icon name={icon} size={20} color={selected ? 'brand' : 'primary'} />}
      <span style={{ flex: 1, minWidth: 0 }}>
        <Text variant="body-2-strong" as="span" style={{ display: 'block' }}>
          {title}
        </Text>
        {meta && (
          <Text variant="caption-2" color="tertiary" as="span" style={{ display: 'block' }}>
            {meta}
          </Text>
        )}
      </span>
      <span className={s.radio} data-checked={selected} />
    </button>
  );
}
