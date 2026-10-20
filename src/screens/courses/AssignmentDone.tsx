import { motion } from 'motion/react';
import { useParams } from 'react-router';
import { Button, Screen, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { TODAY_MD, USER } from '@/data/core';
import { SUBMIT_TIME, atDetail, getAssignment, sampleFileName } from './data';
import { useSubmissionOf } from './store';
import { InfoTable } from './parts';
import s from './Courses.module.css';

/**
 * 제출 완료 — Figma v5 684:6349 · 흰 배경, DISSOLVE로 진입(replace: 뒤로 가기로 제출 화면에 돌아가지 않음)
 * 체크 원 · '과제를 제출했어요' · 제출 내역 상자(과제 / 파일 / 제출 시각)
 * '확인' → 과제 상세로 돌아가 제출 상태 확인 (Figma는 두 버튼 모두 과목 상세 → 역할 구분)
 * '과목으로 돌아가기' → 과목 상세 (스택 초기화 후 이동)
 */
export function AssignmentDone() {
  const { id, aid } = useParams();
  const { course, a } = getAssignment(id, aid);
  const nav = useNav();
  const sub = useSubmissionOf(course.id)(a);
  const files = sub?.files ?? [{ name: sampleFileName(a.title, USER.name), size: '3.8MB' }];
  const at = sub?.at ?? `${TODAY_MD} ${SUBMIT_TIME}`;
  const fileLine = `${files[0].name} · ${files[0].size}${files.length > 1 ? ` 외 ${files.length - 1}개` : ''}`;

  return (
    <Screen figma="684:6349" scroll={false} bottomSpace={0}>
      <div className={s.doneWrap}>
        <div className={s.doneCenter}>
          <motion.span className={s.doneCheck} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 20, delay: 0.08 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.3 }} />
            </svg>
          </motion.span>
          <Text variant="title-2" as="h1" align="center" style={{ marginTop: 20 }}>
            과제를 제출했어요
          </Text>
          <Text variant="body-3" color="secondary" as="p" align="center" style={{ marginTop: 6 }}>
            마감 전까지 다시 제출할 수 있어요.
          </Text>
          <div className={s.doneInfo}>
            <InfoTable
              rows={[
                { label: '과제', value: a.title },
                { label: '파일', value: <span className="truncate" style={{ display: 'block' }}>{fileLine}</span> },
                { label: '제출 시각', value: atDetail(at) },
              ]}
            />
          </div>
        </div>
        <div className={s.doneActions}>
          <Button block onClick={() => nav.back(P.assignment(course.id, a.id))}>
            확인
          </Button>
          <Button variant="tertiary" size="m" onClick={() => nav.reset(P.course(course.id))}>
            과목으로 돌아가기
          </Button>
        </div>
      </div>
    </Screen>
  );
}
