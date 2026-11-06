import { useApp } from '@/store/app';
import { notificationsAt } from '@/screens/info/data';
import { useNow } from '@/data/clock';

/** 안 읽은 알림이 있는지 — 탭 루트 헤더의 종 아이콘 점 표시에 사용 (알림함에서 읽으면 사라짐) */
export function useHasUnread() {
  const read = useApp((st) => st.readNotifications);
  const now = useNow(); // 앱을 켜 둔 사이 새로 온 알림(출석 인증 창 열림 등)도 점에 반영
  return notificationsAt(now).some((n) => n.unread && !read.includes(n.id));
}
