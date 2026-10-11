import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { BottomSheet, Button, Chip, Icon, IconButton, Screen, SearchField, Text, TopNav, toast } from '@/ui';
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
 * 수업 추가 — Figma 403:7931 (검색) · 403:8007 (추가 완료: 같은 라우트의 상태)
 * 검색어·필터로 카탈로그를 거르고, 내 시간표와 겹치는지 바로 검사한다.
 * '추가' → 로컬 스토어에 넣고 토스트 → 시간표 그리드에 블록이 생김. ?q=UX 로 Figma 상태 재현.
 */
export function TimetableAdd() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [filter, setFilter] = useState<Filter>('all');
  const [detail, setDetail] = useState<TTCourse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const mine = useMyCourses();
  const addCourse = useSchedule((st) => st.addCourse);
  const credits = mine.reduce((a, c) => a + c.credits, 0);

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
    toast(`${first ? `${first.day} ${first.start} ` : ''}${c.name}${josa(c.name, '을', '를')} 시간표에 추가했어요`, 'check');
  };

  return (
    <Screen
      figma="403:7931"
      header={<TopNav title="수업 추가" leading="close" fallback={P.timetable} />}
      overlay={
        <BottomSheet open={detailOpen} onClose={() => setDetailOpen(false)} label="수업 정보">
          {detail && (
            <CourseCheck
              course={detail}
              status={status(detail)}
              credits={credits}
              mine={mine}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
        <div style={{ paddingInline: 16 }}>
          <SearchField value={q} onChange={setQ} placeholder="과목명이나 교수명으로 검색" />
        </div>

        <div className={s.filters} role="tablist" aria-label="과목 구분">
          {FILTERS.map((f) => (
            <Chip key={f.value} size="m" pill tone="neutral" selected={filter === f.value} onSelect={() => setFilter(f.value)}>
              {f.label}
            </Chip>
          ))}
        </div>

        <div className={s.count}>
          <Text variant="caption-1" color="secondary">
            {query ? '검색 결과' : '개설 과목'}
          </Text>
          <Text variant="caption-1-strong" color="brand" tnum>
            {results.length}
          </Text>
        </div>

        {results.length ? (
          <div className={s.results}>
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
                    <Text variant="subhead" className="truncate">
                      <Highlight text={c.name} q={q.trim()} />
                    </Text>
                    <Text variant="caption-2" color="secondary" className="truncate">
                      {c.online ? slotText(c) : `${c.professor} 교수 · ${slotText(c)} · ${c.room}`}
                    </Text>
                    <Text variant="caption-2" color={clash ? 'error' : 'tertiary'} className="truncate">
                      {c.kind} {c.credits}학점{clash ? ` · ${clash}${josa(clash, '과', '와')} 시간 겹침` : ''}
                    </Text>
                  </button>
                  {st.kind === 'ok' ? (
                    <Button size="s" onClick={() => add(c)}>
                      추가
                    </Button>
                  ) : (
                    <Button size="s" disabled>
                      {st.kind === 'added' ? '추가됨' : '불가'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ paddingInline: 16 }}>
            <EmptyNote icon="search" title={`‘${q.trim()}’에 맞는 수업이 없어요`} desc="과목명이나 교수명으로 다시 검색해 보세요" />
          </div>
        )}
      </div>
    </Screen>
  );
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className={s.hl}>{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}

/* ── 수업 정보 + 겹침 검사 시트 ─────────────────────────────── */
function CourseCheck({ course: c, status, credits, mine, onClose, onAdd }: { course: TTCourse; status: Status; credits: number; mine: TTCourse[]; onClose: () => void; onAdd: () => void }) {
  const clashIds = new Set(status.kind === 'clash' ? status.conflicts.map((x) => x.course.id) : []);
  const head =
    status.kind === 'added'
      ? { icon: 'check' as const, bg: 'var(--wivu-color-bg-brand-soft)', fg: 'brand', text: '이미 내 시간표에 있는 수업이에요' }
      : status.kind === 'clash'
        ? {
            icon: 'warning' as const,
            bg: 'var(--wivu-color-bg-subtle)',
            fg: 'error',
            text: `${status.conflicts[0].course.name}${josa(status.conflicts[0].course.name, '과', '와')} 시간이 겹쳐요`,
            sub: status.conflicts.map((x) => `${x.course.name} ${x.slot.day} ${x.slot.start}–${x.slot.end}`).join(' · '),
          }
        : { icon: 'check' as const, bg: 'var(--wivu-color-bg-pulse-soft)', fg: 'pulse', text: c.online ? '사이버 강의라 시간이 겹치지 않아요' : '내 시간표와 겹치는 수업이 없어요' };

  return (
    <>
      <div className={s.sheetHead} style={{ marginTop: -2 }}>
        <div className={s.sheetTitle}>
          <Chip tone={c.online ? 'pulse' : 'brand'}>{c.online ? `사이버 · ${c.kind} ${c.credits}학점` : `${c.kind} ${c.credits}학점`}</Chip>
          <Text variant="title-1" as="h2">
            {c.name}
          </Text>
        </div>
        <div style={{ margin: '-10px -10px 0 0' }}>
          <IconButton icon="close" label="닫기" onPress={onClose} />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <InfoBox>
          <InfoRow icon="clock" label="시간" value={slotText(c, ' – ')} />
          <InfoRow icon="location" label="장소" value={c.room} />
          <InfoRow icon="user" label="담당" value={c.online ? '사이버 강의' : `${c.professor} 교수`} />
        </InfoBox>
      </div>

      <div className={s.check} style={{ marginTop: 12 }} role="status">
        <div className={s.checkHead}>
          <span className={s.checkIcon} style={{ background: head.bg }}>
            <Icon name={head.icon} size={16} color={head.fg} />
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <Text variant="label" color={status.kind === 'clash' ? 'error' : 'primary'}>
              {head.text}
            </Text>
            {'sub' in head && (
              <Text variant="caption-2" color="secondary">
                {head.sub}
              </Text>
            )}
          </span>
        </div>
        {!c.online && <MiniWeek course={c} mine={mine} clashIds={clashIds} />}
        <Text variant="caption-1" color="secondary">
          {status.kind === 'added' ? `이번 학기 ${credits}학점` : `추가하면 이번 학기 ${credits}학점 → ${credits + c.credits}학점`}
        </Text>
      </div>

      <div style={{ marginTop: 20 }}>
        <Button block disabled={status.kind !== 'ok'} leadingIcon={status.kind === 'ok' ? 'plus' : undefined} onClick={onAdd}>
          {status.kind === 'ok' ? '시간표에 추가' : status.kind === 'added' ? '추가됨' : '시간이 겹쳐 추가할 수 없어요'}
        </Button>
      </div>
    </>
  );
}

/** 월~금 9–18시 미니 막대: 내 수업(회색) · 새 수업(브랜드) · 겹침(빨강) */
function MiniWeek({ course, mine, clashIds }: { course: TTCourse; mine: TTCourse[]; clashIds: Set<string> }) {
  const START = 9 * 60;
  const SPAN = 9 * 60;
  const pos = (start: string, end: string) => ({
    top: `${Math.max(0, ((toMin(start) - START) / SPAN) * 100)}%`,
    height: `${((toMin(end) - toMin(start)) / SPAN) * 100}%`,
  });
  return (
    <div className={s.mini} aria-hidden>
      {DAYS.map((d) => (
        <div key={d} className={s.miniCol}>
          <div className={s.miniTrack}>
            {mine
              .filter((m) => m.id !== course.id)
              .flatMap((m) => m.slots.filter((sl) => sl.day === d).map((sl) => ({ m, sl })))
              .map(({ m, sl }) => (
                <span key={m.id + sl.start} className={s.miniBar} data-kind={clashIds.has(m.id) ? 'clash' : 'mine'} style={pos(sl.start, sl.end)} />
              ))}
            {course.slots
              .filter((sl) => sl.day === d)
              .map((sl) => (
                <span key={sl.start} className={s.miniBar} data-kind="new" style={{ ...pos(sl.start, sl.end), opacity: clashIds.size ? 0.85 : 1 }} />
              ))}
          </div>
          <Text variant="caption-2" color="tertiary">
            {d}
          </Text>
        </div>
      ))}
    </div>
  );
}
