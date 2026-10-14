import { useRef, useState } from 'react';
import { Button, Card, Chip, Icon, IconButton, LargeHeader, ListGroup, Screen, Section, SectionDivider, TabBar, Text, Tile } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useHasUnread } from '@/app/useUnread';
import { useApp } from '@/store/app';
import { courseById } from '@/data/core';
import { CAMPUS_BOARDS, MY_COURSE_CARDS, POPULAR, TEAM_FEATURED } from './data';
import { useAllPosts, useBoard } from './store';
import { BoardSearch, CompactRow, Fab, RecruitFoot, ApplyOverlay, useFabVisible } from './parts';
import { useApplyFlow } from './applyFlow';
import s from './Board.module.css';

/**
 * 게시판 탭 루트 — Figma 418:8600 (Board_v4_01_Root)
 * 검색은 같은 라우트 안 오버레이, 팀플 '참여 신청'은 확인 시트 → 신청 완료 상태로 이어진다.
 * 글쓰기: 첫 화면은 상단 인증 칩 옆 본문 버튼(FAB가 팀플 카드 '참여 신청'을 가리던 문제) →
 *   그 버튼이 스크롤로 사라지면 FAB 등장, '참여 신청'과 겹치는 동안엔 FAB를 잠깐 숨김.
 */
const FAB_SPACE = 24 + 48 + 16; // 마지막 글이 FAB 위로 올라올 수 있게 하단 여백
export function BoardRoot() {
  const nav = useNav();
  const school = useApp((st) => st.selectedSchool);
  const seen = useBoard((st) => st.seen);
  const posts = useAllPosts();
  const apply = useApplyFlow();
  const unread = useHasUnread();
  const [search, setSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fabSlot = useRef<HTMLDivElement>(null);
  const writeAnchor = useRef<HTMLDivElement>(null);
  const fabShown = useFabVisible(scrollRef, fabSlot, writeAnchor);
  const write = () => nav.modal(P.boardWrite);

  const team = posts.find((p) => p.id === TEAM_FEATURED);
  const popular = POPULAR.map((id) => posts.find((p) => p.id === id)).filter((p) => p !== undefined);

  return (
    <Screen
      figma="418:8600"
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
      <div className={`${s.verified} ${s.verifiedRow}`}>
        <Chip tone="brand" pill icon="check">
          {school} 재학생 인증 게시판
        </Chip>
        <div ref={writeAnchor}>
          <Button variant="soft" size="s" leadingIcon="edit" onClick={write}>
            글쓰기
          </Button>
        </div>
      </div>

      <div className={s.rootSections}>
        <Section title="내 수업 게시판" aside="수강 과목에 자동 참여" padded={false}>
          <div className={s.courseRail}>
            {MY_COURSE_CARDS.map((c) => {
              const course = courseById(c.id);
              const fresh = !!c.hot;
              return (
                <button key={c.id} type="button" className={s.courseCard} data-new={fresh} onClick={() => nav.push(P.boardCourse(c.id))}>
                  <span className={s.courseIcon}>
                    <Icon name="board" size={20} />
                  </span>
                  <Text variant="subhead" className="truncate" style={{ maxWidth: '100%' }}>
                    {course.name}
                  </Text>
                  <span className={s.courseMeta}>
                    <Text variant="caption-2-strong" color={fresh ? 'brand' : 'tertiary'} tnum style={{ flexShrink: 0 }}>
                      새 글 {c.newCount}
                    </Text>
                    {c.summary && (
                      <Text variant="caption-2" color="secondary" className="truncate">
                        {c.summary}
                      </Text>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        <SectionDivider />
        <Section title="전체 게시판">
          <div className={s.boardGrid}>
            {CAMPUS_BOARDS.map((b) => (
              <Tile key={b.id} variant="outline" icon={b.icon} label={b.name} dot={b.dot && !seen.includes(b.id)} onPress={() => nav.push(P.boardCourse(b.id))} />
            ))}
          </div>
        </Section>

        {team && (
          <>
            <SectionDivider />
            <Section title="팀플 모집 중" more="전체 보기" onMore={() => nav.push(`${P.boardCourse('team')}?filter=${encodeURIComponent('모집 중')}`)}>
              <Card variant="pulse" className={s.teamCard} onPress={() => nav.push(P.boardPost(team.id))} aria-label={`${team.title} 모집 글 보기`}>
                <div className={s.teamHead}>
                  <Chip tone="white" className={s.pulseChip}>
                    {team.recruit?.courseId ? courseById(team.recruit.courseId).name : '팀플·스터디'}
                  </Chip>
                  <Text variant="caption-2-strong" color="error">
                    {team.recruit?.deadline}
                  </Text>
                </div>
                <Text variant="headline" as="p">
                  {team.title}
                </Text>
                <Text variant="caption-1" color="secondary" as="p" className="truncate">
                  {team.recruit?.note}
                </Text>
                <RecruitFoot post={team} onApply={apply.request} />
              </Card>
            </Section>
          </>
        )}

        <SectionDivider />
        <Section
          title={
            <span className={s.hotTitle}>
              실시간 인기글
              <Chip tone="danger">HOT</Chip>
            </span>
          }
        >
          <ListGroup>
            {popular.map((p) => (
              <CompactRow key={p.id} post={p} />
            ))}
          </ListGroup>
        </Section>
      </div>
    </Screen>
  );
}
