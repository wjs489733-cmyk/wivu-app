import { useApp } from '@/store/app';
import { NOTIFICATIONS } from '@/screens/info/data';

/** 안 읽은 알림이 있는지 — 탭 루트 헤더의 종 아이콘 점 표시에 사용 (알림함에서 읽으면 사라짐) */
export function useHasUnread() {
  const read = useApp((st) => st.readNotifications);
  return NOTIFICATIONS.some((n) => n.unread && !read.includes(n.id));
}
