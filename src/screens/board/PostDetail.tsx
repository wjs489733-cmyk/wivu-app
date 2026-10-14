import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { BottomSheet, Button, Card, Chip, Dialog, Icon, IconButton, OptionRow, Row, Screen, Text, TopNav, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { USER } from '@/data/core';
import { boardById, boardTitle, REPORT_REASONS, verifiedLabel, type Comment, type Post } from './data';
import { useBoard, usePost, usePostStats, useThread } from './store';
import { AuthorAvatar, EmptyState, RecruitFoot, TagChip, ApplyOverlay } from './parts';
import { useApplyFlow } from './applyFlow';
import { LocalIcon, type LocalIconName } from './icons';
import s from './Board.module.css';

/**
 * 게시글 상세 — Figma 420:8564 (Board_v4_03_PostDetail)
 * 공감·스크랩 토글, 댓글/답글 등록(익명 체크), ··· 메뉴(신고·차단 / 내 글은 수정·삭제)
 */
export function PostDetail() {
  const { pid } = useParams();
  const nav = useNav();
  const post = usePost(pid);

  if (!post) {
    return (
      <Screen figma="420:8564" header={<TopNav title="게시글" fallback={P.board} />}>
        <EmptyState
          icon="warning"
          title="볼 수 없는 글이에요"
          desc="삭제되었거나 차단한 사용자의 글이에요."
          action={
            <Button variant="soft" size="m" onClick={() => nav.back(P.board)}>
              게시판으로
            </Button>
          }
        />
      </Screen>
    );
  }
  return <PostView key={post.id} post={post} />;
}

function PostView({ post }: { post: Post }) {
  const nav = useNav();
  const board = boardById(post.boardId);
  const back = board.kind === 'system' ? P.board : P.boardCourse(board.id);
  const stats = usePostStats(post);
  const { comments } = useThread(post);
  const toggleLike = useBoard((st) => st.toggleLike);
  const toggleScrap = useBoard((st) => st.toggleScrap);
  const addComment = useBoard((st) => st.addComment);
  const hide = useBoard((st) => st.hide);
  const likedMap = useBoard((st) => st.liked);
  const apply = useApplyFlow();

  const [sheet, setSheet] = useState<null | 'menu' | 'report'>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [dialog, setDialog] = useState<null | 'block' | 'delete'>(null);
  const [showOlder, setShowOlder] = useState(false);
  const [text, setText] = useState('');
  const [anon, setAnon] = useState(true);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const [pop, setPop] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);

  const older = comments.filter((c) => c.id.includes('-f'));
  const visible = showOlder ? comments : comments.filter((c) => !c.id.includes('-f'));

  // 새 댓글로 스크롤
  useEffect(() => {
    if (!fresh) return;
    const el = document.getElementById(`comment-${fresh}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const t = setTimeout(() => setFresh(null), 1900);
    return () => clearTimeout(t);
  }, [fresh]);

  const myAnonName = () => {
    const mine = comments.find((c) => c.mine && /^익명\d+$/.test(c.author));
    if (mine) return mine.author;
    const used = new Set(comments.map((c) => c.author).filter((a) => /^익명\d+$/.test(a)));
    return `익명${used.size + 1}`;
  };

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    const author = post.mine ? '작성자' : anon ? myAnonName() : USER.name;
    const c = addComment(post.id, {
      author,
      time: '방금',
      body,
      likes: 0,
      parent: replyTo ? (replyTo.parent ?? replyTo.id) : undefined,
      mine: true,
      isAuthor: !!post.mine,
    });
    setText('');
    setReplyTo(null);
    setFresh(c.id);
    inputRef.current?.blur();
    toast(replyTo ? '답글을 등록했어요' : '댓글을 등록했어요', 'check');
  };

  const like = () => {
    const on = toggleLike(post.id, !!post.likedByMe);
    if (on) setPop((n) => n + 1);
  };

  const scrap = () => {
    const on = toggleScrap(post.id);
    toast(on ? '스크랩했어요' : '스크랩을 취소했어요', on ? 'bookmark' : undefined);
  };

  const copyLink = () => {
    setSheet(null);
    try {
      void navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
    } catch {
      /* 클립보드 권한이 없어도 프로토타입에선 성공처럼 */
    }
    toast('링크를 복사했어요', 'check');
  };

  const leaveAndHide = (message: string) => {
    setDialog(null);
    nav.back(back);
    toast(message, 'check');
    setTimeout(() => hide(post.id), 380);
  };

  const official = board.kind === 'system';
  const images = post.files?.filter((f) => f.kind === 'image' && f.url) ?? [];
  const docs = post.files?.filter((f) => !(f.kind === 'image' && f.url)) ?? [];

  return (
    <Screen
      figma="420:8564"
      header={<TopNav title={boardTitle(board)} fallback={back} trailing={<IconButton icon="more" label="더보기" onPress={() => setSheet('menu')} />} />}
      footer={
        <div className={s.inputBar}>
          {replyTo && (
            <div className={s.replyTo}>
              <LocalIcon name="reply" size={16} />
              <Text variant="caption-1-strong" color="brand" className="truncate">
                {replyTo.author}님에게 답글 남기는 중
              </Text>
              <button type="button" className={s.replyClose} aria-label="답글 취소" onClick={() => setReplyTo(null)}>
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          <div className={s.inputRow}>
            {!post.mine && (
              <button type="button" role="checkbox" aria-checked={anon} className={s.anon} onClick={() => setAnon((v) => !v)}>
                <span className={s.anonBox}>{anon && <Icon name="check" size={16} />}</span>
                <Text variant="caption-1-strong" color="inherit">
                  익명
                </Text>
              </button>
            )}
            <input
              ref={inputRef}
              className={`${s.commentField} t-callout`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={replyTo ? '답글을 입력하세요' : '댓글을 입력하세요'}
              aria-label="댓글 입력"
              maxLength={300}
              enterKeyHint="send"
            />
            <Button size="s" disabled={!text.trim()} onClick={submit}>
              등록
            </Button>
          </div>
        </div>
      }
      overlay={
        <>
          <ApplyOverlay flow={apply} />
          <BottomSheet open={sheet === 'menu'} onClose={() => setSheet(null)} label="글 메뉴">
            <div className={s.sheetActions}>
              <SheetAction icon="link" label="링크 복사" onPress={copyLink} />
              {post.mine ? (
                <>
                  <SheetAction
                    icon="edit"
                    label="수정하기"
                    onPress={() => {
                      setSheet(null);
                      toast('글 수정은 다음 버전에서 열려요');
                    }}
                  />
                  <SheetAction
                    icon="close"
                    label="삭제하기"
                    danger
                    onPress={() => {
                      setSheet(null);
                      setDialog('delete');
                    }}
                  />
                </>
              ) : (
                !official && (
                  <>
                    <SheetAction
                      icon="warning"
                      label="신고하기"
                      onPress={() => {
                        setReason(null);
                        setSheet('report');
                      }}
                    />
                    <SheetAction
                      icon="block"
                      label="이 사용자 차단하기"
                      danger
                      onPress={() => {
                        setSheet(null);
                        setDialog('block');
                      }}
                    />
                  </>
                )
              )}
            </div>
          </BottomSheet>
          <BottomSheet open={sheet === 'report'} onClose={() => setSheet(null)} label="신고하기">
            <div className={s.sheetHead}>
              <Text variant="title-2" as="h2">
                신고 사유를 선택해주세요
              </Text>
              <IconButton icon="close" label="닫기" onPress={() => setSheet(null)} />
            </div>
            <Text variant="caption-1" color="secondary" as="p" style={{ marginBottom: 16 }}>
              신고한 내용은 작성자에게 알려지지 않아요. 검토 후 운영 원칙에 따라 조치해요.
            </Text>
            <div className={s.reasonList}>
              {REPORT_REASONS.map((r) => (
                <OptionRow key={r} title={r} selected={reason === r} onPress={() => setReason(r)} />
              ))}
            </div>
            <Button
              block
              disabled={!reason}
              onClick={() => {
                setSheet(null);
                toast('신고가 접수됐어요. 검토 후 조치할게요', 'check');
              }}
            >
              신고하기
            </Button>
          </BottomSheet>
          <Dialog
            open={dialog === 'block'}
            title="이 사용자를 차단할까요?"
            message="차단하면 이 사용자의 글과 댓글이 더 이상 보이지 않아요."
            confirmLabel="차단"
            destructive
            onCancel={() => setDialog(null)}
            onConfirm={() => leaveAndHide('차단했어요')}
          />
          <Dialog
            open={dialog === 'delete'}
            title="글을 삭제할까요?"
            message="삭제한 글은 되돌릴 수 없어요."
            confirmLabel="삭제"
            destructive
            onCancel={() => setDialog(null)}
            onConfirm={() => leaveAndHide('글을 삭제했어요')}
          />
        </>
      }
    >
      <article className={s.detail}>
        <div className={s.detailChips}>
          <TagChip tag={post.tag} />
          {post.linked && (
            <button type="button" className={s.linkChip} onClick={() => nav.push(P.assignment(post.linked!.courseId, post.linked!.aid))}>
              <Icon name="assignment" size={16} />
              <Text variant="caption-2-strong" color="inherit" className="truncate">
                연결된 과제 · {post.linked.title}
              </Text>
              <Icon name="chevron-right" size={16} />
            </button>
          )}
        </div>

        <Text variant="title-1" as="h2">
          {post.title}
        </Text>

        <div className={s.author}>
          <AuthorAvatar brand={official} />
          <div style={{ minWidth: 0 }}>
            <Row gap={8}>
              <Text variant="label">{post.author}</Text>
              {post.mine && <Chip tone="neutral">내 글</Chip>}
            </Row>
            <Text variant="caption-2" color="tertiary" as="p" tnum>
              {post.time} · 조회 {post.views} · {official ? '운영팀' : verifiedLabel(board)}
            </Text>
          </div>
        </div>

        <Text variant="body" as="p" className={s.body}>
          {post.body}
        </Text>

        {images.length > 0 && (
          <div className={s.imageGrid} data-count={images.length}>
            {images.map((f) => (
              <img key={f.url} src={f.url} alt={f.name} />
            ))}
          </div>
        )}
        {docs.map((f) => (
          <button key={f.name} type="button" className={s.fileCard} onClick={() => toast(`${f.name} 저장했어요`, 'download')}>
            <span className={s.fileIcon}>
              <Icon name="file" size={20} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <Text variant="label" as="p" className="truncate">
                {f.name}
              </Text>
              <Text variant="caption-2" color="tertiary" as="p">
                {f.kind === 'pdf' ? 'PDF' : '파일'} · {f.size}
              </Text>
            </span>
            <Icon name="download" size={20} color="secondary" />
          </button>
        ))}

        {post.recruit && (
          <Card variant="pulse" className={s.recruitBox}>
            <div className={s.teamHead}>
              <Text variant="caption-1-strong">팀원 모집</Text>
              {post.recruit.deadline && (
                <Text variant="caption-2-strong" color="error">
                  {post.recruit.deadline}
                </Text>
              )}
            </div>
            <Text variant="caption-1" color="secondary" as="p">
              {post.recruit.note}
            </Text>
            <RecruitFoot post={post} onApply={apply.request} />
          </Card>
        )}

        <div className={s.reactions}>
          <button type="button" className={`${s.reaction} t-caption-1-strong`} aria-pressed={stats.liked} onClick={like}>
            <span key={pop} className={pop ? s.pop : undefined} style={{ display: 'inline-flex' }}>
              <LocalIcon name={stats.liked ? 'heart-fill' : 'heart'} size={16} />
            </span>
            공감 {stats.likeCount}
          </button>
          <button
            type="button"
            className={`${s.reaction} t-caption-1-strong`}
            aria-pressed={false}
            onClick={() => {
              commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              setTimeout(() => inputRef.current?.focus(), 250);
            }}
          >
            <Icon name="comment" size={16} />
            댓글 {stats.commentCount}
          </button>
          <button type="button" className={`${s.reaction} t-caption-1-strong`} aria-pressed={stats.scrapped} onClick={scrap}>
            {stats.scrapped ? <LocalIcon name="bookmark-fill" size={16} /> : <Icon name="bookmark" size={16} />}
            스크랩
          </button>
        </div>

        <div ref={commentsRef} className={s.comments} style={{ scrollMarginTop: 16 }}>
          <Text variant="subhead" as="h3">
            댓글 {stats.commentCount}
          </Text>
          {older.length > 0 && !showOlder && (
            <button type="button" className={`${s.moreComments} t-caption-1-strong`} onClick={() => setShowOlder(true)}>
              이전 댓글 {older.length}개 보기
              <Icon name="chevron-down" size={16} />
            </button>
          )}
          {visible.length === 0 && (
            <Text variant="callout" color="tertiary" as="p">
              아직 댓글이 없어요. 첫 댓글을 남겨보세요.
            </Text>
          )}
          {visible.map((c) => {
            const liked = likedMap[c.id] ?? false;
            return (
              <div key={c.id} id={`comment-${c.id}`} className={s.comment} data-reply={!!c.parent} data-fresh={fresh === c.id}>
                <AuthorAvatar size="s" brand={c.isAuthor} />
                <div className={s.commentMain}>
                  <div className={s.commentHead}>
                    <Text variant="caption-1-strong" color={c.isAuthor ? 'brand' : 'primary'}>
                      {c.author}
                    </Text>
                    {c.mine && !c.isAuthor && <Chip tone="neutral">나</Chip>}
                    <Text variant="caption-2" color="tertiary">
                      {c.time}
                    </Text>
                  </div>
                  <Text variant="callout" as="p" className={s.body}>
                    {c.body}
                  </Text>
                  <div className={s.commentActions}>
                    <button type="button" className={`${s.commentAction} t-caption-2`} aria-pressed={liked} aria-label={`댓글 공감 ${c.likes + (liked ? 1 : 0)}`} onClick={() => toggleLike(c.id, false)}>
                      <LocalIcon name={liked ? 'heart-fill' : 'heart'} size={16} />
                      <span className="tnum">{c.likes + (liked ? 1 : 0)}</span>
                    </button>
                    <button
                      type="button"
                      className={`${s.commentAction} t-caption-2-strong`}
                      onClick={() => {
                        setReplyTo(c);
                        inputRef.current?.focus();
                      }}
                    >
                      답글
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </article>
    </Screen>
  );
}

function SheetAction({ icon, label, onPress, danger }: { icon: LocalIconName | 'edit' | 'close' | 'warning'; label: string; onPress: () => void; danger?: boolean }) {
  const local = icon === 'link' || icon === 'block';
  return (
    <button type="button" className={`${s.sheetAction} t-body`} data-danger={danger} onClick={onPress}>
      {local ? <LocalIcon name={icon as LocalIconName} size={20} /> : <Icon name={icon as 'edit' | 'close' | 'warning'} size={20} />}
      {label}
    </button>
  );
}
