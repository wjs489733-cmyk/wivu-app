import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { Button, Chip, Icon, IconButton, Screen, Text, TopNav } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { boardById, type Board, type Post } from './data';
import { useAllPosts, useBoard } from './store';
import { BoardSearch, EmptyState, Fab, PostRow } from './parts';
import s from './Board.module.css';

const ALL = '전체';
const RECRUITING = '모집 중';

/** 이 게시판에 보일 글 — 팀플·스터디는 수업 게시판의 팀플 모집 글도 함께 모아 보여준다 */
function postsOf(board: Board, posts: Post[]) {
  if (board.id === 'team') return posts.filter((p) => p.boardId === 'team' || !!p.recruit);
  return posts.filter((p) => p.boardId === board.id);
}

/**
 * 수업 게시판 피드 — Figma 419:8518 (Board_v4_02_CourseFeed)
 * 같은 화면을 '전체 게시판' 6종(자유·정보·팀플·스터디·시각디자인과·장터·분실물)에도 재사용한다.
 * 경로: P.boardCourse(courseId | 'free' | 'info' | 'team' | 'dept' | 'market' | 'lost')
 */
export function BoardFeed() {
  const nav = useNav();
  const { id = 'service-design' } = useParams();
  const [params] = useSearchParams();
  const board = boardById(id);
  const all = useAllPosts();
  const markSeen = useBoard((st) => st.markSeen);
  const [filter, setFilter] = useState(() => {
    const f = params.get('filter');
    return f && board.filters.includes(f) ? f : ALL;
  });
  const [search, setSearch] = useState(false);
  const [mountedAt] = useState(() => Date.now());

  useEffect(() => markSeen(board.id), [board.id, markSeen]);

  const list = useMemo(() => {
    const mine = postsOf(board, all);
    if (filter === ALL) return mine;
    if (filter === RECRUITING) return mine.filter((p) => !!p.recruit);
    return mine.filter((p) => p.tag === filter);
  }, [board, all, filter]);

  const write = () => nav.modal(`${P.boardWrite}?board=${board.id}`);

  return (
    <Screen
      figma="419:8518"
      header={
        <TopNav
          title={
            <span className={s.feedTitle}>
              <Text variant="title-3" className="truncate">
                {board.name}
              </Text>
              <Text variant="caption-2" color="tertiary" className="truncate">
                {board.sub}
              </Text>
            </span>
          }
          fallback={P.board}
          trailing={<IconButton icon="search" label={`${board.name} 검색`} onPress={() => setSearch(true)} />}
        />
      }
      overlay={
        <>
          <Fab onPress={write} />
          <BoardSearch open={search} onClose={() => setSearch(false)} scope={board.id === 'team' ? undefined : board.id} />
        </>
      }
      bottomSpace={88}
    >
      <div className={s.feedTop}>
        {board.pinned && (
          <button type="button" className={s.pinned} onClick={() => nav.push(board.pinned!.to)}>
            <Icon name="notice" size={20} />
            <span className={s.pinnedText}>
              <Text variant="micro" color="brand" className="truncate">
                {board.pinned.label}
              </Text>
              <Text variant="label" className="truncate">
                {board.pinned.title}
              </Text>
            </span>
            <Icon name="arrow-right" size={16} />
          </button>
        )}
        <div className={s.filters} role="tablist" aria-label="말머리 필터">
          {[ALL, ...board.filters].map((f) => (
            <Chip key={f} size="m" tone="neutral" selected={filter === f} onSelect={() => setFilter(f)}>
              {f}
            </Chip>
          ))}
        </div>
      </div>
      <div className={s.feedDivider} />

      {list.length ? (
        <div className={s.postList}>
          {list.map((p) => (
            <PostRow key={p.id} post={p} showBoard={board.id === 'team' && p.boardId !== 'team'} fresh={!!p.createdAt && mountedAt - p.createdAt < 15000} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={filter === ALL ? 'comment' : 'search'}
          title={filter === ALL ? '아직 글이 없어요' : `‘${filter}’ 글이 아직 없어요`}
          desc="첫 글을 남겨 대화를 시작해보세요."
          action={
            <Button variant="soft" size="m" leadingIcon="edit" onClick={write}>
              글쓰기
            </Button>
          }
        />
      )}
    </Screen>
  );
}
