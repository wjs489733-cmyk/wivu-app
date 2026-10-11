import { Chip, ListGroup, Screen, Text, TopNav } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { ACADEMIC_NOTICES } from './data';
import s from './Info.module.css';

/**
 * 학사 공지 목록 — 코드 추가 화면 (Figma 프레임 없음)
 * 홈 '학사 공지 · 공지 전체' · 마이 '공지사항'에서 진입. 행 모양은 홈 학사 공지 카드와 같게(태그 칩 · 제목 · 날짜),
 * 누르면 학사 공지 상세(430:9007)로 PUSH.
 */
export function NoticeList() {
  const nav = useNav();
  return (
    <Screen header={<TopNav title="학사 공지" fallback={P.home} />}>
      <div className={s.page}>
        <Text variant="caption-1" color="secondary" as="p" className={s.listMeta}>
          학교 공지 {ACADEMIC_NOTICES.length}건 · 최신순
        </Text>
        <ListGroup>
          {ACADEMIC_NOTICES.map((n) => (
            <button key={n.id} type="button" className={s.noticeRow} onClick={() => nav.push(P.academicNotice(n.id))}>
              <Chip tone={n.chips[0].tone}>{n.chips[0].label}</Chip>
              <Text variant="label" className="truncate" style={{ flex: 1 }}>
                {n.short}
              </Text>
              <Text variant="caption-2" color="tertiary" tnum>
                {n.date}
              </Text>
            </button>
          ))}
        </ListGroup>
      </div>
    </Screen>
  );
}
