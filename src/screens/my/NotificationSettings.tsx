import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Icon, ListGroup, ListRow, Logo, Screen, Switch, Text, TopNav, toast } from '@/ui';
import { P } from '@/app/paths';
import { josa, NOTI_PREVIEW, NOTI_TYPES, QUIET_OPTIONS, type NotiKey, type QuietKey } from './data';
import { useMy } from './store';
import s from './My.module.css';

/**
 * 알림 설정 — Figma 426:8846
 * 토글 6개가 실제로 동작(섹션 스토어에 저장 → 마이 화면 'N개 켜짐'에 반영).
 * 미리보기 배너는 방금 켠 알림(없으면 켜진 첫 알림)으로 바뀐다.
 */
export function NotificationSettings() {
  const toggles = useMy((st) => st.toggles);
  const setToggle = useMy((st) => st.setToggle);
  const [focus, setFocus] = useState<NotiKey | null>(null);

  const previewKey = focus && toggles[focus] ? focus : NOTI_TYPES.find((o) => toggles[o.id])?.id;
  const preview = previewKey ? NOTI_PREVIEW[previewKey] : null;

  const toggleNoti = (id: NotiKey, on: boolean) => {
    setToggle(id, on);
    if (on) setFocus(id);
  };
  const toggleQuiet = (id: QuietKey, on: boolean) => {
    setToggle(id, on);
    const opt = QUIET_OPTIONS.find((o) => o.id === id)!;
    toast(`${josa(opt.title, '을/를')} ${on ? '켰어요' : '껐어요'}`, on ? 'check' : undefined);
  };

  return (
    <Screen figma="426:8846" header={<TopNav title="알림 설정" fallback={P.my} />}>
      <div className={s.page}>
        <div className={s.notiPreview} aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {preview ? (
              <motion.div
                key={preview.title}
                className={s.notiBanner}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <span className={s.appIcon}>
                  <Logo name="logo-wu-blue" height={15} style={{ filter: 'brightness(0) invert(1)' }} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className={s.bannerHead}>
                    <Text variant="label" className="truncate">
                      {preview.title}
                    </Text>
                    <Text variant="caption-2" color="tertiary" tnum>
                      {preview.time}
                    </Text>
                  </span>
                  <Text variant="caption-2" color="secondary" as="p" className="truncate">
                    {preview.meta}
                  </Text>
                </span>
              </motion.div>
            ) : (
              <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="bell" size={20} color="tertiary" />
                <Text variant="callout" color="secondary">
                  모든 알림이 꺼져 있어요
                </Text>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ListGroup>
          {NOTI_TYPES.map((o) => (
            <ListRow
              key={o.id}
              leading={
                <span className={s.notiIcon} data-on={toggles[o.id]}>
                  <Icon name={o.icon} size={20} />
                </span>
              }
              title={o.title}
              meta={
                <Text variant="caption-2" color="secondary" className="truncate">
                  {o.meta}
                </Text>
              }
              trailing={<Switch checked={toggles[o.id]} label={o.title} onChange={(v) => toggleNoti(o.id, v)} />}
            />
          ))}
        </ListGroup>

        <ListGroup>
          {QUIET_OPTIONS.map((o) => (
            <ListRow
              key={o.id}
              title={o.title}
              meta={
                <Text variant="caption-2" color="secondary" className="truncate tnum">
                  {o.meta}
                </Text>
              }
              trailing={<Switch checked={toggles[o.id]} label={o.title} onChange={(v) => toggleQuiet(o.id, v)} />}
            />
          ))}
        </ListGroup>
      </div>
    </Screen>
  );
}
