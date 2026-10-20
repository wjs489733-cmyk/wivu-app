import type { ReactNode } from 'react';
import { Icon, Text, type TextColor, type TypeVariant } from '@/ui';
import { useDownload, type DlState } from './useDownload';
import { fileMeta, type FileItem } from './data';
import s from './Courses.module.css';

/* ────────────────────────────────────────────────────────────
 * 수강과목 섹션 로컬 부품 — Figma v5 기준
 * (공통화 후보: ItemRow · FileRow · InfoTable · StatStrip · LinkIcon/PlayIcon)
 * ──────────────────────────────────────────────────────────── */

/* ── 세트에 없는 아이콘 (WivU Icons v2 규격: 24 · 선 1.7 · round · currentColor) ── */
export function LinkIcon({ size = 20 }: { size?: 16 | 20 | 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" />
    </svg>
  );
}
export function PlayIcon({ size = 20 }: { size?: 16 | 20 | 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
  if (file.kind === 'link') return <Icon name="external-link" size={20} color="primary" />;
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

/* ── v5 리스트 행 (구분선 없이 간격으로: 위아래 12 · 제목 + 배지 6 · 메타 Caption 1) ── */
type ItemRowProps = {
  title: ReactNode;
  titleVariant?: TypeVariant;
  /** 제목 오른쪽 배지 (v5 Badge = Chip s) */
  badge?: ReactNode;
  meta?: ReactNode;
  metaColor?: TextColor;
  trailing?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  ariaLabel?: string;
};
export function ItemRow({ title, titleVariant = 'body-1', badge, meta, metaColor = 'tertiary', trailing, chevron, onPress, ariaLabel }: ItemRowProps) {
  const body = (
    <>
      <span className={s.itemMain}>
        <span className={s.itemTitle}>
          <Text variant={titleVariant} className="truncate">
            {title}
          </Text>
          {badge}
        </span>
        {meta != null && (
          <Text variant="caption-1" color={metaColor} className="truncate tnum" as="span" style={{ display: 'block' }}>
            {meta}
          </Text>
        )}
      </span>
      {trailing && (
        <span className={s.itemTrailing} aria-hidden>
          {trailing}
        </span>
      )}
      {chevron && <Icon name="chevron-right" size={20} color="secondary" />}
    </>
  );
  if (!onPress) return <div className={s.itemRow}>{body}</div>;
  return (
    <button type="button" className={`${s.itemRow} ${s.itemPressable}`} onClick={onPress} aria-label={ariaLabel}>
      {body}
    </button>
  );
}

/* ── 파일 행 ────────────────────────────────────────────────
 * list : v5 자료 행 (과목 상세·강의자료) — Body 2 제목 · Caption 1 '4.2MB · 10.09' · 오른쪽 ↓
 * boxed: v5 첨부 상자 (과제 상세·공지 상세) — 회색 면 r12 · 파일 아이콘 · Body 3 Strong · Caption 2 */
type FileRowProps = {
  file: FileItem;
  variant?: 'list' | 'boxed';
  /** 메타에 날짜까지 ('4.2MB · 10.09') */
  withDate?: boolean;
};
export function FileRow({ file, variant = 'list', withDate }: FileRowProps) {
  const dl = useDownload(file);
  const action = file.kind === 'pdf' ? '다운로드' : file.kind === 'link' ? '열기' : '재생';
  const base = fileMeta(file, withDate);
  const meta = dl.status === 'loading' ? `다운로드 중 · ${Math.round(dl.progress)}%` : dl.status === 'done' ? `${base} · 받음` : base;
  const metaColor: TextColor = dl.status === 'loading' ? 'brand' : 'tertiary';
  const glyph = <DownloadGlyph file={file} status={dl.status} progress={dl.progress} />;

  if (variant === 'list') {
    return <ItemRow title={file.name} titleVariant="body-2" meta={meta} metaColor={metaColor} trailing={glyph} onPress={dl.start} ariaLabel={`${file.name} ${action}`} />;
  }
  return (
    <button type="button" className={s.fileBox} onClick={dl.start} aria-label={`${file.name} ${action}`}>
      <KindIcon kind={file.kind} />
      <span className={s.fileInfo}>
        <Text variant="body-3-strong" className="truncate" as="span" style={{ display: 'block' }}>
          {file.name}
        </Text>
        <Text variant="caption-2" color={metaColor} className="truncate tnum" as="span" style={{ display: 'block' }}>
          {meta}
        </Text>
      </span>
      <span className={s.fileAction} aria-hidden>
        {glyph}
      </span>
    </button>
  );
}

/* ── v5 정보 상자 (회색 면 r16 · 라벨 Body 3 tertiary 64 · 값 Body 3 Strong) ──
 * 과제 상세 '마감 | 제출 형식 | 제출 상태' · 제출 완료 '과제 | 파일 | 제출 시각' */
export function InfoTable({ rows }: { rows: { label: string; value: ReactNode; color?: TextColor }[] }) {
  return (
    <dl className={s.infoTable}>
      {rows.map((r) => (
        <div key={r.label} className={s.infoLine}>
          <Text variant="body-3" color="tertiary" as="dt" className={s.infoLabel}>
            {r.label}
          </Text>
          <Text variant="body-3-strong" color={r.color ?? 'primary'} as="dd" className={`${s.infoValue} tnum`}>
            {r.value}
          </Text>
        </div>
      ))}
    </dl>
  );
}

/* ── 본문 텍스트 (Body 2 secondary · 줄바꿈 유지) ─────────── */
export function BodyText({ children }: { children: string }) {
  return (
    <Text variant="body-2" color="secondary" as="p" className={s.bodyText}>
      {children}
    </Text>
  );
}
