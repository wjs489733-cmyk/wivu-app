import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useParams } from 'react-router';
import { Button, CtaBar, Dialog, Icon, Screen, Text, TopNav, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { TODAY_MD, USER } from '@/data/core';
import { useApp } from '@/store/app';
import { SAMPLE_SIZE, SUBMIT_TIME, dueShort, getAssignment, sampleFileName } from './data';
import { assignmentKey, isGlobalAssignment, useCourses } from './store';
import { useQueryOnce } from './useQueryOnce';
import s from './Courses.module.css';

const MAX_FILES = 3;
const MAX_BYTES = 10 * 1024 * 1024;
const MEMO_MAX = 300;

type Picked = { key: number; name: string; bytes: number; progress: number };

const fmtSize = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(b / 1024))}KB`);

/**
 * 과제 제출 (모달) — Figma v5 684:6271 (+ 나가기 확인 702:8653 = 같은 라우트의 상태, ?dialog=leave 로 바로 열기)
 * 진입 시 Figma처럼 최근 작업 파일(샘플 '서비스분석리포트_김유진.pdf')이 첨부된 상태 — 전시에서 OS 파일 창 없이 흐름이 이어지게.
 * '파일 추가' → 실제 파일 선택(<input type=file accept=.pdf>) → 이름·용량 + 업로드 진행 흉내. ✕로 빼기.
 * 닫기(✕): 첨부·메모가 있으면 나가기 확인 → '나가기' = 과제 상세로. 제출하기 → 로딩 → submitAssignment(파일명) → 제출 완료(DISSOLVE, replace)
 */
export function AssignmentSubmit() {
  const { id, aid } = useParams();
  const { course, a } = getAssignment(id, aid);
  const nav = useNav();
  const submitGlobal = useApp((st) => st.submitAssignment);
  const saveSubmission = useCourses((st) => st.saveSubmission);
  const dialogParam = useQueryOnce('dialog');

  const sampleName = sampleFileName(a.title, USER.name);
  const [files, setFiles] = useState<Picked[]>(() => [{ key: 0, name: sampleName, bytes: SAMPLE_SIZE, progress: 100 }]);
  const [memo, setMemo] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmClose, setConfirmClose] = useState(dialogParam === 'leave');
  const inputRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => clearInterval(t)), []);

  const uploading = files.some((f) => f.progress < 100);
  const canSubmit = files.length > 0 && !uploading && !a.closed;
  const dirty = files.length > 0 || memo.trim().length > 0;

  /** 업로드 진행 흉내 (용량 비례 0.6–1.4초) */
  const addFile = (name: string, bytes: number) => {
    const key = ++seq.current;
    setFiles((prev) => [...prev, { key, name, bytes, progress: 6 }]);
    const total = Math.min(1400, 600 + (bytes / (1024 * 1024)) * 160);
    const t0 = performance.now();
    const t = window.setInterval(() => {
      const p = Math.min(100, ((performance.now() - t0) / total) * 100);
      setFiles((prev) => prev.map((f) => (f.key === key ? { ...f, progress: p } : f)));
      if (p >= 100) clearInterval(t);
    }, 60);
    timers.current.push(t);
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    e.target.value = ''; // 같은 파일 다시 고를 수 있게
    let slots = MAX_FILES - files.length;
    const names = files.map((x) => x.name);
    for (const f of list) {
      if (slots <= 0) {
        toast(`파일은 최대 ${MAX_FILES}개까지 올릴 수 있어요`, 'warning');
        break;
      }
      const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
      if (!isPdf) {
        toast('PDF 파일만 제출할 수 있어요', 'warning');
        continue;
      }
      if (f.size > MAX_BYTES) {
        toast('10MB 이하 파일만 올릴 수 있어요', 'warning');
        continue;
      }
      if (names.includes(f.name)) {
        toast('이미 첨부한 파일이에요');
        continue;
      }
      names.push(f.name);
      addFile(f.name, f.size);
      slots--;
    }
  };

  const submit = () => {
    if (!canSubmit || sending) return;
    setSending(true);
    timers.current.push(
      window.setTimeout(() => {
        const picked = files.map((f) => ({ name: f.name, size: fmtSize(f.bytes) }));
        saveSubmission(assignmentKey(course.id, a.id), { files: picked, memo: memo.trim(), at: `${TODAY_MD} ${SUBMIT_TIME}` });
        if (isGlobalAssignment(course.id, a.id)) submitGlobal(picked[0].name);
        nav.fade(P.assignmentDone(course.id, a.id));
      }, 1100),
    );
  };

  const leave = () => nav.back(P.assignment(course.id, a.id));
  const close = () => (dirty && !sending ? setConfirmClose(true) : leave());

  return (
    <Screen
      figma="684:6271"
      header={<TopNav title="과제 제출" leading="close" onLeading={close} />}
      footer={
        <CtaBar>
          <Button block disabled={!canSubmit} loading={sending} onClick={submit}>
            {a.closed ? '마감된 과제예요' : uploading ? '업로드 중…' : '제출하기'}
          </Button>
        </CtaBar>
      }
      overlay={
        <Dialog
          open={confirmClose}
          title="제출하지 않고 나갈까요?"
          message="첨부한 파일과 메모는 저장되지 않아요."
          confirmLabel="나가기"
          cancelLabel="계속 작성"
          destructive
          onCancel={() => setConfirmClose(false)}
          onConfirm={() => {
            setConfirmClose(false);
            leave();
          }}
        />
      }
    >
      <div className={s.head}>
        {/* 과제 컨텍스트: Title 3 + Caption 1 */}
        <Text variant="title-3" as="p" className="truncate">
          {a.title}
        </Text>
        <Text variant="caption-1" color="tertiary" as="p" className="truncate tnum" style={{ marginTop: 2 }}>
          {course.name} · {dueShort(a.due)} 마감
        </Text>

        {/* 제출 파일 */}
        <div className={s.labelRow} style={{ marginTop: 24 }}>
          <Text variant="body-2-strong" as="h2">
            제출 파일
          </Text>
          <Text variant="caption-1" color="tertiary" className="tnum">
            {files.length} / {MAX_FILES}
          </Text>
        </div>
        <div className={s.pickedList}>
          {files.map((f) => {
            const busy = f.progress < 100;
            return (
              <div key={f.key} className={s.pickedFile}>
                <Icon name="file" size={20} color="primary" />
                <span className={s.fileInfo}>
                  <Text variant="body-3-strong" className="truncate" as="span" style={{ display: 'block' }}>
                    {f.name}
                  </Text>
                  <Text variant="caption-2" color={busy ? 'brand' : 'tertiary'} className="tnum" as="span" style={{ display: 'block' }}>
                    {fmtSize(f.bytes)} · {busy ? `업로드 중 ${Math.round(f.progress)}%` : '업로드 완료'}
                  </Text>
                  {busy && (
                    <span className={s.uploadBar}>
                      <span style={{ width: `${f.progress}%` }} />
                    </span>
                  )}
                </span>
                <button type="button" className={s.removeBtn} aria-label={`${f.name} 빼기`} disabled={sending} onClick={() => setFiles((prev) => prev.filter((x) => x.key !== f.key))}>
                  <Icon name="close" size={20} />
                </button>
              </div>
            );
          })}
          {files.length < MAX_FILES && (
            <Button variant="secondary" size="m" block leadingIcon="plus" onClick={() => inputRef.current?.click()} disabled={sending}>
              파일 추가
            </Button>
          )}
        </div>
        <input ref={inputRef} type="file" accept=".pdf,application/pdf" multiple hidden onChange={onPick} aria-label="제출할 PDF 파일 선택" />

        {/* 메모 */}
        <Text variant="body-2-strong" as="h2" id="submit-memo-label" style={{ marginTop: 24 }}>
          메모 (선택)
        </Text>
        <textarea
          className={`${s.memo} t-body-1`}
          aria-labelledby="submit-memo-label"
          value={memo}
          maxLength={MEMO_MAX}
          onChange={(e) => setMemo(e.target.value.slice(0, MEMO_MAX))}
          placeholder="교수님께 남길 말을 적어 주세요"
          disabled={sending}
        />

        <div className={s.note}>
          <Icon name="info" size={16} color="tertiary" />
          <Text variant="caption-1" color="tertiary" as="p">
            마감 전까지 몇 번이든 다시 제출할 수 있어요.
          </Text>
        </div>
      </div>
    </Screen>
  );
}
