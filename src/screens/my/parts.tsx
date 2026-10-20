import type { ReactNode } from 'react';
import { Icon, Text } from '@/ui';
import s from './My.module.css';

/* ────────────────────────────────────────────────────────────
 * 마이·설정 로컬 부품 (공통화 후보)
 *  - SettingRow: v5 List Row (Figma 'v5/List Row') — 구분선 없이 간격으로 묶는 설정 행
 *  - SettingGroup: 그룹 라벨(Caption 1 Strong tertiary) + 2px + 행 목록
 * ──────────────────────────────────────────────────────────── */
export function SettingRow({ title, meta, value, chevron = true, onPress }: { title: ReactNode; meta?: ReactNode; value?: ReactNode; chevron?: boolean; onPress: () => void }) {
  return (
    <button type="button" className={s.row} onClick={onPress}>
      <span className={s.rowMain}>
        <Text variant="body-1" className="truncate">
          {title}
        </Text>
        {meta && (
          <Text variant="caption-1" color="tertiary" className="truncate tnum">
            {meta}
          </Text>
        )}
      </span>
      {(value || chevron) && (
        <span className={s.rowTrailing}>
          {value && (
            <Text variant="caption-1" color="tertiary" tnum>
              {value}
            </Text>
          )}
          {chevron && <Icon name="chevron-right" size={20} color="secondary" />}
        </span>
      )}
    </button>
  );
}

export function SettingGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={s.group}>
      <Text variant="caption-1-strong" color="tertiary" as="h2">
        {title}
      </Text>
      <div>{children}</div>
    </section>
  );
}
