import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useSearchParams } from 'react-router';
import { BottomSheet, Button, Checkbox, Dialog, Icon, OptionRow, Screen, SheetHead, Text, TextAction, TopNav, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { NOW, USER, courseById } from '@/data/core';
import { openAssignments, type CourseAssignment } from '@/screens/courses/data';
import { useIsSubmitted } from '@/screens/courses/store';
import { boardById, CAMPUS_BOARDS, COURSE_BOARDS, isBoardId, TEAM_ASSIGNMENTS, type Attachment, type Board, type BoardId, type LinkedAssignment } from './data';
import { useBoard, usePost } from './store';
import { LocalIcon } from './icons';
import s from './Board.module.css';

const MAX_FILES = 4;
const BODY_MAX = 2000;

const fmtSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`);
const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (n: number) => String(n).padStart(2, '0');
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
/** 699:8424 표기: '오늘 23:59' / '10.15 (목)' */
const dueLabel = (due: Date) => (sameDay(due, NOW) ? `오늘 ${pad(due.getHours())}:${pad(due.getMinutes())}` : `${due.getMonth() + 1}.${pad(due.getDate())} (${DOW[due.getDay()]})`);

/** 높이 자동 맞춤 (textarea) */
const autoGrow = (el: HTMLTextAreaElement | null) => {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
};

/**
 * 글쓰기 — Figma v5 687:6877 · 모달
 * 같은 라우트 안 상태: 게시판 선택 시트 699:8284 · 과제 연결 시트 699:8424 · 나가기 확인 699:8550(작성 중일 때 닫기)
 * ?board=<id> 게시판 미리 선택 · ?edit=<pid> 내 글 수정(글 메뉴 '수정하기' → 같은 프레임) · 데모 ?sheet=board|assignment
 * 제목+본문이 있어야 '등록' 활성 → 새 글은 상세로 DISSOLVE, 수정은 상세로 돌아감
 */
export function BoardWrite() {
  const [params] = useSearchParams();
  const editing = usePost(params.get('edit') ?? undefined);
  // 수정 대상이 바뀌면 폼을 새로 (key)
  return <WriteForm key={editing?.id ?? 'new'} />;
}

function WriteForm() {
  const nav = useNav();
  const [params] = useSearchParams();
  const addPost = useBoard((st) => st.addPost);
  const updatePost = useBoard((st) => st.updatePost);
  const isSubmitted = useIsSubmitted();
  const editing = usePost(params.get('edit') ?? undefined);
  const edit = editing?.mine ? editing : undefined;

  const from = params.get('board');
  const initialBoard: BoardId = edit ? edit.boardId : from && isBoardId(from) && from !== 'guide' ? (from as BoardId) : 'service-design';
  const [boardId, setBoardId] = useState<BoardId>(initialBoard);
  const board = boardById(boardId);
  const [tag, setTag] = useState(edit?.tag ?? board.categories[0]);
  const [title, setTitle] = useState(edit?.title ?? '');
  const [body, setBody] = useState(edit?.body ?? '');
  const [anon, setAnon] = useState(edit ? edit.author !== USER.name : true);
  const [files, setFiles] = useState<Attachment[]>(edit?.files ?? []);
  const [linked, setLinked] = useState<LinkedAssignment | null>(edit?.linked ?? null);
  const [sheet, setSheet] = useState<null | 'board' | 'assignment'>(() => {
    const q = params.get('sheet');
    return q === 'board' || q === 'assignment' ? q : null;
  });
  const [pick, setPick] = useState<string | null>(null);
  const [leave, setLeave] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const ready = !!title.trim() && !!body.trim();
  const dirty = edit
    ? title !== edit.title || body !== edit.body || tag !== edit.tag || boardId !== edit.boardId || (linked?.aid ?? null) !== (edit.linked?.aid ?? null) || files.length !== (edit.files?.length ?? 0)
    : !!(title.trim() || body.trim() || files.length || linked);
  const exitTo = edit ? P.boardPost(edit.id) : from && isBoardId(from) ? P.boardCourse(from) : P.board;

  // 과제 목록은 수강과목 데이터가 단일 기준 (진행 중인 과제) — 지금 게시판 과목을 맨 앞에
  const assignments = useMemo(() => {
    const list = openAssignments();
    return [...list.filter((a) => a.courseId === boardId), ...list.filter((a) => a.courseId !== boardId)];
  }, [boardId]);
  const keyOf = (a: CourseAssignment) => `${a.courseId}:${a.id}`;

  // 게시판 선택 목록: 내 수업 6 + 학교 게시판 4 (경로로만 남은 게시판에서 들어왔으면 그것도 함께)
  const campus = CAMPUS_BOARDS.some((b) => b.id === boardId) || board.kind === 'course' ? CAMPUS_BOARDS : [...CAMPUS_BOARDS, board];

  const pickBoard = (b: Board) => {
    setBoardId(b.id);
    if (!b.categories.includes(tag)) setTag(b.categories[0]);
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
      if (f?.url && !edit?.files?.includes(f)) URL.revokeObjectURL(f.url);
      return list.filter((_, j) => j !== i);
    });

  const openAssignmentSheet = () => {
    if (!assignments.length) return toast('연결할 수 있는 과제가 없어요');
    setPick(linked ? `${linked.courseId}:${linked.aid}` : keyOf(assignments[0]));
    setSheet('assignment');
  };

  const connect = () => {
    const a = assignments.find((x) => keyOf(x) === pick);
    if (!a) return;
    setLinked({ courseId: a.courseId, aid: a.id, title: a.title, due: dueLabel(a.due) });
    setSheet(null);
  };

  const submit = () => {
    if (!ready) return;
    const fields = {
      boardId,
      tag,
      title: title.trim(),
      body: body.trim(),
      author: anon ? '익명' : USER.name,
      files: files.length ? files : undefined,
      linked: linked ?? undefined,
    };
    if (edit) {
      updatePost(edit.id, { ...fields, excerpt: undefined });
      nav.back(P.boardPost(edit.id));
      toast('글을 수정했어요', 'check');
      return;
    }
    const id = `my-${Date.now().toString(36)}`;
    addPost({ id, ...fields, time: '방금', views: 1, likes: 0, comments: 0, mine: true, createdAt: Date.now() });
    // Figma: 등록 → 게시글 상세 DISSOLVE. 글쓰기 모달을 대체해서 뒤로 가면 원래 게시판으로 돌아간다.
    nav.fade(P.boardPost(id));
    toast('글을 등록했어요', 'check');
  };

  return (
    <Screen
      figma="687:6877"
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
      footer={
        <div className={s.toolbar}>
          <input ref={imageRef} type="file" accept="image/*" multiple hidden onChange={onFiles} />
          <input ref={fileRef} type="file" accept=".pdf,.zip,.ai,.psd,.fig,.doc,.docx,.ppt,.pptx" multiple hidden onChange={onFiles} />
          <button type="button" className={s.tool} onClick={() => imageRef.current?.click()}>
            <Icon name="image" size={20} />
            <Text variant="caption-1" color="inherit">
              사진
            </Text>
          </button>
          <button type="button" className={s.tool} onClick={() => fileRef.current?.click()}>
            <Icon name="file" size={20} />
            <Text variant="caption-1" color="inherit">
              파일
            </Text>
          </button>
          <button type="button" className={s.tool} onClick={openAssignmentSheet}>
            <Icon name="assignment" size={20} />
            <Text variant="caption-1" color="inherit">
              과제 연결
            </Text>
          </button>
          <span className={s.toolSpacer} />
          <Checkbox checked={anon} onChange={setAnon} label="익명" />
        </div>
      }
      overlay={
        <>
          <BottomSheet open={sheet === 'board'} onClose={() => setSheet(null)} label="게시판 선택">
            <SheetHead title="게시판 선택" onClose={() => setSheet(null)} />
            <BoardOptions first label="내 수업 게시판" boards={COURSE_BOARDS} value={boardId} onPick={pickBoard} />
            <BoardOptions label="전체 게시판" boards={campus} value={boardId} onPick={pickBoard} />
          </BottomSheet>
          <BottomSheet open={sheet === 'assignment'} onClose={() => setSheet(null)} label="과제 연결">
            <SheetHead title="과제 연결" subtitle="연결하면 글 상단에 과제 바로가기가 붙어요." onClose={() => setSheet(null)} />
            <div className={s.optionList} role="radiogroup" aria-label="연결할 과제">
              {assignments.map((a) => {
                const state = TEAM_ASSIGNMENTS.has(keyOf(a)) ? '팀 과제' : isSubmitted(a.courseId, a.id) ? '제출 완료' : '미제출';
                return <OptionRow key={keyOf(a)} title={a.title} meta={`${courseById(a.courseId).name} · ${dueLabel(a.due)} 마감 · ${state}`} selected={pick === keyOf(a)} onPress={() => setPick(keyOf(a))} />;
              })}
            </div>
            <div className={s.sheetCta}>
              <Button block disabled={!pick} onClick={connect}>
                연결하기
              </Button>
            </div>
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
          <Text variant="body-2-strong" className="truncate">
            {board.kind === 'course' ? `${board.name} · 수업 게시판` : board.name}
          </Text>
          <Icon name="chevron-down" size={20} />
        </button>

        <div className={s.filters} role="radiogroup" aria-label="말머리">
          {board.categories.map((c) => (
            <Button key={c} size="s" variant={tag === c ? 'primary' : 'secondary'} role="radio" aria-checked={tag === c} onClick={() => setTag(c)}>
              {c}
            </Button>
          ))}
        </div>

        <textarea
          ref={(el) => {
            titleRef.current = el;
            autoGrow(el);
          }}
          className={`${s.titleInput} t-title-3`}
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
        <div className={s.titleRule} aria-hidden />
        <textarea
          ref={(el) => {
            bodyRef.current = el;
            autoGrow(el);
          }}
          className={`${s.bodyInput} t-body-1`}
          value={body}
          maxLength={BODY_MAX}
          placeholder={board.kind === 'course' ? '수업과 관련된 질문이나 자료를 자유롭게 남겨보세요.\n익명이어도 서로 존중하는 말로 써주세요.' : '재학생끼리 나누고 싶은 이야기를 남겨보세요.\n익명이어도 서로 존중하는 말로 써주세요.'}
          aria-label="본문"
          onChange={(e) => {
            setBody(e.target.value);
            autoGrow(e.target);
          }}
        />

        <div className={s.writeExtras}>
          {files.length > 0 && (
            <div className={s.attachRail} aria-label="첨부 파일">
              {files.map((f, i) => (
                <div key={`${f.name}-${i}`} className={s.attach}>
                  {f.url ? (
                    <img src={f.url} alt={f.name} />
                  ) : (
                    <>
                      <span style={{ marginBottom: 'auto' }}>
                        <Icon name="file" size={24} />
                      </span>
                      <Text variant="caption-2-strong" className="truncate" style={{ display: 'block' }}>
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
                <button type="button" className={s.attach} style={{ alignItems: 'center', justifyContent: 'center', gap: 4 }} onClick={() => imageRef.current?.click()} aria-label="사진 더 첨부">
                  <LocalIcon name="image" size={24} />
                  <Text variant="caption-2" color="tertiary" tnum>
                    {files.length} / {MAX_FILES}
                  </Text>
                </button>
              )}
            </div>
          )}

          {linked && (
            <div className={s.linkRow}>
              <Icon name="assignment" size={20} />
              <button type="button" onClick={openAssignmentSheet} style={{ textAlign: 'left', minWidth: 0 }} aria-label={`연결된 과제 바꾸기: ${linked.title}`}>
                <Text variant="body-3" className="truncate" style={{ display: 'block' }}>
                  과제 연결 · {linked.title}
                </Text>
              </button>
              <button type="button" className={s.linkClose} aria-label="과제 연결 해제" onClick={() => setLinked(null)}>
                <Icon name="close" size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Screen>
  );
}

/** 699:8284 그룹 — 그룹 라벨(Caption 1 Strong tertiary) + 텍스트 행(이름 Body 2 Strong · 보조 Caption 2), 선택 = 파란 이름 + 체크 */
function BoardOptions({ first, label, boards, value, onPick }: { first?: boolean; label: string; boards: Board[]; value: BoardId; onPick: (b: Board) => void }) {
  return (
    <>
      <Text variant="caption-1-strong" color="tertiary" as="p" className={s.groupLabel} style={first ? { marginTop: -8 } : undefined}>
        {label}
      </Text>
      <div className={s.sheetList} role="radiogroup" aria-label={label}>
        {boards.map((b) => {
          const on = b.id === value;
          return (
            <button key={b.id} type="button" className={s.pickRow} role="radio" aria-checked={on} onClick={() => onPick(b)}>
              <span>
                <Text variant="body-2-strong" color={on ? 'brand' : 'primary'} as="span" style={{ display: 'block' }}>
                  {b.name}
                </Text>
                <Text variant="caption-2" color="tertiary" as="span" style={{ display: 'block' }}>
                  {b.sub}
                </Text>
              </span>
              {on && <Icon name="check" size={20} />}
            </button>
          );
        })}
      </div>
    </>
  );
}
