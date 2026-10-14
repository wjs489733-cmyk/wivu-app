import { useEffect } from 'react';
import { useParams } from 'react-router';
import { Chip, Icon, Screen, Text, TopNav } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { getCourse, professorOf } from './data';
import { noticeKey, useCourses } from './store';
import { BodyText, FileRow } from './parts';
import s from './Courses.module.css';

/**
 * 공지 상세 — Figma 398:7759 (Course_v4_06_NoticeDetail)
 * 열면 읽음 처리(N 배지·'새 글' 해제). 하단 '다음 글'(마지막 글이면 '이전 글')로 이어 읽기.
 */
export function NoticeDetail() {
  const { id, nid } = useParams();
  const { course, info } = getCourse(id);
  const nav = useNav();
  const markRead = useCourses((st) => st.markNoticeRead);
  const idx = Math.max(0, info.notices.findIndex((n) => n.id === nid));
  const n = info.notices[idx];
  const next = info.notices[idx + 1];
  const prev = info.notices[idx - 1];
  const sibling = next ?? prev;

  useEffect(() => {
    markRead(noticeKey(course.id, n.id));
  }, [markRead, course.id, n.id]);

  return (
    <Screen figma="398:7759" header={<TopNav title="공지" fallback={P.course(course.id)} />}>
      <article className={s.noticePage}>
        <div className={s.chips}>
          <Chip tone="brand">{course.name}</Chip>
          <Chip tone="neutral">과목 공지</Chip>
        </div>
        <Text variant="title-1" as="h1">
          {n.title}
        </Text>
        <div className={s.author}>
          <span className={s.authorAvatar}>
            <Icon name="user" size={20} />
          </span>
          <div className={s.cardInfo}>
            <Text variant="label" as="p">
              {professorOf(course)} 교수
            </Text>
            <Text variant="caption-2" color="tertiary" as="p" className="tnum">
              {n.dateFull} · 조회 {n.views}
            </Text>
          </div>
        </div>
        <BodyText>{n.body}</BodyText>
        {n.attachment && <FileRow file={n.attachment} variant="boxed" />}
        {sibling && (
          <button type="button" className={s.nextNotice} onClick={() => nav.push(P.courseNotice(course.id, sibling.id))}>
            <Text variant="caption-2" color="tertiary" style={{ flexShrink: 0 }}>
              {next ? '다음 글' : '이전 글'}
            </Text>
            <Text variant="label" className="truncate" style={{ flex: 1 }}>
              {sibling.title}
            </Text>
            <Icon name="chevron-right" size={20} color="primary" />
          </button>
        )}
      </article>
    </Screen>
  );
}
