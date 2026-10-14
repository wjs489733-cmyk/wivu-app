import { useEffect, useMemo, useState, type ReactNode, type RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AvatarStack, BottomSheet, Button, Card, Chip, Dialog, Icon, IconButton, ProgressBar, SearchField, StatusBar, Text, type IconName } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { USER, courseById } from '@/data/core';
import { boardById, boardLabel, RECENT_SEARCHES, tagTone, type BoardId, type Post } from './data';
import type { ApplyFlow } from './applyFlow';
import { useAllPosts, usePostStats, useRecruit } from './store';
import { LocalIcon } from './icons';
import s from './Board.module.css';

/* ── 글쓰기 FAB (Figma 'FAB · 글쓰기' — 블루 pill + --wivu-elevation-fab) ──
 * slot(제자리 위치·크기 고정) 안에서 버튼만 숨김/표시 애니메이션 → 겹침 계산은 slot 기준 */
export function Fab({ onPress, aboveTabBar, hidden, slotRef }: { onPress: () => void; aboveTabBar?: boolean; hidden?: boolean; slotRef?: RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={slotRef} className={`${s.fabSlot} ${aboveTabBar ? s.fabTab : s.fabPlain}`} data-hidden={!!hidden}>
      <button type="button" className={s.fab} onClick={onPress} tabIndex={hidden ? -1 : undefined} aria-hidden={hidden || undefined}>
        <Icon name="edit" size={20} />
        <Text variant="subhead" color="on-brand">
          글쓰기
        </Text>
      </button>
    </div>
  );
}

/** FAB를 보여도 되는지 — 본문 안 '글쓰기' 버튼(anchor)이 보이는 동안은 숨기고(첫 화면에서 아무것도 가리지 않게),
 *  그 뒤엔 [data-fab-avoid] 요소(팀플 '참여 신청' 등)와 겹칠 때만 잠깐 숨긴다. */
export function useFabVisible(scrollRef: RefObject<HTMLDivElement | null>, slotRef: RefObject<HTMLDivElement | null>, anchorRef?: RefObject<HTMLElement | null>) {
  const [shown, setShown] = useState(!anchorRef);
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      const rr = root.getBoundingClientRect();
      const a = anchorRef?.current?.getBoundingClientRect();
      if (a && a.bottom > rr.top + 4 && a.top < rr.bottom) return setShown(false);
      const f = slotRef.current?.getBoundingClientRect();
      if (!f) return;
      const M = 8;
      const hit = Array.from(root.querySelectorAll('[data-fab-avoid]')).some((el) => {
        const r = el.getBoundingClientRect();
        return r.left < f.right + M && r.right > f.left - M && r.top < f.bottom + M && r.bottom > f.top - M;
      });
      setShown(!hit);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    root.addEventListener('scroll', schedule, { passive: true });
    const ro = new ResizeObserver(schedule);
    ro.observe(root);
    return () => {
      root.removeEventListener('scroll', schedule);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [scrollRef, slotRef, anchorRef]);
  return shown;
}

export function TagChip({ tag }: { tag: string }) {
  return <Chip tone={tagTone(tag)}>{tag}</Chip>;
}

/* ── ♥ n · 💬 n ───────────────────────────────────────────────── */
export function Counts({ post, file }: { post: Post; file?: boolean }) {
  const { likeCount, liked, commentCount } = usePostStats(post);
  return (
    <span className={s.counts}>
      {file && <Icon name="file" size={16} color="primary" label="첨부파일" />}
      <span className={s.count} aria-label={`공감 ${likeCount}`}>
        <span className={s.heart}>
          <LocalIcon name={liked || likeCount > 0 ? 'heart-fill' : 'heart'} size={16} />
        </span>
        <Text variant="caption-2-strong" color="secondary" tnum>
          {likeCount}
        </Text>
      </span>
      <span className={s.count} aria-label={`댓글 ${commentCount}`}>
        <span className={s.commentIcon}>
          <Icon name="comment" size={16} />
        </span>
        <Text variant="caption-2-strong" color="brand" tnum>
          {commentCount}
        </Text>
      </span>
    </span>
  );
}

const excerptOf = (p: Post) => p.excerpt ?? p.body.split('\n').find(Boolean) ?? '';

/* ── 피드 글 행 (419:8518 post) ────────────────────────────── */
export function PostRow({ post, showBoard, fresh, highlight }: { post: Post; showBoard?: boolean; fresh?: boolean; highlight?: string }) {
  const nav = useNav();
  const meta = [showBoard && boardLabel(post.boardId), post.author, post.time].filter(Boolean).join(' · ');
  return (
    <button type="button" className={s.postRow} data-fresh={fresh} onClick={() => nav.push(P.boardPost(post.id))}>
      <span className={s.postTitleRow}>
        <TagChip tag={post.tag} />
        <Text variant="subhead" className="truncate">
          <Highlight text={post.title} q={highlight} />
        </Text>
      </span>
      <Text variant="caption-1" color="secondary" className="truncate" as="span" style={{ display: 'block' }}>
        <Highlight text={excerptOf(post)} q={highlight} />
      </Text>
      <span className={s.metaRow}>
        <Text variant="caption-2" color="tertiary" className="truncate">
          {meta}
        </Text>
        <Counts post={post} file={!!post.files?.length} />
      </span>
    </button>
  );
}

/* ── 인기글 카드 행 (418:8600 post) ────────────────────────── */
export function CompactRow({ post }: { post: Post }) {
  const nav = useNav();
  return (
    <button type="button" className={s.compactRow} onClick={() => nav.push(P.boardPost(post.id))}>
      <Text variant="subhead" className="truncate" style={{ display: 'block' }}>
        {post.title}
      </Text>
      <span className={s.metaRow} style={{ marginTop: 0 }}>
        <Text variant="caption-2" color="secondary" className="truncate">
          {boardLabel(post.boardId)} · {post.time}
        </Text>
        <Counts post={post} />
      </span>
    </button>
  );
}

function Highlight({ text, q }: { text: string; q?: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className={s.hit}>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export function EmptyState({ icon = 'comment', title, desc, action }: { icon?: IconName; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className={s.empty}>
      <span className={s.emptyIcon}>
        <Icon name={icon} size={24} />
      </span>
      <Text variant="headline" as="p">
        {title}
      </Text>
      {desc && (
        <Text variant="callout" color="secondary" as="p">
          {desc}
        </Text>
      )}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

export function AuthorAvatar({ brand, size = 'm' }: { brand?: boolean; size?: 's' | 'm' }) {
  return (
    <span className={s.authorAvatar} data-tone={brand ? 'brand' : undefined} data-size={size} aria-hidden>
      <Icon name="user" size={size === 's' ? 16 : 20} />
    </span>
  );
}

/* ── 검색 오버레이 (Figma 검색 아이콘은 Pressed 상태만 → 같은 라우트 안 상태로 구현) ── */
export function BoardSearch({ open, onClose, scope }: { open: boolean; onClose: () => void; scope?: BoardId }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className={s.searchLayer} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2 }} role="dialog" aria-label="게시판 검색">
          <SearchPanel onClose={onClose} scope={scope} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SearchPanel({ onClose, scope }: { onClose: () => void; scope?: BoardId }) {
  const posts = useAllPosts();
  const [q, setQ] = useState('');
  const term = q.trim();
  const results = useMemo(() => {
    if (!term) return [];
    const t = term.toLowerCase();
    return posts.filter((p) => p.boardId !== 'guide' && (!scope || p.boardId === scope) && (p.title.toLowerCase().includes(t) || p.body.toLowerCase().includes(t) || p.tag === term));
  }, [posts, term, scope]);
  const scopeName = scope ? boardLabel(scope) : null;

  return (
    <>
      <StatusBar />
      <div className={s.searchBar}>
        <SearchField value={q} onChange={setQ} placeholder={scopeName ? `${scopeName}에서 검색` : '게시판 전체에서 검색'} autoFocus />
        <button type="button" className={`${s.searchCancel} t-label`} onClick={onClose}>
          취소
        </button>
      </div>
      <div className={s.searchBody}>
        {!term ? (
          <div className={s.searchSection}>
            <Text variant="caption-1-strong" color="secondary" as="p">
              최근 검색어
            </Text>
            <div className={s.chipWrap}>
              {RECENT_SEARCHES.map((r) => (
                <Chip key={r} tone="outline" size="m" onSelect={() => setQ(r)}>
                  {r}
                </Chip>
              ))}
            </div>
          </div>
        ) : results.length ? (
          <>
            <Text variant="caption-1" color="tertiary" as="p" style={{ padding: '12px 20px 0' }}>
              검색 결과 {results.length}개
            </Text>
            <div className={s.postList}>
              {results.map((p) => (
                <PostRow key={p.id} post={p} showBoard={!scope} highlight={term} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState icon="search" title="검색 결과가 없어요" desc={`‘${term}’이(가) 들어간 글을 찾지 못했어요. 다른 단어로 검색해보세요.`} />
        )}
      </div>
    </>
  );
}

/** 팀플 모집 현황 + 신청 버튼 (탭 루트 카드 · 상세 공용) */
export function RecruitFoot({ post, onApply }: { post: Post; onApply: (p: Post) => void }) {
  const { applied, current, max, full } = useRecruit(post);
  const names = useMemo(() => [...Array.from({ length: Math.min(current - (applied ? 1 : 0), 3) }, (_, i) => `팀원${i + 1}`), ...(applied ? [USER.initial] : [])], [current, applied]);
  return (
    <div className={s.teamFoot} data-fab-avoid>
      <span className={s.teamAvatars}>
        <AvatarStack names={names} size={24} />
      </span>
      <Text variant="caption-1-strong" tnum style={{ flex: 1 }}>
        {current} / {max}명 참여
      </Text>
      {applied ? (
        <Button
          variant="outline"
          size="s"
          leadingIcon="check"
          onClick={(e) => {
            e.stopPropagation();
            onApply(post);
          }}
        >
          신청 완료
        </Button>
      ) : (
        <Button
          variant="dark"
          size="s"
          disabled={full}
          onClick={(e) => {
            e.stopPropagation();
            onApply(post);
          }}
        >
          {full ? '모집 완료' : '참여 신청'}
        </Button>
      )}
    </div>
  );
}

/** 팀플 참여 신청 시트 + 취소 확인 (Screen overlay에 둔다) */
export function ApplyOverlay({ flow }: { flow: ApplyFlow }) {
  return (
    <>
      <BottomSheet open={flow.sheet} onClose={flow.closeSheet} label="팀플 참여 신청">
        {flow.target && <ApplySheetBody post={flow.target} note={flow.note} setNote={flow.setNote} loading={flow.loading} onConfirm={flow.confirm} onClose={flow.closeSheet} />}
      </BottomSheet>
      <Dialog
        open={flow.cancel}
        title="참여 신청을 취소할까요?"
        message="작성자에게 보낸 신청이 함께 취소돼요."
        confirmLabel="신청 취소"
        cancelLabel="유지"
        destructive
        onCancel={flow.closeCancel}
        onConfirm={flow.confirmCancel}
      />
    </>
  );
}

function ApplySheetBody({ post, note, setNote, loading, onConfirm, onClose }: { post: Post; note: string; setNote: (v: string) => void; loading: boolean; onConfirm: () => void; onClose: () => void }) {
  // 시트는 신청 전에만 열린다 → 시드 인원 기준 (닫히는 애니메이션 중 숫자가 바뀌지 않게)
  const r = post.recruit!;
  const current = r.current;
  const max = r.max;
  const label = r.courseId ? courseById(r.courseId).name : boardById(post.boardId).name;
  return (
    <>
      <div className={s.sheetHead}>
        <Text variant="title-2" as="h2">
          팀플 참여 신청
        </Text>
        <IconButton icon="close" label="닫기" onPress={onClose} />
      </div>
      <Card variant="pulse" className={s.applySummary}>
        <div className={s.teamHead}>
          <Chip tone="white" className={s.pulseChip}>
            {label}
          </Chip>
          {r.deadline && (
            <Text variant="caption-2-strong" color="error">
              {r.deadline}
            </Text>
          )}
        </div>
        <Text variant="headline" as="p">
          {post.title}
        </Text>
        <Text variant="caption-1" color="secondary" as="p">
          {r.note}
        </Text>
        <div className={s.applyCount}>
          <Text variant="caption-1-strong" tnum>
            현재 {current} / {max}명
          </Text>
          <Text variant="caption-2" color="secondary">
            신청하면 {current + 1}명이 돼요
          </Text>
        </div>
        <ProgressBar value={(current / max) * 100} tone="pulse" />
      </Card>
      <input className={`${s.noteField} t-body`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={40} placeholder="작성자에게 한마디 (선택) · 예) 인터뷰 진행해봤어요!" aria-label="작성자에게 한마디" />
      <div className={s.notice}>
        <Icon name="lock" size={16} />
        <Text variant="caption-1" color="tertiary" as="p">
          신청하면 작성자에게 학과·학년({USER.department} {USER.year}학년)만 공개돼요. 수락되면 알림으로 알려드릴게요.
        </Text>
      </div>
      <Button block loading={loading} onClick={onConfirm}>
        참여 신청하기
      </Button>
    </>
  );
}
