import { useParams } from 'react-router';
import { Button, Card, Chip, CtaBar, Icon, Screen, Text, TopNav } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { dday, ddayCount, dueFull, getAssignment } from './data';
import { useSubmissionOf } from './store';
import { BodyText, FileRow, InfoLine } from './parts';
import s from './Courses.module.css';

/**
 * 과제 상세 — Figma 398:7694 (Course_v4_03_AssignmentDetail)
 * 제출 후(useApp.assignmentSubmitted / 로컬 제출 기록)에는 제출 내역 + '다시 제출하기'.
 * '과제 제출하기' → 과제 제출 모달 (MOVE_IN TOP)
 */
export function AssignmentDetail() {
  const { id, aid } = useParams();
  const { course, a } = getAssignment(id, aid);
  const nav = useNav();
  const submission = useSubmissionOf(course.id)(a);
  const done = !!submission;
  const n = ddayCount(a.due);

  const openSubmit = () => nav.modal(P.assignmentSubmit(course.id, a.id));

  return (
    <Screen
      figma="398:7694"
      header={<TopNav title="과제" fallback={P.course(course.id)} />}
      footer={
        <CtaBar>
          {a.closed ? (
            <Button block disabled>
              마감된 과제예요
            </Button>
          ) : done ? (
            <Button variant="soft" block leadingIcon="edit" onClick={openSubmit}>
              다시 제출하기
            </Button>
          ) : (
            <Button block onClick={openSubmit}>
              과제 제출하기
            </Button>
          )}
        </CtaBar>
      }
    >
      <div className={s.page}>
        <div className={s.pageHead}>
          <div className={s.chips}>
            <Chip tone="brand">{course.name}</Chip>
            {done ? (
              <Chip tone="pulse" icon="check">
                제출 완료
              </Chip>
            ) : a.closed ? (
              <Chip tone="neutral">마감</Chip>
            ) : (
              <Chip tone="dangerSoft">미제출</Chip>
            )}
          </div>
          <Text variant="title-1" as="h1">
            {a.title}
          </Text>
        </div>

        {submission && (
          <Card variant="soft" className={s.submittedBox}>
            <div className={s.submittedHead}>
              <Icon name="status-present" size={20} color="brand" />
              <Text variant="label" className="tnum">
                제출 완료 · {submission.at.replace(/^(\d{2})\.(\d{2})/, (_m, mm, dd) => `${+mm}월 ${+dd}일`)}
              </Text>
            </div>
            <div className={s.submittedFiles}>
              {submission.files.map((f) => (
                <div key={f.name} className={s.fileBoxed} data-static>
                  <span className={s.fileIcon} data-tone="brand">
                    <Icon name="file" size={20} />
                  </span>
                  <span className={s.fileInfo}>
                    <Text variant="label" className="truncate" as="span" style={{ display: 'block' }}>
                      {f.name}
                    </Text>
                    <Text variant="caption-2" color="brand" as="span" style={{ display: 'block' }}>
                      PDF · {f.size} · 제출됨
                    </Text>
                  </span>
                </div>
              ))}
            </div>
            {submission.memo ? (
              <Text variant="caption-1" color="secondary" as="p" lines={2}>
                메모 · {submission.memo}
              </Text>
            ) : null}
            {!a.closed && (
              <Text variant="caption-2" color="secondary" as="p">
                마감 전까지 다시 제출할 수 있어요. 마지막으로 제출한 파일로 평가돼요.
              </Text>
            )}
          </Card>
        )}

        <Card variant="subtle" className={s.infoTable}>
          <InfoLine label="마감" aside={<Chip tone={a.closed ? 'neutral' : n === 0 ? 'danger' : n <= 3 ? 'dangerSoft' : 'neutral'} pill>{dday(a.due)}</Chip>}>
            {dueFull(a.due)}
          </InfoLine>
          <InfoLine label="배점">{a.points}</InfoLine>
          <InfoLine label="제출 형식">{a.format}</InfoLine>
          <InfoLine label="제출 방식">{a.method}</InfoLine>
        </Card>

        <div className={s.bleedDivider} role="separator" />

        <div className={s.block}>
          <Text variant="title-2" as="h2">
            과제 설명
          </Text>
          <BodyText>{a.desc}</BodyText>
        </div>

        {a.attachments.length > 0 && (
          <>
            <div className={s.bleedDivider} role="separator" />
            <div className={s.block}>
              <Text variant="title-2" as="h2">
                첨부파일
              </Text>
              {a.attachments.map((f) => (
                <FileRow key={f.id} file={f} variant="boxed" />
              ))}
            </div>
          </>
        )}
      </div>
    </Screen>
  );
}
