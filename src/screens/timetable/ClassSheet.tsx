import { BottomSheet, Button, Chip, Icon, Text } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { addDays, dayDiff, minOfDay, useNow } from '@/data/clock';
import { classesOn, isHoliday, phaseOf, type ClassSession } from '@/data/today';
import { DOW, iso, longDate, nextClassDate, periodNote, slotText, toMin, type TTCourse } from './data';
import { InfoBox, InfoRow, MapLink } from './parts';
import s from './Timetable.module.css';

/** 이 과목의 '인증 창이 아직 안 열린' 다음 회차 (오늘 포함 · 휴강·보강 반영, data/today.ts) */
function nextCourseSession(courseId: string, now: Date): ClassSession | null {
  for (let i = 0; i <= 14; i++) {
    const x = classesOn(addDays(now, i)).find((y) => y.courseId === courseId && phaseOf(y, now) === 'upcoming');
    if (x) return x;
  }
  return null;
}

/**
 * 수업 상세 시트 — Figma v5 685:6329 (시간표 · 수업 상세 시트)
 * 배지 · 과목명(Title 2) · 정보 박스(시간/장소+지도/담당) · [과목 상세] [출석 인증]
 * 배지·버튼은 실제 시각으로 매 분 계산 (data/today.ts: 그 과목 오늘 회차 phaseOf · 다음 회차)
 *   인증 창 안(시작 20분 전 ~ 10분 후): 시작 전 '곧 시작 · 10:00'(Figma) / 시작 뒤 '인증 가능 · 10:10 마감' → 출석 번호 시트(679:5188)
 *   오늘 회차 창 전: '오늘 13:00 시작' + 인증 시간 안내 · 완료: '출석 완료 · 09:52 인증'
 *   창이 닫혔는데 기록 없음: '인증 마감' + '출석 인증 시간이 지났어요' + [이의 신청](과목 출석 ?sheet=appeal)
 *   오늘 회차 없음: '다음 수업 10월 12일 (월) 10:30' (휴강일 건너뜀 · 보강 회차는 '· 보강')
 * 직접 추가한 과목: 과목 상세가 없어 [시간표에서 빼기]만.
 */
export function ClassSheet({ open, course, onClose, onAttend, onRemove }: { open: boolean; course: TTCourse | null; onClose: () => void; onAttend: () => void; onRemove: (c: TTCourse) => void }) {
  return (
    <BottomSheet open={open && !!course} onClose={onClose} label="수업 상세">
      {course && <SheetBody course={course} onClose={onClose} onAttend={onAttend} onRemove={onRemove} />}
    </BottomSheet>
  );
}

type Action = 'attend' | 'done' | 'appeal' | 'wait';

function SheetBody({ course: c, onClose, onAttend, onRemove }: { course: TTCourse; onClose: () => void; onAttend: () => void; onRemove: (c: TTCourse) => void }) {
  const nav = useNav();
  const now = useNow();
  const m = minOfDay(now);
  // 수강신청 과목의 오늘 회차 (휴강일이면 없음 · 화요일 보강 포함)
  const today = c.core && !c.online ? (classesOn(now).find((x) => x.courseId === c.id) ?? null) : null;
  const rec = useApp((st) => (today ? st.attended[today.key] : undefined));

  let badge: { text: string; tone: 'brand' | 'neutral' | 'dangerSoft' };
  let note: string | null = null;
  let action: Action = 'wait';

  if (c.online) {
    badge = { text: '사이버 강의', tone: 'neutral' };
    if (c.core) note = '사이버 강의는 강의 영상 시청으로 출석이 처리돼요';
  } else if (c.core) {
    const phase = today ? phaseOf(today, now) : null;
    if (today && rec) {
      badge = { text: `출석 완료 · ${rec.time} 인증`, tone: 'neutral' };
      action = 'done';
    } else if (today && phase === 'open') {
      badge = m < today.startMin ? { text: `곧 시작 · ${today.start}`, tone: 'brand' } : { text: `인증 가능 · ${today.closes} 마감`, tone: 'brand' };
      action = 'attend';
    } else if (today && phase === 'upcoming') {
      badge = { text: `오늘 ${today.start} ${today.makeup ? '보강' : '시작'}`, tone: 'brand' };
      note = `출석 인증은 ${today.opens}부터 ${today.closes}까지 열려요`;
    } else if (today) {
      // 인증 창이 닫혔는데 기록 없음 (수업 중 · 수업 끝)
      badge = { text: '인증 마감', tone: 'dangerSoft' };
      note = '출석 인증 시간이 지났어요';
      action = 'appeal';
    } else {
      const next = nextCourseSession(c.id, now);
      const off = isHoliday(now) && c.slots.some((sl) => sl.day === DOW[now.getDay()]);
      badge = next ? { text: `다음 수업 ${longDate(iso(next.day))} ${next.start}${next.makeup ? ' · 보강' : ''}`, tone: 'neutral' } : { text: '이번 주 수업 없음', tone: 'neutral' };
      const when = next ? (dayDiff(now, next.day) === 1 ? '내일 ' : '수업 날 ') : '';
      const win = next ? `출석 인증은 ${when}${next.opens}부터 ${next.closes}까지 열려요` : null;
      note = off ? ['오늘은 휴강이에요', win].filter(Boolean).join(' · ') : win;
    }
  } else {
    // 직접 추가한 수업 (출석 대상 아님) — 요일 시간표 기준 다음 수업
    const next = nextClassDate(c, now);
    const isToday = next?.date === iso(now);
    if (next && isToday && m >= toMin(next.slot.start)) badge = { text: `수업 중 · ${next.slot.end}까지`, tone: 'brand' };
    else if (next && isToday) badge = { text: `오늘 ${next.slot.start} 시작`, tone: 'brand' };
    else if (next) badge = { text: `다음 수업 ${longDate(next.date)} ${next.slot.start}`, tone: 'neutral' };
    else badge = { text: '이번 주 수업 없음', tone: 'neutral' };
  }

  const pn = c.slots.length === 1 ? periodNote(c.slots[0]) : null;
  const time = c.online ? '사이버 강의 · 시간 무관' : `${slotText(c)}${pn ? ` · ${pn}` : ''}`;
  const prof = c.online && c.professor === '사이버 강의' ? '사이버 강의' : `${c.professor} 교수`;

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
            {action === 'appeal' ? (
              <Button variant="primary" grow onClick={() => go(`${P.attendanceCourse(c.id)}?sheet=appeal`)}>
                이의 신청
              </Button>
            ) : (
              <Button variant="primary" grow disabled={action !== 'attend'} leadingIcon={action === 'done' ? 'check' : undefined} onClick={onAttend}>
                {action === 'done' ? '출석 완료' : '출석 인증'}
              </Button>
            )}
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
