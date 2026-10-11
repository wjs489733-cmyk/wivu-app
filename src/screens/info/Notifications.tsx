import { Fragment, useState, type CSSProperties } from 'react';
import { Chip, Icon, Screen, Text, TextAction, TopNav, toast } from '@/ui';
import { useNav, type Nav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { NOTI_FILTERS, NOTI_GROUPS, NOTIFICATIONS, type Noti, type NotiFilter, type NotiTarget, type NotiTone } from './data';
import s from './Info.module.css';

const TONE: Record<NotiTone, { color: string; text: 'brand' | 'error' | 'pulse' | 'secondary' }> = {
  brand: { color: 'var(--wivu-color-icon-brand)', text: 'brand' },
  error: { color: 'var(--wivu-color-status-error)', text: 'error' },
  pulse: { color: 'var(--wivu-color-icon-pulse)', text: 'pulse' },
  neutral: { color: 'var(--wivu-color-text-secondary)', text: 'secondary' },
};

/**
 * 알림함 — Figma 428:8938 (홈 헤더 종 → PUSH)
 * 분류 필터 · 오늘/어제/이번 주 묶음 · 안 읽은 알림 점과 배경.
 * 알림을 누르면 읽음 처리(useApp.markRead) 후 관련 화면으로 이동. '모두 읽음'은 한 번에 처리.
 */
export function Notifications() {
  const nav = useNav();
  const read = useApp((st) => st.readNotifications);
  const markRead = useApp((st) => st.markRead);
  const attended = useApp((st) => st.attendanceComplete);
  const [filter, setFilter] = useState<NotiFilter>('all');

  const isUnread = (n: Noti) => n.unread && !read.includes(n.id);
  const unreadCount = NOTIFICATIONS.filter(isUnread).length;
  const visible = NOTIFICATIONS.filter((n) => filter === 'all' || n.filter === filter);
  const groups = NOTI_GROUPS.map((g) => ({ g, items: visible.filter((n) => n.group === g) })).filter((x) => x.items.length > 0);

  const open = (n: Noti) => {
    markRead(n.id);
    go(nav, n.to, attended);
  };
  const readAll = () => {
    NOTIFICATIONS.filter(isUnread).forEach((n) => markRead(n.id));
    toast('모든 알림을 읽었어요', 'check');
  };

  return (
    <Screen
      figma="428:8938"
      header={
        <TopNav
          title="알림"
          fallback={P.home}
          trailing={
            <TextAction onPress={readAll} disabled={unreadCount === 0}>
              <span className="t-label">모두 읽음</span>
            </TextAction>
          }
        />
      }
    >
      <div className={s.page}>
        <div className={s.filters} role="toolbar" aria-label="알림 분류">
          {/* DS 필터 칩 — 선택 = brand (캘린더·수업 추가와 같은 Chip size m pill) */}
          {NOTI_FILTERS.map((f) => (
            <Chip key={f.value} size="m" pill tone="neutral" selected={filter === f.value} onSelect={() => setFilter(f.value)} className={s.filter}>
              {f.label}
              {f.value === 'all' && unreadCount > 0 && <span className={`${s.filterCount} tnum`}>{unreadCount}</span>}
            </Chip>
          ))}
        </div>

        {groups.length === 0 && (
          <div className={s.empty}>
            <Icon name="bell" size={24} color="tertiary" />
            <Text variant="callout" color="secondary">
              이 분류의 알림이 없어요
            </Text>
          </div>
        )}

        {groups.map(({ g, items }, gi) => (
          <Fragment key={g}>
            {gi > 0 && <div className={s.fullDivider} role="separator" />}
            <section className={s.group} aria-label={g}>
              <Text variant="label" color="secondary" as="h2" className={s.groupTitle}>
                {g}
              </Text>
              {items.map((n) => (
                <NotiCard key={n.id} n={n} unread={isUnread(n)} onPress={() => open(n)} />
              ))}
            </section>
          </Fragment>
        ))}
      </div>
    </Screen>
  );
}

function NotiCard({ n, unread, onPress }: { n: Noti; unread: boolean; onPress: () => void }) {
  const tone = TONE[n.tone];
  return (
    <button type="button" className={s.noti} data-unread={unread} onClick={onPress} aria-label={`${unread ? '안 읽음 · ' : ''}${n.category} · ${n.title}`}>
      <span className={s.notiIcon} style={{ '--tone': tone.color } as CSSProperties}>
        <Icon name={n.icon} size={20} />
      </span>
      <span className={s.notiMain}>
        <span className={s.notiHead}>
          <Text variant="caption-2-strong" color={tone.text}>
            {n.category}
          </Text>
          <Text variant="caption-2" color="tertiary" tnum>
            {n.time}
          </Text>
          {unread && <span className={s.unreadDot} aria-hidden />}
        </span>
        <Text variant="subhead" as="span" lines={2}>
          {n.title}
        </Text>
        <Text variant="caption-1" color="secondary" as="span" className="truncate">
          {n.body}
        </Text>
      </span>
    </button>
  );
}

/** 알림 → 관련 화면 (Figma 428:8938 반응 그대로) */
function go(nav: Nav, to: NotiTarget, attended: boolean) {
  switch (to.kind) {
    case 'attendance':
      // Figma: 출석_PIN 입력(372:7253) INSTANT. 이미 출석했으면 출석 탭으로
      if (attended) nav.tab(P.attendance);
      else nav.fade(P.attendancePin, { replace: false });
      return;
    case 'assignment':
      return nav.push(P.assignment());
    case 'boardPost':
      return nav.push(P.boardPost(to.id));
    case 'courseNotice':
      return nav.push(P.courseNotice('service-design', 'c1'));
    case 'academicNotice':
      return nav.push(P.academicNotice(to.id));
    case 'board':
      return nav.tab(P.board);
    case 'calendarEvent':
      return nav.push(P.calendarEvent());
  }
}
