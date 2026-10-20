import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { BottomSheet, Button, Chip, Dialog, Icon, IconButton, OptionRow, Screen, SheetAction, SheetHead, Text, TopNav, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { boardById, boardTitle, REPORT_REASONS, verifiedLabel, type Comment, type Post } from './data';
import { useBoard, usePost, usePostStats, useThread } from './store';
import { ApplyOverlay, EmptyState, LocalSheetAction, RecruitRow, TagChip } from './parts';
import { useApplyFlow } from './applyFlow';
import { LocalIcon } from './icons';
import s from './Board.module.css';

/**
 * 게시글 상세 — Figma v5 687:6783 (내 글) · 698:7597 (다른 사람 글)
 * 같은 라우트 안 상태
 *  - 내 글: ··· → 글 메뉴 시트 698:7353 (링크 복사 / 수정하기 → 글쓰기 ?edit / 삭제하기 → 삭제 확인 698:7493)
 *  - 다른 사람 글: ··· → 신고 시트 698:7691 (사유 6 + 신고하기 + '이 사용자 차단하기' → 차단 확인 698:7865)
 * 공감·스크랩 토글, 댓글/답글 등록(익명). 데모 진입: ?sheet=menu|report · ?dialog=delete|block
 */
export function PostDetail() {
  const { pid } = useParams();
  const nav = useNav();
  const post = usePost(pid);

  if (!post) {
    return (
      <Screen figma="687:6783" header={<TopNav title="게시글" fallback={P.board} />}>
        <EmptyState
          title="볼 수 없는 글이에요"
          desc="삭제되었거나 차단한 사용자의 글이에요."
          action={
            <Button variant="secondary" size="m" onClick={() => nav.back(P.board)}>
              게시판으로
            </Button>
          }
        />
      </Screen>
    );
  }
  return <PostView key={post.id} post={post} />;
}

type SheetKind = null | 'menu' | 'report';
type DialogKind = null | 'block' | 'delete';

function PostView({ post }: { post: Post }) {
  const nav = useNav();
  const [params] = useSearchParams();
  const board = boardById(post.boardId);
  const back = board.kind === 'system' ? P.board : P.boardCourse(board.id);
  const official = board.kind === 'system';
  const stats = usePostStats(post);
  const { comments } = useThread(post);
  const toggleLike = useBoard((st) => st.toggleLike);
  const toggleScrap = useBoard((st) => st.toggleScrap);
  const addComment = useBoard((st) => st.addComment);
  const hide = useBoard((st) => st.hide);
  const apply = useApplyFlow();

  const [sheet, setSheet] = useState<SheetKind>(() => {
    const q = params.get('sheet');
    return q === 'menu' || (q === 'report' && !post.mine && !official) ? q : null;
  });
  const [reason, setReason] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogKind>(() => {
    const q = params.get('dialog');
    return (q === 'delete' && post.mine) || (q === 'block' && !post.mine && !official) ? q : null;
  });
  const [showOlder, setShowOlder] = useState(false);
  const [text, setText] = useState('');
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
    document.getElementById(`comment-${fresh}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const t = setTimeout(() => setFresh(null), 1900);
    return () => clearTimeout(t);
  }, [fresh]);

  /** 익명 게시판: 내 댓글은 이 글에서 처음 받은 익명 번호를 계속 쓴다 (작성자 본인은 '작성자') */
  const myAnonName = () => {
    const mine = comments.find((c) => c.mine && /^익명\d+$/.test(c.author));
    if (mine) return mine.author;
    const used = new Set(comments.map((c) => c.author).filter((a) => /^익명\d+$/.test(a)));
    return `익명${used.size + 1}`;
  };

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    const c = addComment(post.id, {
      author: post.mine ? '작성자' : myAnonName(),
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

  // Figma: 삭제·차단 확인 → 피드(687:6661). 들어온 곳이 있으면 그곳으로 돌아간다
  const leaveAndHide = (message: string) => {
    setDialog(null);
    nav.back(back);
    toast(message, 'check');
    setTimeout(() => hide(post.id), 380);
  };

  const openMore = () => {
    if (post.mine || official) return setSheet('menu');
    setReason(null);
    setSheet('report');
  };

  const images = post.files?.filter((f) => f.kind === 'image' && f.url) ?? [];
  const docs = post.files?.filter((f) => !(f.kind === 'image' && f.url)) ?? [];
  const meta = [post.author, post.time, `조회 ${post.views}`, official ? '운영팀' : verifiedLabel(board)].join(' · ');

  return (
    <Screen
      figma={post.mine ? '687:6783' : '698:7597'}
      header={<TopNav title={boardTitle(board)} fallback={back} trailing={<IconButton icon="more" label={post.mine ? '내 글 메뉴' : official ? '글 메뉴' : '신고·차단'} onPress={openMore} />} />}
      footer={
        <div className={s.inputBar}>
          {replyTo && (
            <div className={s.replyTo}>
              <Text variant="caption-1-strong" color="brand" className="truncate">
                {replyTo.author}님에게 답글 남기는 중
              </Text>
              <button type="button" className={s.replyClose} aria-label="답글 취소" onClick={() => setReplyTo(null)}>
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          <div className={s.inputRow}>
            <input
              ref={inputRef}
              className={`${s.commentField} t-body-3`}
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
            <button type="button" className={s.send} aria-label="댓글 보내기" aria-disabled={!text.trim()} onClick={() => (text.trim() ? submit() : inputRef.current?.focus())}>
              <Icon name="send" size={24} />
            </button>
          </div>
        </div>
      }
      overlay={
        <>
          <ApplyOverlay flow={apply} />
          {/* 글 메뉴 (내 글 698:7353 · 운영 안내 글은 링크 복사만) */}
          <BottomSheet open={sheet === 'menu'} onClose={() => setSheet(null)} label={post.mine ? '내 글 메뉴' : '글 메뉴'}>
            <SheetHead title={post.mine ? '내 글' : '글 메뉴'} onClose={() => setSheet(null)} />
            <div className={s.sheetList} style={{ marginTop: -8 }}>
              <LocalSheetAction icon={<LocalIcon name="link" size={20} />} label="링크 복사" onPress={copyLink} />
              {post.mine && (
                <>
                  <SheetAction
                    icon="edit"
                    label="수정하기"
                    onPress={() => {
                      setSheet(null);
                      nav.modal(`${P.boardWrite}?edit=${post.id}`);
                    }}
                  />
                  <SheetAction
                    icon="trash"
                    label="삭제하기"
                    danger
                    onPress={() => {
                      setSheet(null);
                      setDialog('delete');
                    }}
                  />
                </>
              )}
            </div>
          </BottomSheet>
          {/* 신고 시트 (다른 사람 글 698:7691) */}
          <BottomSheet open={sheet === 'report'} onClose={() => setSheet(null)} label="신고하기">
            <SheetHead title="신고 사유를 선택해주세요" subtitle="신고한 내용은 작성자에게 알려지지 않아요. 검토 후 운영 원칙에 따라 조치해요." onClose={() => setSheet(null)} />
            <div className={s.optionList} role="radiogroup" aria-label="신고 사유">
              {REPORT_REASONS.map((r) => (
                <OptionRow key={r} title={r} selected={reason === r} onPress={() => setReason(r)} />
              ))}
            </div>
            <div className={s.sheetCta}>
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
              <Button
                variant="tertiary"
                size="m"
                onClick={() => {
                  setSheet(null);
                  setDialog('block');
                }}
              >
                이 사용자 차단하기
              </Button>
            </div>
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
        <div className={s.tags}>
          <TagChip tag={post.tag} />
          {post.mine && <Chip tone="brand">내 글</Chip>}
        </div>
        <Text variant="title-2" as="h2" className={s.body}>
          {post.title}
        </Text>
        <Text variant="caption-1" color="tertiary" as="p" tnum style={{ marginTop: 6 }}>
          {meta}
        </Text>

        {post.linked && (
          <button type="button" className={s.linkRow} style={{ marginTop: 16 }} onClick={() => nav.push(P.assignment(post.linked!.courseId, post.linked!.aid))}>
            <Icon name="assignment" size={20} />
            <Text variant="body-3" className="truncate">
              {post.linked.title} · {post.linked.due} 마감
            </Text>
            <Icon name="chevron-right" size={16} color="secondary" />
          </button>
        )}

        <Text variant="body-2" color="secondary" as="p" className={s.body} style={{ marginTop: 16 }}>
          {post.body}
        </Text>

        {images.length > 0 && (
          <div className={s.imageGrid} data-count={images.length} style={{ marginTop: 16 }}>
            {images.map((f) => (
              <img key={f.url} src={f.url} alt={f.name} />
            ))}
          </div>
        )}
        {docs.map((f) => (
          <button key={f.name} type="button" className={s.linkRow} style={{ marginTop: 8 }} onClick={() => toast(`${f.name} 저장했어요`, 'download')}>
            <Icon name="file" size={20} />
            <Text variant="body-3" className="truncate">
              {f.name} · {f.size}
            </Text>
            <Icon name="download" size={16} color="secondary" />
          </button>
        ))}

        {/* 모집 글: v5 상세엔 없지만 신청 상태를 상세에서도 보고 바꿀 수 있게 탭 루트 카드와 같은 줄을 둔다 */}
        {post.recruit && (
          <div style={{ marginTop: 16 }}>
            <RecruitRow post={post} onApply={apply.request} />
          </div>
        )}

        <div className={s.actions} style={{ marginTop: 16 }}>
          <button type="button" className={s.action} aria-pressed={stats.liked} onClick={like}>
            <span key={pop} className={pop ? s.pop : undefined} style={{ display: 'inline-flex' }}>
              <LocalIcon name={stats.liked ? 'heart-fill' : 'heart'} size={20} />
            </span>
            <Text variant="caption-1" color={stats.liked ? 'brand' : 'secondary'} tnum>
              공감 {stats.likeCount}
            </Text>
          </button>
          <button
            type="button"
            className={s.action}
            onClick={() => {
              commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              setTimeout(() => inputRef.current?.focus(), 250);
            }}
          >
            <Icon name="comment" size={20} />
            <Text variant="caption-1" color="secondary" tnum>
              댓글 {stats.commentCount}
            </Text>
          </button>
          <button type="button" className={s.action} aria-pressed={stats.scrapped} onClick={scrap}>
            {stats.scrapped ? <LocalIcon name="bookmark-fill" size={20} /> : <Icon name="bookmark" size={20} />}
            <Text variant="caption-1" color={stats.scrapped ? 'brand' : 'secondary'}>
              스크랩
            </Text>
          </button>
        </div>

        <div className={s.sectionGap} aria-hidden />

        <div ref={commentsRef} className={s.comments} style={{ scrollMarginTop: 16 }}>
          <Text variant="body-2-strong" as="h3" tnum>
            댓글 {stats.commentCount}
          </Text>
          {older.length > 0 && !showOlder && (
            <button type="button" className={`${s.moreComments} t-caption-1`} onClick={() => setShowOlder(true)}>
              이전 댓글 {older.length}개 보기
              <Icon name="chevron-down" size={16} />
            </button>
          )}
          {visible.length === 0 && (
            <Text variant="body-3" color="tertiary" as="p" style={{ padding: '10px 0' }}>
              아직 댓글이 없어요. 첫 댓글을 남겨보세요.
            </Text>
          )}
          {visible.map((c) => (
            <div key={c.id} id={`comment-${c.id}`} className={s.comment} data-reply={!!c.parent} data-fresh={fresh === c.id}>
              <div className={s.commentMeta}>
                <Text variant="caption-1-strong" color={c.isAuthor ? 'brand' : 'primary'}>
                  {c.author}
                </Text>
                <Text variant="caption-2" color="tertiary">
                  {c.time}
                </Text>
              </div>
              <Text variant="body-3" as="p" className={s.body}>
                {c.body}
              </Text>
              <button
                type="button"
                className={`${s.replyBtn} t-caption-2`}
                style={{ color: 'var(--wivu-color-text-tertiary)' }}
                onClick={() => {
                  setReplyTo(c);
                  inputRef.current?.focus();
                }}
              >
                답글
              </button>
            </div>
          ))}
        </div>
      </article>
    </Screen>
  );
}
