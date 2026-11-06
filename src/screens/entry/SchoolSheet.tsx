import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { BottomSheet, Chip, Icon, ListRow, Text, TextField, toast } from '@/ui';
import { HOME_LOCATION, NEAREST, NEARBY, SCHOOLS, type School } from './data';
import s from './Entry.module.css';

/**
 * 로그인 · 대학교 검색 — Figma v5 667:4592 (로그인 위 바텀시트, 같은 라우트의 상태)
 * 검색어 실시간 필터 · 거리순/가나다순 정렬 · 학교를 누르면 Selected school 설정 → 시트 닫힘(로그인 · 입력 상태 669:4633).
 * 딤을 누르면 닫힘(Figma BACK).
 * 11-06 사용자 요청: '학교 변경'으로 열었을 때 지금 고른 학교를 파란 글자 + 오른쪽 체크로 표시하고 목록 맨 위로 (검색 중엔 자리 그대로 표시만).
 */
type Sort = 'distance' | 'name';

export function SchoolSheet({ open, onClose, onPick, selected }: { open: boolean; onClose: () => void; onPick: (name: string) => void; selected?: string | null }) {
  return (
    <BottomSheet open={open} onClose={onClose} label="대학교 검색">
      <SheetBody onPick={onPick} selected={selected ?? null} />
    </BottomSheet>
  );
}

const byName = (a: School, b: School) => a.name.localeCompare(b.name, 'ko');
const byDistance = (a: School, b: School) => (a.km ?? Infinity) - (b.km ?? Infinity) || byName(a, b);

function SheetBody({ onPick, selected }: { onPick: (name: string) => void; selected: string | null }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('distance');
  const bodyRef = useRef<HTMLDivElement>(null);
  const layerH = useLayerHeight(bodyRef);

  const q = query.trim();
  const results = useMemo(() => {
    const base = q ? SCHOOLS.filter((sc) => sc.name.includes(q) || sc.location.includes(q)) : NEARBY;
    const sorted = [...base].sort(sort === 'distance' ? byDistance : byName);
    if (q || !selected) return sorted;
    // 검색 전: 지금 고른 학교를 맨 위로 (주변 목록에 없으면 전체 목록에서 찾아 붙임)
    const cur = SCHOOLS.find((sc) => sc.name === selected);
    return cur ? [cur, ...sorted.filter((sc) => sc.name !== selected)] : sorted;
  }, [q, sort, selected]);

  return (
    <div
      ref={bodyRef}
      className={s.sheetBody}
      // 시트를 화면 위쪽 끝(상태바 + 10 · Figma y 64)부터 아래 끝까지 채우고, 학교 목록만 안에서 스크롤 (시트 머리·검색칸은 고정)
      style={layerH ? { height: `calc(${layerH}px - var(--status-h) - 10px - 29px)` } : undefined}
    >
      <div className={s.sheetTop}>
        <Text variant="title-3" as="h2" align="center">
          대학교 검색
        </Text>
        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery('')}
          placeholder="학교 이름으로 검색"
          aria-label="학교 이름으로 검색"
          enterKeyHint="search"
          autoComplete="off"
          className={`${s.sheetSearch} ${s.v5Field}`}
        />
        <div className={s.locRow}>
          <Text variant="caption-1" color="tertiary" className="truncate" style={{ flex: 1 }}>
            현재 위치<span className={s.locGap} />
            {HOME_LOCATION}
          </Text>
          <button type="button" className={`${s.smallText} t-caption-1-strong`} onClick={() => toast('위치 설정은 다음 버전에서 열려요')}>
            설정
          </button>
        </div>
        <div className={s.listHead}>
          <Text variant="body-2-strong" as="h3">
            {q ? `검색 결과 ${results.length}` : '주변 대학교'}
          </Text>
          <div className={s.sortRow} role="group" aria-label="정렬">
            {(
              [
                ['distance', '거리순'],
                ['name', '가나다순'],
              ] as const
            ).map(([v, label]) => (
              <button key={v} type="button" className={`${s.smallText} ${sort === v ? 't-caption-1-strong' : 't-caption-1'}`} data-on={sort === v} aria-pressed={sort === v} onClick={() => setSort(v)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={s.schoolList}>
        {results.length ? (
          results.map((sc) => {
            const on = sc.name === selected;
            return (
              <ListRow
                key={sc.name}
                title={on ? <span style={{ color: 'var(--wivu-color-text-brand)' }}>{sc.name}</span> : sc.name}
                titleVariant={on ? 'body-1-strong' : undefined}
                titleAddon={sc.name === NEAREST ? <Chip tone="brand" className={s.nearBadge}>가장 가까움</Chip> : undefined}
                meta={sc.km !== undefined ? `${sc.location} · ${sc.km}km` : sc.location}
                trailing={on ? <Icon name="check" size={20} color="brand" label="선택한 학교" /> : undefined}
                onPress={() => onPick(sc.name)}
              />
            );
          })
        ) : (
          <div className={s.empty}>
            <Text variant="body-2-strong" as="p" align="center">
              찾는 학교가 없어요
            </Text>
            <Text variant="body-3" color="secondary" as="p" align="center">
              학교 이름을 다시 확인해 주세요.
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}

/** 시트 레이어(화면 전체) 높이 — 시트 본문을 Figma처럼 화면 끝까지 채우는 데 쓴다 */
function useLayerHeight(ref: RefObject<HTMLElement | null>) {
  const [h, setH] = useState<number | null>(null);
  useLayoutEffect(() => {
    const layer = ref.current?.closest<HTMLElement>('[role="dialog"]');
    if (!layer) return;
    setH(layer.clientHeight);
    const ro = new ResizeObserver(() => setH(layer.clientHeight));
    ro.observe(layer);
    return () => ro.disconnect();
  }, [ref]);
  return h;
}
