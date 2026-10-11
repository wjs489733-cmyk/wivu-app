import { useRef, useState, type ChangeEvent } from 'react';
import { useSearchParams } from 'react-router';
import { BottomSheet, Chip, Dialog, Icon, IconButton, OptionRow, Screen, Switch, Text, TextAction, TopNav, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { USER, courseById } from '@/data/core';
import { dueShort, openAssignments } from '@/screens/courses/data';
import { useIsSubmitted } from '@/screens/courses/store';
import { boardById, CAMPUS_BOARDS, COURSE_BOARDS, isBoardId, type Attachment, type Board, type BoardId, type LinkedAssignment } from './data';
import { useBoard } from './store';
import { LocalIcon } from './icons';
import s from './Board.module.css';

const MAX_FILES = 4;
const BODY_MAX = 2000;

const fmtSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`);

/** 높이 자동 맞춤 (textarea) */
const autoGrow = (el: HTMLTextAreaElement | null) => {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
};

/**
 * 글쓰기 — Figma 420:8691 (Board_v4_04_Write) · 모달(MOVE_IN)
 * ?board=<id>로 게시판 미리 선택. 제목+본문이 있어야 '등록' 활성 → 섹션 스토어에 글 추가 → 새 글 상세로 DISSOLVE
 */
export function BoardWrite() {
  const nav = useNav();
  const [params] = useSearchParams();
  const addPost = useBoard((st) => st.addPost);
  const isSubmitted = useIsSubmitted();

  const from = params.get('board');
  const initial: BoardId = from && isBoardId(from) && from !== 'guide' ? (from as BoardId) : 'service-design';
  const [boardId, setBoardId] = useState<BoardId>(initial);
  const board = boardById(boardId);
  const [tag, setTag] = useState(board.categories[0]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [anon, setAnon] = useState(true);
  const [files, setFiles] = useState<Attachment[]>([]);
  const [linked, setLinked] = useState<LinkedAssignment | null>(null);
  const [sheet, setSheet] = useState<null | 'board' | 'assignment'>(null);
  const [leave, setLeave] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const ready = !!title.trim() && !!body.trim();
  const dirty = !!(title.trim() || body.trim() || files.length || linked);
  const exitTo = from && isBoardId(from) ? P.boardCourse(from) : P.board;
  // 과제 목록은 수강과목 데이터가 단일 기준 (진행 중인 과제만 연결)
  const assignments = openAssignments().filter((a) => a.courseId === boardId);

  const pickBoard = (b: Board) => {
    setBoardId(b.id);
    if (!b.categories.includes(tag)) setTag(b.categories[0]);
    if (linked && linked.courseId !== b.id) setLinked(null);
    setSheet(null);
  };

  const close = () => (dirty ? setLeave(true) : nav.back(exitTo));

  const onFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!picked.length) return;
    const room = MAX_FILES - files.length;
    if (picked.length > room) toast(`첨부는 최대 ${MAX_FILES}개까지 할 수 있어요`);
    const next: Attachment[] = picked.slice(0, Math.max(0, room)).map((f) => {
      const image = f.type.startsWith('image/');
      return { name: f.name, size: fmtSize(f.size), kind: image ? 'image' : /\.pdf$/i.test(f.name) ? 'pdf' : 'file', url: image ? URL.createObjectURL(f) : undefined };
    });
    setFiles((list) => [...list, ...next]);
  };

  const removeFile = (i: number) =>
    setFiles((list) => {
      const f = list[i];
      if (f?.url) URL.revokeObjectURL(f.url);
      return list.filter((_, j) => j !== i);
    });

  const linkAssignment = () => {
    if (board.kind !== 'course') return toast('과제는 수업 게시판에서만 연결할 수 있어요');
    if (!assignments.length) return toast(`${board.name}에는 연결할 과제가 없어요`);
    setSheet('assignment');
  };

  const submit = () => {
    if (!ready) return;
    const id = `my-${Date.now().toString(36)}`;
    addPost({
      id,
      boardId,
      tag,
      title: title.trim(),
      body: body.trim(),
      author: anon ? '익명' : USER.name,
      time: '방금',
      views: 1,
      likes: 0,
      comments: 0,
      files: files.length ? files : undefined,
      linked: linked ?? undefined,
      mine: true,
      createdAt: Date.now(),
    });
    // Figma: 등록 → 게시글 상세 DISSOLVE. 글쓰기 모달을 대체해서 뒤로 가면 원래 게시판으로 돌아간다.
    nav.fade(P.boardPost(id));
    toast('글을 등록했어요', 'check');
  };

  return (
    <Screen
      figma="420:8691"
      header={
        <TopNav
          title="글쓰기"
          leading="close"
          onLeading={close}
          trailing={
            <TextAction disabled={!ready} onPress={submit}>
              등록
            </TextAction>
          }
        />
      }
      hairline
      footer={
        <div className={s.toolbar}>
          <input ref={fileRef} type="file" accept="image/*,.pdf,.zip,.ai,.psd,.fig" multiple hidden onChange={onFiles} />
          <button type="button" className={`${s.tool} t-caption-1-strong`} data-on={files.length > 0} onClick={() => fileRef.current?.click()}>
            <Icon name="file" size={20} />
            {files.length ? `파일 ${files.length}` : '파일'}
          </button>
          <button type="button" className={`${s.tool} t-caption-1-strong`} data-on={!!linked} onClick={linkAssignment}>
            <Icon name="assignment" size={20} />
            과제 연결
          </button>
          <button type="button" className={`${s.tool} t-caption-1-strong`} onClick={() => toast('일정 첨부는 다음 버전에서 열려요')}>
            <Icon name="nav-calendar" size={20} />
            일정
          </button>
          <span className={s.toolSpacer} />
          <span className={s.anonSwitch}>
            <Text variant="caption-1-strong">익명</Text>
            <Switch checked={anon} onChange={setAnon} label="익명으로 쓰기" />
          </span>
        </div>
      }
      overlay={
        <>
          <BottomSheet open={sheet === 'board'} onClose={() => setSheet(null)} label="게시판 선택">
            <div className={s.sheetHead}>
              <Text variant="title-2" as="h2">
                게시판 선택
              </Text>
              <IconButton icon="close" label="닫기" onPress={() => setSheet(null)} />
            </div>
            <div className={s.sheetScroll}>
              <BoardOptions label="내 수업 게시판" boards={COURSE_BOARDS} value={boardId} onPick={pickBoard} />
              <BoardOptions label="전체 게시판" boards={CAMPUS_BOARDS} value={boardId} onPick={pickBoard} />
              <div className={s.sheetGap} />
            </div>
          </BottomSheet>
          <BottomSheet open={sheet === 'assignment'} onClose={() => setSheet(null)} label="과제 연결">
            <div className={s.sheetHead}>
              <Text variant="title-2" as="h2">
                과제 연결
              </Text>
              <IconButton icon="close" label="닫기" onPress={() => setSheet(null)} />
            </div>
            <Text variant="caption-1" color="secondary" as="p" style={{ marginBottom: 16 }}>
              연결하면 글 상단에 과제 바로가기가 붙어요.
            </Text>
            <div className={s.optionList}>
              {assignments.map((a) => (
                <OptionRow
                  key={a.id}
                  icon="assignment"
                  title={a.title}
                  meta={`${courseById(a.courseId).name} · ${dueShort(a.due)} 마감 · ${isSubmitted(a.courseId, a.id) ? '제출 완료' : '미제출'}`}
                  selected={linked?.aid === a.id}
                  onPress={() => {
                    setLinked({ courseId: a.courseId, aid: a.id, title: a.title, due: dueShort(a.due) });
                    setSheet(null);
                  }}
                />
              ))}
            </div>
            <div className={s.sheetGap} />
          </BottomSheet>
          <Dialog
            open={leave}
            title="작성 중인 글이 있어요"
            message="나가면 작성한 내용이 사라져요."
            confirmLabel="나가기"
            cancelLabel="계속 쓰기"
            destructive
            onCancel={() => setLeave(false)}
            onConfirm={() => {
              setLeave(false);
              nav.back(exitTo);
            }}
          />
        </>
      }
    >
      <div className={s.write}>
        <button type="button" className={s.boardSelect} onClick={() => setSheet('board')} aria-label={`게시판 선택: ${board.name}`}>
          <Icon name={board.kind === 'course' ? 'nav-board' : board.icon} size={20} />
          <Text variant="label" className="truncate">
            {board.kind === 'course' ? `${board.name} · 수업 게시판` : board.name}
          </Text>
          <Icon name="chevron-down" size={20} />
        </button>

        <div className={s.filters} role="radiogroup" aria-label="말머리">
          {board.categories.map((c) => (
            <Chip key={c} size="m" tone="neutral" selected={tag === c} onSelect={() => setTag(c)}>
              {c}
            </Chip>
          ))}
        </div>

        <textarea
          className={`${s.titleInput} t-title-2`}
          rows={1}
          value={title}
          maxLength={60}
          placeholder="제목을 입력하세요"
          aria-label="제목"
          onChange={(e) => {
            setTitle(e.target.value.replace(/\n/g, ''));
            autoGrow(e.target);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              bodyRef.current?.focus();
            }
          }}
        />
        <textarea
          ref={bodyRef}
          className={`${s.bodyInput} t-body`}
          value={body}
          maxLength={BODY_MAX}
          placeholder={board.kind === 'course' ? '수업과 관련된 질문이나 자료를 자유롭게 남겨보세요.\n익명이어도 서로 존중하는 말로 써주세요.' : '재학생끼리 나누고 싶은 이야기를 남겨보세요.\n익명이어도 서로 존중하는 말로 써주세요.'}
          aria-label="본문"
          onChange={(e) => {
            setBody(e.target.value);
            autoGrow(e.target);
          }}
        />
        <Text variant="caption-2" color="tertiary" className={s.counter} tnum>
          {body.length} / {BODY_MAX}
        </Text>

        {files.length > 0 && (
          <div className={s.attachRail} aria-label="첨부 파일">
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className={s.attach}>
                {f.url ? (
                  <img src={f.url} alt={f.name} />
                ) : (
                  <>
                    <span style={{ color: 'var(--wivu-color-icon-brand)', marginBottom: 'auto' }}>
                      <Icon name="file" size={24} />
                    </span>
                    <Text variant="micro" className="truncate" style={{ display: 'block' }}>
                      {f.name}
                    </Text>
                    <Text variant="caption-2" color="tertiary">
                      {f.size}
                    </Text>
                  </>
                )}
                <button type="button" className={s.attachRemove} aria-label={`${f.name} 삭제`} onClick={() => removeFile(i)}>
                  <Icon name="close" size={16} />
                </button>
              </div>
            ))}
            {files.length < MAX_FILES && (
              <button type="button" className={s.attach} style={{ alignItems: 'center', justifyContent: 'center', gap: 4 }} onClick={() => fileRef.current?.click()} aria-label="파일 더 첨부">
                <LocalIcon name="image" size={24} style={{ color: 'var(--wivu-color-icon-secondary)' }} />
                <Text variant="caption-2" color="tertiary" tnum>
                  {files.length} / {MAX_FILES}
                </Text>
              </button>
            )}
          </div>
        )}

        {linked && (
          <div className={s.linkedCard}>
            <Icon name="assignment" size={20} />
            <span className={s.pinnedText}>
              <Text variant="micro" color="brand">
                과제 연결됨
              </Text>
              <Text variant="label" className="truncate">
                {linked.title} · {linked.due}
              </Text>
            </span>
            <IconButton icon="close" label="과제 연결 해제" onPress={() => setLinked(null)} />
          </div>
        )}
      </div>
    </Screen>
  );
}

function BoardOptions({ label, boards, value, onPick }: { label: string; boards: Board[]; value: BoardId; onPick: (b: Board) => void }) {
  return (
    <>
      <Text variant="caption-1-strong" color="secondary" as="p" className={s.optionGroupLabel}>
        {label}
      </Text>
      <div className={s.optionList} style={{ marginBottom: 16 }}>
        {boards.map((b) => (
          <OptionRow key={b.id} icon={b.icon} title={b.name} meta={b.sub} selected={b.id === value} onPress={() => onPick(b)} />
        ))}
      </div>
    </>
  );
}
