import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { BottomSheet, Button, Icon, Screen, SheetHead, Text, TextField, TopNav, toast } from '@/ui';
import { P } from '@/app/paths';
import { CATALOG, DAYS, josa, slotText, toMin, findConflicts, type Conflict, type TTCourse } from './data';
import { useMyCourses, useSchedule } from './store';
import { EmptyNote, InfoBox, InfoRow } from './parts';
import s from './Timetable.module.css';

type Filter = 'all' | '전공' | '교양' | 'online';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: '전공', label: '전공' },
  { value: '교양', label: '교양' },
  { value: 'online', label: '사이버' },
];

type Status = { kind: 'added' } | { kind: 'clash'; conflicts: Conflict[] } | { kind: 'ok' };

/**
 * 수업 추가 — Figma v5 685:6485 (검색) · 697:7430 (수업 정보 시트) · 685:6621 (추가 완료 토스트) — 모두 같은 라우트의 상태
 * 검색어·구분 버튼으로 카탈로그를 거르고, 내 시간표와 겹치는지 바로 검사한다.
 * '추가' → 로컬 스토어에 넣고 토스트 → 시간표 그리드에 점선 블록이 생김. ?q=UX 로 Figma 상태 재현.
 */
export function TimetableAdd() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [filter, setFilter] = useState<Filter>('all');
  const [detail, setDetail] = useState<TTCourse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const mine = useMyCourses();
  const addCourse = useSchedule((st) => st.addCourse);
  // 수강신청 학점(수강과목·마이와 같은 17학점) — 시간표에 직접 추가한 수업은 포함하지 않는다
  const enrolled = mine.filter((m) => m.core).reduce((a, c) => a + c.credits, 0);

  const status = (c: TTCourse): Status => {
    if (mine.some((m) => m.id === c.id)) return { kind: 'added' };
    const conflicts = findConflicts(c, mine);
    return conflicts.length ? { kind: 'clash', conflicts } : { kind: 'ok' };
  };

  const query = q.trim().toLowerCase();
  const results = useMemo(
    () =>
      CATALOG.filter((c) => {
        if (filter === 'online' ? !c.online : filter !== 'all' && c.kind !== filter) return false;
        if (!query) return true;
        return c.name.toLowerCase().includes(query) || c.professor.toLowerCase().includes(query);
      }),
    [filter, query],
  );

  const add = (c: TTCourse) => {
    addCourse(c.id);
    const first = c.slots[0];
    // Figma 685:6621 '목 13:00 UX/UI 프로토타이핑을 추가했어요'
    toast(`${first ? `${first.day} ${first.start} ` : ''}${c.name}${josa(c.name, '을', '를')} 추가했어요`, 'check');
  };

  return (
    <Screen
      figma="685:6485"
      header={<TopNav title="수업 추가" leading="close" fallback={P.timetable} />}
      overlay={
        <BottomSheet open={detailOpen} onClose={() => setDetailOpen(false)} label="수업 정보">
          {detail && (
            <CourseCheck
              course={detail}
              status={status(detail)}
              enrolled={enrolled}
              onClose={() => setDetailOpen(false)}
              onAdd={() => {
                add(detail);
                setDetailOpen(false);
              }}
            />
          )}
        </BottomSheet>
      }
    >
      <div className={s.add}>
        <TextField value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ('')} placeholder="과목명이나 교수명으로 검색" enterKeyHint="search" aria-label="수업 검색" />

        <div className={s.filters} role="group" aria-label="과목 구분">
          {FILTERS.map((f) => (
            <Button key={f.value} size="s" variant={filter === f.value ? 'primary' : 'secondary'} aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
              {f.label}
            </Button>
          ))}
        </div>

        <Text variant="caption-1-strong" color="secondary" as="p" className={s.count} tnum>
          {query ? '검색 결과' : '개설 과목'} {results.length}
        </Text>

        {results.length ? (
          <div>
            {results.map((c) => {
              const st = status(c);
              const clash = st.kind === 'clash' ? st.conflicts[0].course.name : null;
              return (
                <div key={c.id} className={s.result}>
                  <button
                    type="button"
                    className={s.resultMain}
                    onClick={() => {
                      setDetail(c);
                      setDetailOpen(true);
                    }}
                    aria-label={`${c.name} 수업 정보와 겹침 확인`}
                  >
                    <Text variant="body-1-strong" className="truncate">
                      {c.name}
                    </Text>
                    {/* 강의실까지 보이도록 2줄 허용 (375 폭에서 요일이 여러 개인 과목) */}
                    <Text variant="caption-1" color="tertiary" lines={2}>
                      {c.online ? slotText(c) : `${c.professor} 교수 · ${slotText(c)} · ${c.room}`}
                    </Text>
                    {clash ? (
                      <Text variant="caption-1" color="error" className="truncate">
                        {clash}
                        {josa(clash, '과', '와')} 시간이 겹쳐요
                      </Text>
                    ) : (
                      <Text variant="caption-1" color="tertiary" className="truncate">
                        {c.kind} {c.credits}학점{c.core ? ' · 수강 중' : ''}
                      </Text>
                    )}
                  </button>
                  {st.kind === 'ok' ? (
                    <Button size="s" onClick={() => add(c)} aria-label={`${c.name} 추가`}>
                      추가
                    </Button>
                  ) : (
                    <Button size="s" variant="secondary" disabled>
                      {st.kind === 'added' ? '추가됨' : '겹침'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyNote title={`‘${q.trim()}’에 맞는 수업이 없어요`} desc="과목명이나 교수명으로 다시 검색해 보세요" />
        )}
      </div>
    </Screen>
  );
}

/* ── 수업 정보 + 겹침 검사 시트 (Figma 697:7430) ─────────────── */
function CourseCheck({ course: c, status, enrolled, onClose, onAdd }: { course: TTCourse; status: Status; enrolled: number; onClose: () => void; onAdd: () => void }) {
  const mine = useMyCourses();
  const clashIds = new Set(status.kind === 'clash' ? status.conflicts.map((x) => x.course.id) : []);
  const prof = c.online && c.professor === '사이버 강의' ? '사이버 강의' : `${c.professor} 교수`;

  const banner =
    status.kind === 'added'
      ? {
          icon: 'check' as const,
          title: '이미 내 시간표에 있는 수업이에요',
          sub: c.core ? `수강신청한 과목이에요 · 이번 학기 ${enrolled}학점에 포함` : '직접 추가한 수업이에요 · 시간표 편집에서 뺄 수 있어요',
        }
      : status.kind === 'clash'
        ? {
            icon: 'warning' as const,
            title: `${status.conflicts[0].course.name}${josa(status.conflicts[0].course.name, '과', '와')} 시간이 겹쳐요`,
            sub: status.conflicts.map((x) => `${x.course.name} ${x.slot.day} ${x.slot.start}–${x.slot.end}`).join(' · '),
          }
        : {
            icon: 'check' as const,
            title: c.online ? '사이버 강의라 시간이 겹치지 않아요' : '내 시간표와 겹치는 수업이 없어요',
            sub: '시간표에만 추가돼요 · 수강신청 정정은 학교 포털에서 해요',
          };

  return (
    <>
      <SheetHead title={c.name} subtitle={c.online ? `사이버 · ${c.kind} ${c.credits}학점` : `${c.kind} ${c.credits}학점 · ${prof}`} onClose={onClose} />

      <InfoBox>
        <InfoRow label="시간" value={slotText(c)} />
        <InfoRow label="장소" value={c.room} />
        <InfoRow label="담당" value={prof} />
      </InfoBox>

      {!c.online && <MiniWeek course={c} mine={mine} clashIds={clashIds} />}

      <div className={s.banner} data-kind={status.kind} role="status">
        <Icon name={banner.icon} size={20} />
        <span className={s.bannerText}>
          <Text variant="body-3-strong" color={status.kind === 'added' ? 'brand' : status.kind === 'clash' ? 'error' : 'primary'}>
            {banner.title}
          </Text>
          <Text variant="caption-1" color="secondary">
            {banner.sub}
          </Text>
        </span>
      </div>

      <div style={{ marginTop: 20 }}>
        <Button block disabled={status.kind !== 'ok'} onClick={onAdd}>
          {status.kind === 'ok' ? '시간표에 추가' : status.kind === 'added' ? '추가됨' : '시간이 겹쳐 추가할 수 없어요'}
        </Button>
      </div>
    </>
  );
}

/** 월~금 미니 주간 (9–18시): 이 수업(파랑) · 겹치는 내 수업(빨강). 수업 있는 요일 이름 = 파랑 */
function MiniWeek({ course, mine, clashIds }: { course: TTCourse; mine: TTCourse[]; clashIds: Set<string> }) {
  const START = 9 * 60;
  const SPAN = 9 * 60;
  const pos = (start: string, end: string) => ({
    top: `${Math.max(0, ((toMin(start) - START) / SPAN) * 100)}%`,
    height: `${((toMin(end) - toMin(start)) / SPAN) * 100}%`,
  });
  return (
    <div className={s.mini} aria-hidden>
      {DAYS.map((d) => {
        const own = course.slots.filter((sl) => sl.day === d);
        return (
          <div key={d} className={s.miniCol}>
            <Text variant="caption-2-strong" color={own.length ? 'brand' : 'tertiary'}>
              {d}
            </Text>
            <div className={s.miniTrack}>
              {mine
                .filter((m) => clashIds.has(m.id))
                .flatMap((m) => m.slots.filter((sl) => sl.day === d).map((sl) => ({ m, sl })))
                .map(({ m, sl }) => (
                  <span key={m.id + sl.start} className={s.miniBar} data-kind="clash" style={pos(sl.start, sl.end)} />
                ))}
              {own.map((sl) => (
                <span key={sl.start} className={s.miniBar} data-kind="new" style={{ ...pos(sl.start, sl.end), opacity: clashIds.size ? 0.85 : 1 }} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
