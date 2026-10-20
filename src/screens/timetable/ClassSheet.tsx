import { BottomSheet, Button, Chip, Icon, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { ATTENDANCE_WINDOW } from '@/data/core';
import { TODAY, longDate, nextClassDate, periodNote, slotText, type TTCourse } from './data';
import { InfoBox, InfoRow, MapLink } from './parts';
import s from './Timetable.module.css';

/**
 * 수업 상세 시트 — Figma v5 685:6329 (시간표 · 수업 상세 시트)
 * 배지 · 과목명(Title 2) · 정보 박스(시간/장소+지도/담당) · [과목 상세] [출석 인증]
 * 서비스디자인: '곧 시작 · 10:00' → 출석 인증 = 출석 번호 시트(679:5188, AttendanceSheet)로 이어짐.
 * 다른 과목: 출석 인증은 수업 시간에만 열려 비활성 + 한 줄 안내(기능상 필요해 남김).
 * 직접 추가한 과목: 과목 상세가 없어 [시간표에서 빼기]만.
 */
export function ClassSheet({ open, course, onClose, onAttend, onRemove }: { open: boolean; course: TTCourse | null; onClose: () => void; onAttend: () => void; onRemove: (c: TTCourse) => void }) {
  return (
    <BottomSheet open={open && !!course} onClose={onClose} label="수업 상세">
      {course && <SheetBody course={course} onClose={onClose} onAttend={onAttend} onRemove={onRemove} />}
    </BottomSheet>
  );
}

function SheetBody({ course: c, onClose, onAttend, onRemove }: { course: TTCourse; onClose: () => void; onAttend: () => void; onRemove: (c: TTCourse) => void }) {
  const nav = useNav();
  const attended = useApp((st) => st.attendanceComplete);
  const attendTime = useApp((st) => st.attendanceTime);
  const isAttendCourse = c.id === ATTENDANCE_WINDOW.courseId;
  const next = nextClassDate(c);
  const isToday = next?.date === TODAY;

  // 상단 배지
  let badge: { text: string; tone: 'brand' | 'neutral' };
  if (isAttendCourse && attended) badge = { text: `출석 완료 · ${attendTime ?? '10:01'} 인증`, tone: 'neutral' };
  else if (isAttendCourse) badge = { text: `곧 시작 · ${ATTENDANCE_WINDOW.opens}`, tone: 'brand' };
  else if (next && isToday) badge = { text: `오늘 ${next.slot.start} 시작`, tone: 'brand' };
  else if (next) badge = { text: `다음 수업 ${longDate(next.date)} ${next.slot.start}`, tone: 'neutral' };
  else badge = { text: '사이버 강의', tone: 'neutral' };

  const pn = c.slots.length === 1 ? periodNote(c.slots[0]) : null;
  const time = c.online ? '사이버 강의 · 시간 무관' : `${slotText(c)}${pn ? ` · ${pn}` : ''}`;
  const prof = c.online && c.professor === '사이버 강의' ? '사이버 강의' : `${c.professor} 교수`;

  const canAttend = isAttendCourse && !attended;
  const note = !c.core
    ? null
    : isAttendCourse
      ? null
      : next
        ? `출석 인증은 수업 시작(${next.slot.start})부터 10분 동안 열려요`
        : '사이버 강의는 강의 영상 시청으로 출석이 처리돼요';

  const go = (to: string) => {
    onClose();
    nav.push(to);
  };

  return (
    <>
      <div className={s.sheetTop}>
        <Chip tone={badge.tone}>{badge.text}</Chip>
        <button type="button" className={s.sheetClose} onClick={onClose} aria-label="닫기">
          <Icon name="close" size={24} />
        </button>
      </div>
      <Text variant="title-2" as="h2" style={{ marginTop: 8 }}>
        {c.name}
      </Text>

      <div style={{ marginTop: 16 }}>
        <InfoBox>
          <InfoRow label="시간" value={time} />
          <InfoRow label="장소" value={c.room} trailing={!c.online && <MapLink onPress={() => go(P.campusMap)} />} />
          <InfoRow label="담당" value={`${prof} · ${c.kind} ${c.credits}학점`} />
        </InfoBox>
      </div>

      <div className={s.sheetActions}>
        {c.core ? (
          <>
            <Button variant="secondary" grow onClick={() => go(P.course(c.id))}>
              과목 상세
            </Button>
            <Button variant="primary" grow disabled={!canAttend} leadingIcon={isAttendCourse && attended ? 'check' : undefined} onClick={onAttend}>
              {isAttendCourse && attended ? '출석 완료' : '출석 인증'}
            </Button>
          </>
        ) : (
          // 직접 추가한 수업은 수강신청 과목이 아니라 출석 대상이 아님 → 빼기만
          <Button variant="secondary" block onClick={() => onRemove(c)}>
            시간표에서 빼기
          </Button>
        )}
      </div>
      {note && (
        <Text variant="caption-1" color="tertiary" as="p" className={s.sheetNote}>
          {note}
        </Text>
      )}
    </>
  );
}
