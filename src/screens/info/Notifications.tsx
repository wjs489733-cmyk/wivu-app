import { useMemo, useState } from 'react';
import { Icon, Screen, Text, TextAction, TopNav, toast } from '@/ui';
import { useNav, type Nav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { useNow } from '@/data/clock';
import { openSession } from '@/data/today';
import { NOTI_FILTERS, NOTI_GROUPS, notificationsAt, type Noti, type NotiFilter, type NotiTarget } from './data';
import { FilterRow } from './parts';
import s from './Info.module.css';

/**
 * 알림함 — Figma v5 681:5798 (홈 헤더 종 → PUSH) · 모두 읽음 701:8991
 * 필터(Button S) · 오늘/어제/이번 주 묶음(구분선 대신 간격) · 안 읽은 알림 = 오른쪽 파란 점.
 * 알림을 누르면 읽음 처리(useApp.markRead) 후 관련 화면으로 PUSH. Top Nav '모두 읽음' → 점이 모두 사라지고 토스트.
 * 실시간(11-06): 목록·묶음·시각은 지금 기준(notificationsAt(useNow())) — 아직 안 온 알림은 안 보이고, 출석 알림은 실제 수업 인증 창이 열릴 때 생김.
 */
export function Notifications() {
  const nav = useNav();
  const read = useApp((st) => st.readNotifications);
  const markRead = useApp((st) => st.markRead);
  const attended = useApp((st) => st.attended);
  const now = useNow();
  const all = useMemo(() => notificationsAt(now), [now]);
  const [filter, setFilter] = useState<NotiFilter>('all');

  const isUnread = (n: Noti) => n.unread && !read.includes(n.id);
  const visible = all.filter((n) => filter === 'all' || n.filter === filter);
  const groups = NOTI_GROUPS.map((g) => ({ g, items: visible.filter((n) => n.group === g) })).filter((x) => x.items.length > 0);

  const open = (n: Noti) => {
    markRead(n.id);
    go(nav, n.to, attended, now);
  };
  // Figma 701:8991: 다 읽은 뒤에도 버튼은 그대로(파랑) — 다시 눌러도 같은 안내
  const readAll = () => {
    all.filter(isUnread).forEach((n) => markRead(n.id));
    toast('모든 알림을 읽었어요', 'check');
  };

  return (
    <Screen figma="681:5798" header={<TopNav title="알림" fallback={P.home} trailing={<TextAction onPress={readAll}>모두 읽음</TextAction>} />}>
      <div className={s.notiPage}>
        <FilterRow label="알림 분류" items={NOTI_FILTERS} value={filter} onChange={setFilter} />

        {groups.length === 0 && (
          <div className={s.empty}>
            <Icon name="bell" size={24} color="tertiary" />
            <Text variant="body-3" color="secondary">
              {filter === 'all' ? '아직 받은 알림이 없어요' : '이 분류의 알림이 없어요'}
            </Text>
          </div>
        )}

        {groups.map(({ g, items }) => (
          <section key={g} className={s.group} aria-label={g}>
            <Text variant="caption-1-strong" color="tertiary" as="h2" className={s.groupTitle}>
              {g}
            </Text>
            {items.map((n) => (
              <NotiRow key={n.id} n={n} unread={isUnread(n)} onPress={() => open(n)} />
            ))}
          </section>
        ))}
      </div>
    </Screen>
  );
}

function NotiRow({ n, unread, onPress }: { n: Noti; unread: boolean; onPress: () => void }) {
  return (
    <button type="button" className={s.noti} onClick={onPress} aria-label={`${unread ? '안 읽음 · ' : ''}${n.category} · ${n.title}`}>
      <span className={s.notiMain}>
        <span className={s.notiMeta}>
          <Text variant="caption-2-strong" color={n.highlight ? 'brand' : 'tertiary'}>
            {n.category}
          </Text>
          <Text variant="caption-2" color="tertiary">
            {n.time}
          </Text>
        </span>
        <Text variant={n.highlight ? 'body-2-strong' : 'body-2'} color={n.highlight ? 'primary' : 'secondary'} as="span" className="truncate">
          {n.title}
        </Text>
        <Text variant="caption-1" color="tertiary" as="span" className="truncate">
          {n.body}
        </Text>
      </span>
      {unread && <span className={s.unreadDot} aria-hidden />}
    </button>
  );
}

/** 알림 → 관련 화면 (Figma 681:5798 반응: 모두 PUSH) */
function go(nav: Nav, to: NotiTarget, attended: Record<string, unknown>, now: Date) {
  switch (to.kind) {
    case 'attendance': {
      // Figma: 출석 인증 · 입력 전(679:5188) PUSH. 그 수업 인증 창이 닫혔거나 이미 출석했으면 출석 탭으로
      const open = openSession(now);
      if (open && (!to.key || to.key === open.key) && !attended[open.key]) nav.push(P.attendancePin);
      else nav.tab(P.attendance);
      return;
    }
    case 'assignment':
      return nav.push(P.assignment());
    case 'boardPost':
      return nav.push(P.boardPost(to.id));
    case 'courseNotice':
      return nav.push(P.courseNotice('service-design', 'c1'));
    case 'academicNotice':
      return nav.push(P.academicNotice(to.id));
    case 'board':
      // Figma: 게시판 탭(687:6491) — 탭 루트라 탭 전환
      return nav.tab(P.board);
    case 'calendarEvent':
      return nav.push(P.calendarEvent());
  }
}
