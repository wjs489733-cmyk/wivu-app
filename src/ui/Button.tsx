import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import s from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'soft' | 'outline' | 'onBrand' | 'onBrandGhost' | 'dark';
export type ButtonSize = 'l' | 'm' | 's';

/** v5 (Figma 666:4860): L Body 1 Strong · M Body 2 Strong · S Caption 1 Strong */
const TEXT: Record<ButtonSize, string> = { l: 't-body-1-strong', m: 't-body-2-strong', s: 't-caption-1-strong' };
const ICON: Record<ButtonSize, 16 | 20> = { l: 20, m: 20, s: 16 };

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  /** 폭 100% (세로 배치·단독 버튼) */
  block?: boolean;
  /** 가로 줄에서 남은 폭 채우기 */
  grow?: boolean;
  loading?: boolean;
  children: ReactNode;
};

/** Button v5 — Primary(파랑) · Secondary(연회색 면) · Tertiary(글자만). 화면당 Primary는 1개 원칙 */
export function Button({ variant = 'primary', size = 'l', leadingIcon, trailingIcon, block, grow, loading, className, children, disabled, type = 'button', ...rest }: Props) {
  const cls = [s.button, s[size], s[variant], TEXT[size], block && s.block, grow && s.grow, className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? (
        <span className={s.spinner} aria-hidden />
      ) : (
        <>
          {leadingIcon && <Icon name={leadingIcon} size={ICON[size]} />}
          <span>{children}</span>
          {trailingIcon && <Icon name={trailingIcon} size={ICON[size]} />}
        </>
      )}
    </button>
  );
}
