import { Fragment } from 'react';
import { Screen, Switch, Text, TopNav, toast } from '@/ui';
import { P } from '@/app/paths';
import { NOTI_GROUPS, type NotiKey, type QuietKey } from './data';
import { useMy, useNotiOnCount } from './store';
import s from './My.module.css';

/**
 * 알림 설정 — Figma v5 701:8603
 * 수업 · 게시판 · 학교 · 방해 금지 그룹의 토글이 실제로 동작(섹션 스토어 → 마이 'N개 켜짐'에도 반영).
 * 맨 위 '지금 N개 켜짐'은 켜진 알림 수(방해 금지 제외)로 바로 바뀐다.
 */
export function NotificationSettings() {
  const toggles = useMy((st) => st.toggles);
  const setToggle = useMy((st) => st.setToggle);
  const onCount = useNotiOnCount();

  const change = (id: NotiKey | QuietKey, on: boolean) => {
    setToggle(id, on);
    // 방해 금지는 '알림 종류'가 아니라 모드라 바뀐 걸 따로 알려 준다
    if (id === 'quiet') toast(on ? '방해 금지 시간을 켰어요 · 출석 알림은 그대로 와요' : '방해 금지 시간을 껐어요', on ? 'check' : undefined);
  };

  return (
    <Screen figma="701:8603" header={<TopNav title="알림 설정" fallback={P.my} />}>
      <div className={s.page}>
        <Text variant="body-3" color="secondary" as="p" aria-live="polite" className="tnum">
          켜 둔 알림만 보내요. {onCount > 0 ? `지금 ${onCount}개 켜짐` : '지금은 모두 꺼져 있어요'}
        </Text>

        {NOTI_GROUPS.map((g) => (
          <Fragment key={g.title}>
            <div className={s.gap20} />
            <section className={s.group}>
              <Text variant="caption-1-strong" color="tertiary" as="h2">
                {g.title}
              </Text>
              <div>
                {g.items.map((o) => (
                  <div key={o.id} className={s.toggleRow}>
                    <span className={s.toggleText}>
                      <Text variant="body-2-strong" className="truncate">
                        {o.title}
                      </Text>
                      {o.meta && (
                        <Text variant="caption-1" color="tertiary" className="truncate tnum">
                          {o.meta}
                        </Text>
                      )}
                    </span>
                    <Switch checked={toggles[o.id]} label={o.title} onChange={(v) => change(o.id, v)} />
                  </div>
                ))}
              </div>
            </section>
          </Fragment>
        ))}
      </div>
    </Screen>
  );
}
