import type { ReactNode } from 'react';
import { Icon, Text, type IconName } from '@/ui';
import { useDownload, type DlState } from './useDownload';
import { fileMeta, type FileItem } from './data';
import s from './Courses.module.css';

/* ────────────────────────────────────────────────────────────
 * 수강과목 섹션 로컬 부품 (공통화 후보: FileRow · DownloadAction · LinkIcon/PlayIcon · CountChip)
 * ──────────────────────────────────────────────────────────── */

/* ── 없는 아이콘 (24 viewBox · stroke 2 · round cap · currentColor) ── */
export function LinkIcon({ size = 20 }: { size?: 16 | 20 | 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" />
    </svg>
  );
}
export function PlayIcon({ size = 20 }: { size?: 16 | 20 | 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7.5 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}

function KindIcon({ kind, size = 20 }: { kind: FileItem['kind']; size?: 16 | 20 }) {
  if (kind === 'link') return <LinkIcon size={size} />;
  if (kind === 'video') return <PlayIcon size={size} />;
  return <Icon name="file" size={size} />;
}

/** 오른쪽 20 아이콘: 다운로드 ↓ / 진행 링 / 완료 ✓ / 링크 · 영상 */
export function DownloadGlyph({ file, status, progress }: { file: FileItem; status: DlState['status']; progress: number }) {
  if (file.kind === 'link') return <Icon name="arrow-right" size={20} color="secondary" />;
  if (file.kind === 'video') return <PlayIcon size={20} />;
  if (status === 'loading') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" className={s.ring} role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <circle cx="10" cy="10" r="8" fill="none" stroke="var(--wivu-color-border-default)" strokeWidth="2" />
        <circle cx="10" cy="10" r="8" fill="none" stroke="var(--wivu-color-icon-brand)" strokeWidth="2" strokeLinecap="round" pathLength={100} strokeDasharray={`${progress} 100`} transform="rotate(-90 10 10)" />
      </svg>
    );
  }
  if (status === 'done') return <Icon name="check" size={20} color="brand" />;
  return <Icon name="download" size={20} color="primary" />;
}

/* ── 파일 행 ────────────────────────────────────────────────
 * list : 흰 카드 리스트 안의 행 (과목 상세·강의자료)
 * boxed: 단독 아웃라인 박스 r14 (과제 첨부·공지 첨부) */
type FileRowProps = {
  file: FileItem;
  variant?: 'list' | 'boxed';
  /** 메타에 날짜까지 ('PDF · 4.2MB · 09.11') */
  withDate?: boolean;
  /** 아이콘 박스 색 — 지난 주차 자료는 subtle */
  tone?: 'brand' | 'subtle';
  titleVariant?: 'subhead' | 'label';
};
export function FileRow({ file, variant = 'list', withDate, tone = 'brand', titleVariant = 'label' }: FileRowProps) {
  const dl = useDownload(file);
  const action = file.kind === 'pdf' ? '다운로드' : file.kind === 'link' ? '열기' : '재생';
  const meta = dl.status === 'loading' ? `다운로드 중 · ${Math.round(dl.progress)}%` : dl.status === 'done' ? `${fileMeta(file, withDate)} · 받음` : fileMeta(file, withDate);
  return (
    <button type="button" className={variant === 'boxed' ? s.fileBoxed : s.fileRow} onClick={dl.start} aria-label={`${file.name} ${action}`}>
      <span className={s.fileIcon} data-tone={tone}>
        <KindIcon kind={file.kind} />
      </span>
      <span className={s.fileInfo}>
        <Text variant={titleVariant} className="truncate" as="span" style={{ display: 'block' }}>
          {file.name}
        </Text>
        <Text variant="caption-2" color={dl.status === 'loading' ? 'brand' : 'secondary'} className="truncate tnum" as="span" style={{ display: 'block' }}>
          {meta}
        </Text>
      </span>
      <span className={s.fileAction} aria-hidden>
        <DownloadGlyph file={file} status={dl.status} progress={dl.progress} />
      </span>
    </button>
  );
}

/* ── 수강과목 카드의 '공지 1 · 과제 1 · 자료 4' 칩 ─────────── */
export function CountChip({ icon, label, count, dot }: { icon: IconName; label: string; count: number; dot?: boolean }) {
  const zero = count === 0;
  return (
    <span className={s.countChip}>
      <Icon name={icon} size={16} color={zero ? 'tertiary' : 'primary'} />
      <Text variant="caption-2-strong" color={zero ? 'tertiary' : 'primary'} tnum>
        {label} {count}
      </Text>
      {dot && <span className={s.newDot} aria-label="새 공지" />}
    </span>
  );
}

/* ── 정보 표 한 줄 (과제 상세: '마감 | 9월 11일 (금) 23:59 | D-DAY') ── */
export function InfoLine({ label, children, aside }: { label: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className={s.infoLine}>
      <Text variant="caption-1" color="secondary" className={s.infoLabel}>
        {label}
      </Text>
      <Text variant="label" className={s.infoValue}>
        {children}
      </Text>
      {aside}
    </div>
  );
}

/* ── 본문 텍스트 (줄바꿈 유지) ─────────────────────────────── */
export function BodyText({ children }: { children: string }) {
  return (
    <Text variant="body" as="p" className={s.bodyText}>
      {children}
    </Text>
  );
}
