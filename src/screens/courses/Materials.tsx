import { useParams } from 'react-router';
import { Chip, Screen, Text, TopNav } from '@/ui';
import { P } from '@/app/paths';
import { allFiles, getCourse } from './data';
import { FileRow } from './parts';
import s from './Courses.module.css';

/**
 * 강의자료 — Figma v5 684:6453
 * '과목 · N개' · 주차별 묶음(Body 2 Strong + 오늘 배지) · 자료 행(Body 2 · Caption 1 용량 · ↓).
 * 다운로드는 진행 링 → 완료 토스트로 흉내 (링크·영상은 '다음 버전' 토스트).
 */
export function Materials() {
  const { id } = useParams();
  const { course, info } = getCourse(id);
  const files = allFiles(info);

  return (
    <Screen figma="684:6453" header={<TopNav title="강의자료" fallback={P.course(course.id)} />}>
      <div className={s.head}>
        <Text variant="caption-1" color="tertiary" as="p">
          {course.name} · {files.length}개
        </Text>
        <div className={s.groups}>
          {info.materials.map((g) => (
            <section key={g.label} className={s.group}>
              <div className={s.groupHead}>
                <Text variant="body-2-strong" as="h2" className="tnum">
                  {g.label}
                </Text>
                {g.today && <Chip tone="brand">오늘</Chip>}
              </div>
              <div>
                {g.items.map((f) => (
                  <FileRow key={f.id} file={f} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Screen>
  );
}
