import { useParams } from 'react-router';
import { Button, Chip, CtaBar, Screen, Section, Text, TopNav } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useNow } from '@/data/clock';
import { atDetail, ddayCount, dueDetail, dueShort, getAssignment, isClosed, isPastDue } from './data';
import { useSubmissionOf } from './store';
import { BodyText, FileRow, InfoTable } from './parts';
import s from './Courses.module.css';

/**
 * 과제 상세 — Figma v5 684:6198
 * 배지(마감) · Title 2 · '과목 · 개인 과제 · 20점' · 정보 상자(마감 / 제출 형식 / 제출 상태) · 과제 내용 · 첨부.
 * '제출하기' → 과제 제출 모달(684:6271). 제출 후에는 정보 상자에 제출 파일·시각 + '다시 제출하기'(Secondary).
 * 실시간: '오늘/내일 23:59 마감'은 지금 기준 · 마감이 지나면 미제출 배지 '마감 지남'(Error soft) · 제출 버튼은 '마감된 과제예요'(비활성)
 */
export function AssignmentDetail() {
  const { id, aid } = useParams();
  const { course, a } = getAssignment(id, aid);
  const nav = useNav();
  const now = useNow();
  const submission = useSubmissionOf(course.id)(a);
  const done = !!submission;
  const today = ddayCount(a.due, now) === 0;
  const closed = isClosed(a, now);

  const openSubmit = () => nav.modal(P.assignmentSubmit(course.id, a.id));

  const badge = done ? (
    <Chip tone="brand">제출 완료</Chip>
  ) : isPastDue(a, now) ? (
    <Chip tone="dangerSoft">마감 지남</Chip>
  ) : (
    <Chip tone={today ? 'dangerSoft' : 'neutral'}>{dueShort(a.due, now)} 마감</Chip>
  );

  const files = submission?.files ?? [];
  const fileLine = files.length ? `${files[0].name}${files.length > 1 ? ` 외 ${files.length - 1}개` : ''}` : '';
  const rows = [
    { label: '마감', value: dueDetail(a.due) },
    { label: '제출 형식', value: a.format },
    submission
      ? { label: '제출 상태', value: `제출 완료 · ${atDetail(submission.at)}` }
      : { label: '제출 상태', value: closed ? '제출하지 않았어요' : '아직 제출하지 않았어요', color: closed ? ('secondary' as const) : ('error' as const) },
    ...(submission ? [{ label: '제출 파일', value: <span className="truncate" style={{ display: 'block' }}>{fileLine}</span> }] : []),
    ...(submission?.memo ? [{ label: '메모', value: submission.memo }] : []),
  ];

  return (
    <Screen
      figma="684:6198"
      header={<TopNav title="과제" fallback={P.course(course.id)} />}
      footer={
        <CtaBar>
          {closed ? (
            <Button block disabled>
              마감된 과제예요
            </Button>
          ) : done ? (
            <Button variant="secondary" block onClick={openSubmit}>
              다시 제출하기
            </Button>
          ) : (
            <Button block onClick={openSubmit}>
              제출하기
            </Button>
          )}
        </CtaBar>
      }
    >
      <div className={s.head}>
        {badge}
        <Text variant="title-2" as="h1" style={{ marginTop: 8 }}>
          {a.title}
        </Text>
        <Text variant="body-3" color="secondary" as="p" style={{ marginTop: 4 }}>
          {course.name} · {a.kind} · {a.points}
        </Text>
        <div style={{ marginTop: 20 }}>
          <InfoTable rows={rows} />
        </div>
      </div>

      <div className={s.sections}>
        <Section title="과제 내용" padded={false} style={{ gap: 4 }}>
          <div className={s.inset}>
            <BodyText>{a.desc}</BodyText>
            {a.attachments.length > 0 && (
              <div className={s.attachList}>
                {a.attachments.map((f) => (
                  <FileRow key={f.id} file={f} variant="boxed" />
                ))}
              </div>
            )}
          </div>
        </Section>
      </div>
    </Screen>
  );
}
