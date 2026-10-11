import { Fragment, useState } from 'react';
import { useParams } from 'react-router';
import { Chip, Icon, Screen, Text, TopNav } from '@/ui';
import { P } from '@/app/paths';
import { allFiles, getCourse, kindLabel, totalSize, type FileKind } from './data';
import { FileRow } from './parts';
import s from './Courses.module.css';

type Filter = 'all' | FileKind;
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'pdf', label: 'PDF' },
  { value: 'link', label: '링크' },
  { value: 'video', label: '영상' },
];

/**
 * 강의자료 — Figma 398:7782 (Course_v4_07_Materials)
 * 주차별 그룹 + 종류 필터(전체/PDF/링크/영상). 다운로드는 진행률 → 완료 토스트로 흉내.
 */
export function Materials() {
  const { id } = useParams();
  const { course, info } = getCourse(id);
  const [filter, setFilter] = useState<Filter>('all');
  const files = allFiles(info);
  const groups = info.materials.map((g) => ({ ...g, items: g.items.filter((f) => filter === 'all' || f.kind === filter) })).filter((g) => g.items.length > 0);

  return (
    <Screen figma="398:7782" header={<TopNav title="강의자료" fallback={P.course(course.id)} />}>
      <div className={s.page} style={{ gap: 20 }}>
        <div className={s.summary}>
          <Chip tone="brand">{course.name}</Chip>
          <Text variant="caption-1" color="secondary" className="tnum">
            자료 {files.length}개 · 총 {totalSize(files)}
          </Text>
        </div>

        <div className={s.filters} role="group" aria-label="자료 종류">
          {FILTERS.map((f) => (
            <Chip key={f.value} size="m" pill tone="neutral" selected={filter === f.value} onSelect={() => setFilter(f.value)}>
              {f.label}
            </Chip>
          ))}
        </div>

        {groups.length === 0 ? (
          <div className={s.empty}>
            <Icon name="materials" size={24} color="tertiary" />
            <Text variant="subhead" as="p" align="center">
              {kindLabel[filter as FileKind]} 자료가 아직 없어요
            </Text>
            <Text variant="caption-1" color="tertiary" as="p" align="center">
              새 자료가 올라오면 알림으로 알려 드릴게요
            </Text>
          </div>
        ) : (
          groups.map((g, i) => (
            <Fragment key={g.label}>
              {i > 0 && <div className={s.bleedDivider} role="separator" />}
              <section className={s.blockTight}>
                <div className={s.groupHead}>
                  <Text variant="subhead" as="h2" className="tnum">
                    {g.label}
                  </Text>
                  {g.today && <span className={`${s.todayBadge} t-micro`}>오늘 업로드</span>}
                </div>
                <div className={s.fileList}>
                  {g.items.map((f) => (
                    <FileRow key={f.id} file={f} tone={g.today ? 'brand' : 'subtle'} />
                  ))}
                </div>
              </section>
            </Fragment>
          ))
        )}
      </div>
    </Screen>
  );
}
