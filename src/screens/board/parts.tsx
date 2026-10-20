import { useEffect, useMemo, useState, type MouseEvent, type ReactNode, type RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BottomSheet, Button, Card, Chip, Dialog, Icon, SheetHead, StatusBar, Text, TextField } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { USER, courseById } from '@/data/core';
import { boardById, boardLabel, boardTitle, tagTone, type BoardId, type Post } from './data';
import type { ApplyFlow } from './applyFlow';
import { useAllPosts, useBoard, usePostStats, useRecruit } from './store';
import s from './Board.module.css';

/* ── 글쓰기 FAB (v5 'FAB · 글쓰기' = Button Primary M + edit) ──
 * slot(제자리 위치 고정) 안에서 버튼만 숨김/표시 → 겹침 계산은 slot 기준 */
export function Fab({ onPress, aboveTabBar, hidden, slotRef }: { onPress: () => void; aboveTabBar?: boolean; hidden?: boolean; slotRef?: RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={slotRef} className={`${s.fabSlot} ${aboveTabBar ? s.fabTab : s.fabPlain}`} data-hidden={!!hidden}>
      <Button size="m" leadingIcon="edit" onClick={onPress} tabIndex={hidden ? -1 : undefined} aria-hidden={hidden || undefined}>
        글쓰기
      </Button>
    </div>
  );
}

/** FAB가 [data-fab-avoid] 요소(팀플 카드 '참여 신청' 줄)와 겹치는 동안만 잠깐 숨긴다 */
export function useFabVisible(scrollRef: RefObject<HTMLDivElement | null>, slotRef: RefObject<HTMLDivElement | null>) {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      const f = slotRef.current?.getBoundingClientRect();
      if (!f) return;
      const rr = root.getBoundingClientRect();
      const M = 8;
      const hit = Array.from(root.querySelectorAll('[data-fab-avoid]')).some((el) => {
        const r = el.getBoundingClientRect();
        // 탭바 뒤로 가려진 부분은 겹침으로 치지 않는다
        const bottom = Math.min(r.bottom, rr.bottom);
        return r.left < f.right + M && r.right > f.left - M && r.top < f.bottom + M && bottom > f.top - M && r.top < rr.bottom;
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
  }, [scrollRef, slotRef]);
  return shown;
}

/** 말머리 배지 (v5 Badge) */
export function TagChip({ tag }: { tag: string }) {
  return <Chip tone={tagTone(tag)}>{tag}</Chip>;
}

const excerptOf = (p: Post) => p.excerpt ?? p.body.split('\n').find(Boolean) ?? '';

/* ── 피드 글 행 (687:6661 post) ───────────────────────────────
 * 제목 Body 1 Strong · 미리보기 Body 3 secondary · 메타 Caption 2 tertiary ('익명 · 12분 전 · 공감 4 · 댓글 6' / 모집 글은 '모집 2/4 · 오늘 마감') */
export function PostRow({ post, showBoard, fresh, highlight, onOpen }: { post: Post; showBoard?: boolean; fresh?: boolean; highlight?: string; onOpen?: () => void }) {
  const nav = useNav();
  const { likeCount, commentCount } = usePostStats(post);
  const { current, max } = useRecruit(post);
  const tail = post.recruit ? [`모집 ${current}/${max}`, post.recruit.deadline] : [`공감 ${likeCount}`, `댓글 ${commentCount}`];
  const meta = [showBoard && boardLabel(post.boardId), post.author, post.time, ...tail].filter(Boolean).join(' · ');
  return (
    <button
      type="button"
      className={s.postRow}
      data-fresh={fresh}
      onClick={() => {
        onOpen?.();
        nav.push(P.boardPost(post.id));
      }}
    >
      <span className={s.postTitle}>
        <TagChip tag={post.tag} />
        <Text variant="body-1-strong" className="truncate">
          <Highlight text={post.title} q={highlight} />
        </Text>
      </span>
      <Text variant="body-3" color="secondary" className="truncate" as="span" style={{ display: 'block' }}>
        <Highlight text={excerptOf(post)} q={highlight} />
      </Text>
      <Text variant="caption-2" color="tertiary" className="truncate" as="span" style={{ display: 'block' }} tnum>
        {meta}
      </Text>
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

/** 빈 상태 — v5: 아이콘 없이 텍스트 + 기본 버튼 */
export function EmptyState({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className={s.empty}>
      <Text variant="title-3" as="p">
        {title}
      </Text>
      {desc && (
        <Text variant="body-3" color="secondary" as="p">
          {desc}
        </Text>
      )}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

/* ── 검색 레이어 (699:8103 '게시판 탭 · 검색') — 같은 라우트 안 전체 화면 레이어 ── */
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
  const recent = useBoard((st) => st.recent);
  const pushRecent = useBoard((st) => st.pushRecent);
  const removeRecent = useBoard((st) => st.removeRecent);
  const [q, setQ] = useState('');
  const term = q.trim();
  const results = useMemo(() => {
    if (!term) return [];
    const t = term.toLowerCase();
    return posts.filter((p) => p.boardId !== 'guide' && (!scope || p.boardId === scope) && (p.title.toLowerCase().includes(t) || p.body.toLowerCase().includes(t) || p.tag === term));
  }, [posts, term, scope]);
  const scopeName = scope ? boardLabel(scope) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <StatusBar />
      <div className={s.searchBar}>
        <TextField
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onClear={() => setQ('')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing && term) pushRecent(term);
          }}
          placeholder={scopeName ? `${scopeName}에서 검색` : '게시판 전체에서 검색'}
          aria-label="게시판 검색어"
          enterKeyHint="search"
          autoFocus
        />
        <button type="button" className={`${s.searchCancel} t-body-2`} onClick={onClose}>
          취소
        </button>
      </div>
      <div className={s.searchBody}>
        {!term ? (
          <>
            <Text variant="body-3-strong" color="secondary" as="p" className={s.recentHead}>
              최근 검색어
            </Text>
            {recent.length ? (
              recent.map((r) => (
                <div key={r} className={s.recentRow}>
                  <button type="button" onClick={() => setQ(r)}>
                    <Icon name="clock" size={20} />
                    <Text variant="body-2" className="truncate">
                      {r}
                    </Text>
                  </button>
                  <button type="button" className={s.recentRemove} aria-label={`최근 검색어 ${r} 삭제`} onClick={() => removeRecent(r)}>
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ))
            ) : (
              <Text variant="body-3" color="tertiary" as="p" style={{ padding: '12px 20px' }}>
                최근 검색어가 없어요
              </Text>
            )}
          </>
        ) : results.length ? (
          <>
            <Text variant="caption-1" color="tertiary" as="p" className={s.resultCount}>
              검색 결과 {results.length}개
            </Text>
            <div className={s.postList}>
              {results.map((p) => (
                <PostRow key={p.id} post={p} showBoard={!scope} highlight={term} onOpen={() => pushRecent(term)} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState title="검색 결과가 없어요" desc={`‘${term}’이(가) 들어간 글을 찾지 못했어요. 다른 단어로 검색해보세요.`} />
        )}
      </div>
    </>
  );
}

/* ── 팀플 모집 현황 줄 + 신청 버튼 (탭 루트 카드 · 상세 공용) ──
 * 신청 전: '현재 3 / 5명 · 금 15:00 수업' + Primary S '참여 신청'
 * 신청 후(699:7595): '현재 4 / 5명 · …' + Secondary S ✓ '신청 완료' → 누르면 취소 확인(699:7948) */
export function RecruitRow({ post, onApply }: { post: Post; onApply: (p: Post) => void }) {
  const { applied, current, max, full } = useRecruit(post);
  const when = post.recruit?.when;
  const press = (e: MouseEvent) => {
    e.stopPropagation();
    onApply(post);
  };
  return (
    <div className={s.recruitRow} data-fab-avoid>
      <Text variant="caption-1" color="secondary" className="truncate" tnum>
        현재 {current} / {max}명{when ? ` · ${when}` : ''}
      </Text>
      {applied ? (
        <Button variant="secondary" size="s" leadingIcon="check" onClick={press}>
          신청 완료
        </Button>
      ) : (
        <Button size="s" disabled={full} onClick={press}>
          {full ? '모집 완료' : '참여 신청'}
        </Button>
      )}
    </div>
  );
}

/** 탭 루트 '모집 중인 팀플' 카드 (687:6491) */
export function RecruitCard({ post, onApply }: { post: Post; onApply: (p: Post) => void }) {
  const nav = useNav();
  const r = post.recruit!;
  const where = r.courseId ? boardTitle(boardById(r.courseId)) : boardById(post.boardId).name;
  return (
    <Card variant="outline" className={s.teamCard} onPress={() => nav.push(P.boardPost(post.id))} aria-label={`${post.title} 모집 글 보기`}>
      <div className={s.teamTop}>
        {r.deadline && <Chip tone="warningSoft">{r.deadline}</Chip>}
        <Text variant="caption-1" color="tertiary" className="truncate">
          {where}
        </Text>
      </div>
      <Text variant="body-1-strong" as="p">
        {post.title}
      </Text>
      <RecruitRow post={post} onApply={onApply} />
    </Card>
  );
}

/** 팀플 참여 신청 시트(699:7758) + 취소 확인(699:7948) — Screen overlay에 둔다 */
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
  const { current, max } = r;
  const label = r.courseId ? courseById(r.courseId).name : boardById(post.boardId).name;
  return (
    <>
      <SheetHead title="팀플 참여 신청" onClose={onClose} />
      <div className={s.applySummary}>
        <div className={s.teamTop}>
          <Chip tone="neutral">{label}</Chip>
          {r.deadline && <Chip tone="warningSoft">{r.deadline}</Chip>}
        </div>
        <Text variant="body-1-strong" as="p">
          {post.title}
        </Text>
        <Text variant="caption-1" color="secondary" as="p">
          {r.note}
        </Text>
      </div>
      <div className={s.members}>
        <Text variant="body-3-strong" tnum>
          현재 {current} / {max}명
        </Text>
        <Text variant="caption-1-strong" color="brand" tnum>
          신청하면 {current + 1}명이 돼요
        </Text>
      </div>
      <div className={s.seats} role="img" aria-label={`${max}자리 중 ${current}자리 참여, 신청하면 ${current + 1}자리`}>
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={s.seat} data-state={i < current ? 'filled' : i === current ? 'mine' : undefined} />
        ))}
      </div>
      <textarea className={`${s.memo} t-body-2`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={40} placeholder="작성자에게 한마디 (선택) · 예) 인터뷰 진행해봤어요!" aria-label="작성자에게 한마디" />
      <Text variant="caption-1" color="tertiary" as="p" className={s.applyNote}>
        신청하면 작성자에게 학과·학년({USER.department} {USER.year}학년)만 공개돼요. 수락되면 알림으로 알려드릴게요.
      </Text>
      <div className={s.sheetCta}>
        <Button block loading={loading} onClick={onConfirm}>
          참여 신청하기
        </Button>
      </div>
    </>
  );
}

/** SheetAction과 같은 모양 — 공통 SheetAction은 세트 아이콘만 받아서 로컬 아이콘(link) 행만 여기서 그린다 (공통화 후보) */
export function LocalSheetAction({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
  return (
    <button type="button" className={s.localAction} onClick={onPress}>
      {icon}
      <Text variant="body-2" style={{ flex: 1, minWidth: 0 }}>
        {label}
      </Text>
    </button>
  );
}
