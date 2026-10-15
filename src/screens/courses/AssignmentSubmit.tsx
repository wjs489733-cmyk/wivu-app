import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useParams } from 'react-router';
import { Button, CtaBar, Dialog, Icon, Screen, Text, TextArea, TopNav, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { TODAY_MD, USER } from '@/data/core';
import { useApp } from '@/store/app';
import { SAMPLE_SIZE, SUBMIT_TIME, dueShort, getAssignment, remaining, sampleFileName } from './data';
import { assignmentKey, isGlobalAssignment, useCourses } from './store';
import s from './Courses.module.css';

const MAX_FILES = 3;
const MAX_BYTES = 10 * 1024 * 1024;
const MEMO_MAX = 300;

type Picked = { key: number; name: string; bytes: number; progress: number };

const fmtSize = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(b / 1024))}KB`);

/**
 * 과제 제출 (모달) — Figma 398:7717 (Course_v4_04_Submit)
 * 실제 파일 선택(<input type=file accept=.pdf>) → 이름·용량 표시 + 업로드 진행 흉내. 데모용 '샘플 파일 첨부'.
 * 제출하기 → 로딩 → submitAssignment(파일명) → 제출 완료(DISSOLVE, replace)
 */
export function AssignmentSubmit() {
  const { id, aid } = useParams();
  const { course, a } = getAssignment(id, aid);
  const nav = useNav();
  const submitGlobal = useApp((st) => st.submitAssignment);
  const saveSubmission = useCourses((st) => st.saveSubmission);

  const [files, setFiles] = useState<Picked[]>([]);
  const [memo, setMemo] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => clearInterval(t)), []);

  const sampleName = sampleFileName(a.title, USER.name);
  const hasSample = files.some((f) => f.name === sampleName);
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
      if (files.some((x) => x.name === f.name)) {
        toast('이미 첨부한 파일이에요');
        continue;
      }
      addFile(f.name, f.size);
      slots--;
    }
  };

  const addSample = () => {
    if (hasSample) return toast('이미 첨부한 파일이에요');
    if (files.length >= MAX_FILES) return toast(`파일은 최대 ${MAX_FILES}개까지 올릴 수 있어요`, 'warning');
    addFile(sampleName, SAMPLE_SIZE);
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

  const close = () => (dirty && !sending ? setConfirmClose(true) : nav.back(P.assignment(course.id, a.id)));

  return (
    <Screen
      figma="398:7717"
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
            nav.back(P.assignment(course.id, a.id));
          }}
        />
      }
    >
      <div className={s.page}>
        {/* 과제 컨텍스트 */}
        <div className={s.contextCard}>
          <div className={s.cardInfo}>
            <Text variant="subhead" as="p" className="truncate">
              {a.title}
            </Text>
            <Text variant="caption-2" color="secondary" as="p" className="truncate">
              {course.name} · {dueShort(a.due)} 마감
            </Text>
          </div>
          <Text variant="caption-2-strong" color="error" tnum style={{ flexShrink: 0 }}>
            {remaining(a.due)}
          </Text>
        </div>

        {/* 제출 파일 */}
        <div className={s.blockTight}>
          <div className={s.labelRow}>
            <Text variant="subhead" as="h2">
              제출 파일
            </Text>
            <Text variant="caption-1" color="tertiary" tnum>
              {files.length} / {MAX_FILES}
            </Text>
          </div>
          {files.map((f) => {
            const busy = f.progress < 100;
            return (
              <div key={f.key} className={s.pickedFile}>
                <span className={s.fileIcon} data-tone="brand">
                  <Icon name="file" size={20} />
                </span>
                <span className={s.fileInfo}>
                  <Text variant="label" className="truncate" as="span" style={{ display: 'block' }}>
                    {f.name}
                  </Text>
                  <Text variant="caption-2" color="brand" className="tnum" as="span" style={{ display: 'block' }}>
                    PDF · {fmtSize(f.bytes)} · {busy ? `업로드 중 ${Math.round(f.progress)}%` : '업로드 완료'}
                  </Text>
                  {busy && (
                    <span className={s.uploadBar}>
                      <span style={{ width: `${f.progress}%` }} />
                    </span>
                  )}
                </span>
                <button type="button" className={s.removeBtn} aria-label={`${f.name} 삭제`} disabled={sending} onClick={() => setFiles((prev) => prev.filter((x) => x.key !== f.key))}>
                  <Icon name="close" size={20} />
                </button>
              </div>
            );
          })}
          {files.length < MAX_FILES && (
            <button type="button" className={s.addFile} onClick={() => inputRef.current?.click()} disabled={sending}>
              <Icon name="plus" size={20} />
              <span className="t-label">파일 추가</span>
            </button>
          )}
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" multiple hidden onChange={onPick} aria-label="제출할 PDF 파일 선택" />
          <div className={s.helperRow}>
            <Text variant="caption-2" color="tertiary">
              PDF · 10MB 이하 · 최대 {MAX_FILES}개
            </Text>
            {files.length < MAX_FILES && !hasSample && (
              <Button variant="soft" size="s" leadingIcon="file" onClick={addSample} disabled={sending}>
                최근 파일 첨부
              </Button>
            )}
          </div>
        </div>

        <div className={s.bleedDivider} role="separator" />

        {/* 메모 */}
        <div className={s.blockTight}>
          <Text variant="subhead" as="h2" id="submit-memo-label">
            메모 (선택)
          </Text>
          <div className={s.memoBox}>
            <TextArea
              aria-labelledby="submit-memo-label"
              value={memo}
              maxLength={MEMO_MAX}
              onChange={(e) => setMemo(e.target.value.slice(0, MEMO_MAX))}
              placeholder="교수님께 전달할 내용을 입력하세요"
              style={{ minHeight: 64 }}
              rows={3}
            />
            <Text variant="caption-2" color="tertiary" tnum align="right" as="p">
              {memo.length} / {MEMO_MAX}
            </Text>
          </div>
        </div>

        <div className={s.note}>
          <Icon name="clock" size={16} color="secondary" />
          <Text variant="caption-2" color="secondary" as="p">
            마감 전까지 언제든 다시 제출할 수 있어요. 마지막으로 제출한 파일로 평가돼요.
          </Text>
        </div>
      </div>
    </Screen>
  );
}
