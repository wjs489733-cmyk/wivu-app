import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Chip, Screen, Text, TopNav } from '@/ui';
import { P } from '@/app/paths';
import { getCourse, professorOf } from './data';
import { noticeKey, useCourses, useIsNew } from './store';
import { BodyText, FileRow } from './parts';
import s from './Courses.module.css';

/**
 * 공지 상세 — Figma v5 684:6409
 * '새 공지' 배지(들어올 때 안 읽은 글이었으면) · Title 2 · '과목 · 교수 · 일시 · 조회' · 본문 Body 2 · 첨부 상자.
 * 열면 읽음 처리 → 과목 상세의 NEW 배지·공지 숫자 강조 해제.
 */
export function NoticeDetail() {
  const { id, nid } = useParams();
  const { course, info } = getCourse(id);
  const markRead = useCourses((st) => st.markNoticeRead);
  const isNew = useIsNew(course.id);
  const n = info.notices.find((x) => x.id === nid) ?? info.notices[0];
  // 읽음 처리 전에 '새 공지'였는지 기억 (배지가 들어오자마자 사라지지 않게)
  const [wasNew] = useState(() => isNew(n));

  useEffect(() => {
    markRead(noticeKey(course.id, n.id));
  }, [markRead, course.id, n.id]);

  return (
    <Screen figma="684:6409" header={<TopNav title="공지" fallback={P.course(course.id)} />}>
      <article className={s.head}>
        {wasNew && <Chip tone="brand">새 공지</Chip>}
        <Text variant="title-2" as="h1" style={{ marginTop: wasNew ? 8 : 0 }}>
          {n.title}
        </Text>
        <Text variant="caption-1" color="tertiary" as="p" className="tnum" style={{ marginTop: 4 }}>
          {course.name} · {professorOf(course)} 교수 · {n.dateFull} · 조회 {n.views}
        </Text>
        <div style={{ marginTop: 20 }}>
          <BodyText>{n.body}</BodyText>
        </div>
        {n.attachment && (
          <div style={{ marginTop: 20 }}>
            <FileRow file={n.attachment} variant="boxed" />
          </div>
        )}
      </article>
    </Screen>
  );
}
