import { motion } from 'motion/react';
import { useParams } from 'react-router';
import { Button, Screen, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { USER } from '@/data/core';
import { SUBMIT_TIME, getAssignment, sampleFileName } from './data';
import { useSubmissionOf } from './store';
import s from './Courses.module.css';

/**
 * 제출 완료 — Figma 400:7849 (Course_v4_05_Complete) · 브랜드 배경, DISSOLVE로 진입(replace)
 * '과목으로 돌아가기' → 과목 상세 (Figma INSTANT → 스택 초기화 후 이동)
 * '홈으로' → 홈 (홈은 assignmentSubmitted로 '제출 완료' 상태를 보여 줌)
 */
export function AssignmentDone() {
  const { id, aid } = useParams();
  const { course, a } = getAssignment(id, aid);
  const nav = useNav();
  const sub = useSubmissionOf(course.id)(a);
  const files = sub?.files ?? [{ name: sampleFileName(a.title, USER.name), size: '3.8MB' }];
  const time = sub?.at.split(' ')[1] ?? SUBMIT_TIME;
  const fileLine = `${files[0].name} · ${files[0].size}${files.length > 1 ? ` 외 ${files.length - 1}개` : ''}`;

  return (
    <Screen bg="brand" figma="400:7849" scroll={false}>
      <div className={s.doneWrap}>
        <div className={s.doneCenter}>
          <motion.div className={s.doneBadge} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}>
            <span className={s.doneHalo} />
            <span className={s.doneDisc}>
              <motion.svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--wivu-color-icon-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.35 }} />
              </motion.svg>
            </span>
          </motion.div>
          <Text variant="display" color="on-brand" as="h1" align="center" style={{ marginTop: 40 }}>
            제출 완료
          </Text>
          <Text variant="body" color="on-brand-muted" as="p" align="center" className="tnum" style={{ marginTop: 4 }}>
            {a.title} · {time} 제출
          </Text>
          <div className={s.doneInfo}>
            <Text variant="label" color="on-brand" as="p" className="truncate">
              {fileLine}
            </Text>
            <Text variant="caption-1" color="on-brand-muted" as="p" style={{ marginTop: 4 }}>
              마감 전까지 다시 제출할 수 있어요
            </Text>
          </div>
        </div>
        <div className={s.doneActions}>
          <Button variant="onBrand" block onClick={() => nav.reset(P.course(course.id))}>
            과목으로 돌아가기
          </Button>
          <button type="button" className={`${s.doneLink} t-label`} onClick={() => nav.reset(P.home)}>
            홈으로
          </button>
        </div>
      </div>
    </Screen>
  );
}
