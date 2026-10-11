import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import s from './Button.module.css';

export type ButtonVariant = 'primary' | 'soft' | 'outline' | 'onBrand' | 'onBrandGhost' | 'dark';
export type ButtonSize = 'l' | 'm' | 's';

const TEXT: Record<ButtonSize, string> = { l: 't-headline', m: 't-label', s: 't-caption-1-strong' };
const ICON: Record<ButtonSize, 16 | 20> = { l: 20, m: 16, s: 16 };

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

/** Button v4 — 화면당 Primary는 1개 원칙 */
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
