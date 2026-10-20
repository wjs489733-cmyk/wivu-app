import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Chip, IconButton, LargeHeader, ListRow, Screen, Section, TabBar, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useHasUnread } from '@/app/useUnread';
import { courseById } from '@/data/core';
import { CAMPUS_BOARDS, COURSE_ROWS_FOLDED, MY_COURSE_ROWS, TEAM_FEATURED, courseHeadcount } from './data';
import { useAllPosts, useBoard } from './store';
import { ApplyOverlay, BoardSearch, Fab, RecruitCard, useFabVisible } from './parts';
import { useApplyFlow } from './applyFlow';
import s from './Board.module.css';

/**
 * 게시판 탭 — Figma v5 687:6491
 * 같은 라우트 안 상태: 팀플 참여 신청 시트 699:7758 → 신청 완료(카드 4/5명 · '신청 완료' + 토스트) 699:7595
 *   → '신청 완료' 다시 누르면 취소 확인 699:7948 · 검색 레이어 699:8103
 * 데모 진입: ?sheet=apply (신청 시트) · ?search=1 (검색)
 */
const FAB_SPACE = 16 + 44 + 16; // 마지막 카드가 FAB 위로 올라올 수 있게
export function BoardRoot() {
  const nav = useNav();
  const [params] = useSearchParams();
  const seen = useBoard((st) => st.seen);
  const posts = useAllPosts();
  const apply = useApplyFlow();
  const unread = useHasUnread();
  const [search, setSearch] = useState(() => params.get('search') === '1');
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fabSlot = useRef<HTMLDivElement>(null);
  const fabShown = useFabVisible(scrollRef, fabSlot);
  const write = () => nav.modal(P.boardWrite);

  const team = posts.find((p) => p.id === TEAM_FEATURED);
  const rows = expanded ? MY_COURSE_ROWS : MY_COURSE_ROWS.slice(0, COURSE_ROWS_FOLDED);

  // 데모 쿼리(?sheet=apply)는 처음 한 번만 상태로 옮긴다
  useEffect(() => {
    if (params.get('sheet') === 'apply' && team?.recruit && !team.mine) apply.request(team);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen
      figma="687:6491"
      scrollRef={scrollRef}
      bottomSpace={FAB_SPACE}
      header={
        <LargeHeader
          title="게시판"
          actions={
            <>
              <IconButton icon="search" label="게시판 검색" onPress={() => setSearch(true)} />
              <IconButton icon="bell" label="알림함" dot={unread} onPress={() => nav.push(P.notifications)} />
            </>
          }
        />
      }
      footer={<TabBar active="board" onActivePress={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} />}
      overlay={
        <>
          <Fab aboveTabBar onPress={write} hidden={!fabShown} slotRef={fabSlot} />
          <ApplyOverlay flow={apply} />
          <BoardSearch open={search} onClose={() => setSearch(false)} />
        </>
      }
    >
      <div className={s.root}>
        <Section title="내 수업 게시판" more={expanded ? '접기' : `전체 ${MY_COURSE_ROWS.length}`} onMore={() => setExpanded((v) => !v)} padded={false} style={{ gap: 4 }}>
          <div className={`${s.inset} ${s.plainRows}`}>
            {rows.map((c) => {
              const course = courseById(c.id);
              const fresh = c.newToday > 0 && !seen.includes(c.id);
              return (
                <ListRow
                  key={c.id}
                  title={course.name}
                  titleAddon={fresh ? <Chip tone="brand">NEW</Chip> : undefined}
                  meta={`수강생 ${courseHeadcount(c.id)}명${c.newToday > 0 ? ` · 오늘 새 글 ${c.newToday}` : ''}`}
                  chevron
                  onPress={() => nav.push(P.boardCourse(c.id))}
                />
              );
            })}
          </div>
        </Section>

        <Section title="학교 게시판" padded={false} style={{ gap: 4 }}>
          <div className={`${s.inset} ${s.campusGrid}`}>
            {CAMPUS_BOARDS.map((b) => (
              <button key={b.id} type="button" className={s.campusTile} onClick={() => nav.push(P.boardCourse(b.id))}>
                <Text variant="body-2-strong" className="truncate">
                  {b.name}
                </Text>
                <Text variant="caption-1" color="tertiary" className="truncate">
                  {b.tileSub}
                </Text>
              </button>
            ))}
          </div>
        </Section>

        {team?.recruit && (
          <Section title="모집 중인 팀플" more="전체보기" onMore={() => nav.push(`${P.boardCourse('team')}?filter=${encodeURIComponent('모집 중')}`)} padded={false} style={{ gap: 4 }}>
            <div className={s.inset}>
              <RecruitCard post={team} onApply={apply.request} />
            </div>
          </Section>
        )}
      </div>
    </Screen>
  );
}
