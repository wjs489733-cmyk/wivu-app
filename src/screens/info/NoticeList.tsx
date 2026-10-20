import { useState } from 'react';
import { Screen, Text, TopNav } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { NOTICE_FILTERS, NOTICE_LIST, type NoticeCategory } from './data';
import { FilterRow, NoticeBadges } from './parts';
import s from './Info.module.css';

/**
 * 학사 공지 목록 — Figma v5 688:6810 (홈 '학사 공지 · 공지 전체' · 마이 '공지사항' → PUSH)
 * 분류 필터(전체·학사·장학·행사) · 행 = 배지 + 제목(Body 1) / '날짜 · 부서'(Caption 1), 행 사이 1px 선.
 * 행을 누르면 학사 공지 상세(688:6925)로 PUSH.
 */
export function NoticeList() {
  const nav = useNav();
  const [filter, setFilter] = useState<'all' | NoticeCategory>('all');
  const list = NOTICE_LIST.filter((n) => filter === 'all' || n.category === filter);

  return (
    <Screen figma="688:6810" header={<TopNav title="학사 공지" fallback={P.home} />}>
      <div className={s.noticePage}>
        <FilterRow label="공지 분류" items={NOTICE_FILTERS} value={filter} onChange={setFilter} />
        <div className={s.noticeList}>
          {list.map((n) => (
            <button key={n.id} type="button" className={s.noticeRow} onClick={() => nav.push(P.academicNotice(n.id))}>
              <span className={s.noticeTitle}>
                <NoticeBadges n={n} />
                <Text variant="body-1" className="truncate">
                  {n.short}
                </Text>
              </span>
              <Text variant="caption-1" color="tertiary" className="tnum">
                {n.date} · {n.author}
              </Text>
            </button>
          ))}
        </div>
      </div>
    </Screen>
  );
}
