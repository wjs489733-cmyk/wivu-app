import { useParams } from 'react-router';
import { Chip, Screen, Text, TopNav } from '@/ui';
import { P } from '@/app/paths';
import { useNow } from '@/data/clock';
import { getCourse, isTodayGroup, visibleMaterials } from './data';
import { FileRow } from './parts';
import s from './Courses.module.css';

/**
 * 강의자료 — Figma v5 684:6453
 * '과목 · N개' · 주차별 묶음(Body 2 Strong + 오늘 배지) · 자료 행(Body 2 · Caption 1 용량 · ↓).
 * 다운로드는 진행 링 → 완료 토스트로 흉내 (링크·영상은 '다음 버전' 토스트).
 * 실시간: 이미 올라온 자료만 · '오늘' 배지 = 묶음 날짜가 실제 오늘
 */
export function Materials() {
  const { id } = useParams();
  const { course, info } = getCourse(id);
  const now = useNow();
  const groups = visibleMaterials(info, now);
  const files = groups.flatMap((g) => g.items);

  return (
    <Screen figma="684:6453" header={<TopNav title="강의자료" fallback={P.course(course.id)} />}>
      <div className={s.head}>
        <Text variant="caption-1" color="tertiary" as="p">
          {course.name} · {files.length}개
        </Text>
        <div className={s.groups}>
          {groups.map((g) => (
            <section key={g.label} className={s.group}>
              <div className={s.groupHead}>
                <Text variant="body-2-strong" as="h2">
                  {g.label}
                </Text>
                {isTodayGroup(g, now) && <Chip tone="brand">오늘</Chip>}
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
