import type { CSSProperties } from 'react';
import { icons, logos, type IconName, type LogoName } from '@/icons/icons.generated';

export type { IconName, LogoName };

/** 아이콘 규격 (WivU Icons v2): 24 그리드 · 선 1.7 · 사용 크기 16/20/24 — 선 두께는 크기에 비례(24→1.7, 20→1.42, 16→1.13) */
export type IconSize = 16 | 20 | 24;

type IconProps = {
  name: IconName;
  size?: IconSize;
  /** CSS color 값 또는 토큰 이름 단축: 'primary' | 'secondary' | 'brand' | 'pulse' | 'on-brand' | 'error' */
  color?: 'primary' | 'secondary' | 'tertiary' | 'brand' | 'pulse' | 'on-brand' | 'error' | 'warning' | 'inherit' | (string & {});
  className?: string;
  style?: CSSProperties;
  label?: string;
};

const TOKEN: Record<string, string> = {
  primary: 'var(--wivu-color-icon-primary)',
  secondary: 'var(--wivu-color-icon-secondary)',
  tertiary: 'var(--wivu-color-text-tertiary)',
  brand: 'var(--wivu-color-icon-brand)',
  pulse: 'var(--wivu-color-icon-pulse)',
  'on-brand': 'var(--wivu-color-text-on-brand)',
  error: 'var(--wivu-color-status-error)',
  warning: 'var(--wivu-color-status-warning)',
  inherit: 'currentColor',
};

export function Icon({ name, size = 24, color = 'inherit', className, style, label }: IconProps) {
  const icon = icons[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox={icon.viewBox}
      fill="none"
      className={className}
      style={{ color: TOKEN[color] ?? color, flexShrink: 0, ...style }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  );
}

export function Logo({ name = 'logo-wu-blue', height = 24, className, style }: { name?: LogoName; height?: number; className?: string; style?: CSSProperties }) {
  const logo = logos[name];
  const [, , w, h] = logo.viewBox.split(' ').map(Number);
  return (
    <svg
      width={(height * w) / h}
      height={height}
      viewBox={logo.viewBox}
      fill="none"
      className={className}
      style={style}
      role="img"
      aria-label="WivU"
      dangerouslySetInnerHTML={{ __html: logo.body }}
    />
  );
}
