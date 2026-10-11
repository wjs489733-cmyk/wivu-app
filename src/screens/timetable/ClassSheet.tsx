import { BottomSheet, Button, Chip, Icon, IconButton, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { ATTENDANCE_WINDOW } from '@/data/core';
import { NOW_MIN, TODAY, longDate, nextClassDate, periodNote, slotText, toMin, type TTCourse } from './data';
import { InfoBox, InfoRow, MapChip } from './parts';
import s from './Timetable.module.css';

/**
 * 수업 상세 시트 — Figma 402:7846 (Schedule_v4_02_ClassSheet)
 * 서비스디자인: 출석 인증 가능(10:00–10:10) → AttendanceSheet로 이어짐
 * 다른 과목: 출석은 수업 시간에만 열린다는 안내 + 비활성 버튼
 * 직접 추가한 과목: '과목 상세' 대신 '시간표에서 빼기'
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

  // 상단 상태 칩
  let chip: { text: string; tone: 'brand' | 'neutral' | 'pulse' };
  if (isAttendCourse && attended) chip = { text: `출석 완료 · ${attendTime ?? '10:01'} 인증`, tone: 'pulse' };
  else if (isAttendCourse) chip = { text: `${ATTENDANCE_WINDOW.minutesToStart}분 후 시작 · 출석 ${ATTENDANCE_WINDOW.opens}–${ATTENDANCE_WINDOW.closes}`, tone: 'brand' };
  else if (next && isToday) {
    const left = toMin(next.slot.start) - NOW_MIN;
    chip = { text: `오늘 ${next.slot.start} 시작 · ${Math.floor(left / 60)}시간 ${left % 60}분 후`, tone: 'brand' };
  } else if (next) chip = { text: `다음 수업 ${longDate(next.date)} ${next.slot.start}`, tone: 'neutral' };
  else chip = { text: '사이버 강의', tone: 'pulse' };

  const time = c.slots.length === 1 ? `${slotText(c, ' – ')}${periodNote(c.slots[0]) ? ` (${periodNote(c.slots[0])})` : ''}` : slotText(c, ' – ');
  const prof = c.online ? '사이버 강의' : `${c.professor} 교수`;

  // 출석 버튼 상태 + 안내
  const canAttend = isAttendCourse && !attended;
  const note = isAttendCourse
    ? attended
      ? '오늘 출석이 이미 인증됐어요'
      : null
    : next
      ? `출석 인증은 수업 시작(${next.slot.start})부터 10분 동안 열려요`
      : '사이버 강의는 강의 영상 시청으로 출석이 처리돼요';

  return (
    <>
      <div className={s.sheetHead} style={{ marginTop: -2 }}>
        <div className={s.sheetTitle}>
          <Chip tone={chip.tone}>{chip.text}</Chip>
          <Text variant="title-1" as="h2">
            {c.name}
          </Text>
        </div>
        <div style={{ margin: '-10px -10px 0 0' }}>
          <IconButton icon="close" label="닫기" onPress={onClose} />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <InfoBox>
          <InfoRow icon="clock" label="시간" value={time} />
          <InfoRow
            icon="location"
            label="장소"
            value={c.room}
            trailing={
              !c.online && (
                <MapChip
                  onPress={() => {
                    onClose();
                    nav.push(P.campusMap);
                  }}
                />
              )
            }
          />
          <InfoRow icon="user" label="담당" value={`${prof} · ${c.kind} ${c.credits}학점`} />
        </InfoBox>
      </div>

      <div className={s.sheetActions}>
        {c.core ? (
          <Button
            variant="soft"
            grow
            onClick={() => {
              onClose();
              nav.push(P.course(c.id));
            }}
          >
            과목 상세
          </Button>
        ) : (
          <Button variant="outline" grow onClick={() => onRemove(c)}>
            시간표에서 빼기
          </Button>
        )}
        <Button variant="primary" grow disabled={!canAttend} leadingIcon={isAttendCourse && attended ? 'check' : undefined} onClick={onAttend}>
          {isAttendCourse && attended ? '출석 완료' : '출석 인증하기'}
        </Button>
      </div>
      {note && (
        <div className={s.sheetNote}>
          <Icon name="clock" size={16} color="tertiary" />
          <Text variant="caption-1" color="tertiary">
            {note}
          </Text>
        </div>
      )}
    </>
  );
}
