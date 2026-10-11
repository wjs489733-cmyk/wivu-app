import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { BottomSheet, Icon, IconButton, Screen, SearchField, Text, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { EntryHeader, Hero, SchoolRow, TextLink } from './parts';
import { HOME_LOCATION, HOME_LOCATION_FULL, HOME_REGION, NEARBY, REGIONS, SCHOOLS, type Region, type School } from './data';
import s from './Entry.module.css';

/**
 * 학교 선택 — Figma 352:1158 (+ 지역 선택 시트 416:12064)
 * 학교를 누르면 Selected school 설정 → 로그인 (Figma SET_VARIABLE + NAVIGATE)
 */
export function SchoolSelect() {
  const nav = useNav();
  const setSchool = useApp((st) => st.setSchool);
  const [q] = useSearchParams();
  const [sheet, setSheet] = useState(q.get('sheet') === '1');

  const pick = (sc: School) => {
    setSchool(sc.name);
    nav.push(P.login);
  };

  return (
    <Screen
      figma="352:1158"
      header={<EntryHeader title="학교 선택" fallback={P.intro(3)} />}
      overlay={<RegionSheet open={sheet} onClose={() => setSheet(false)} />}
    >
      <div className={s.page}>
        <Hero title={'어느 학교에\n다니고 계신가요?'} desc="학교를 선택하면 학교 계정으로 로그인할 수 있어요." />
        <div style={{ marginTop: 24 }}>
          <button type="button" className={`${s.fakeSearch} t-body`} onClick={() => nav.fade(P.schoolSearch, { replace: false })}>
            학교 이름 검색
          </button>
        </div>
        <div className={s.listHead}>
          <Text variant="label" as="h3">
            가까운 학교
          </Text>
          <button type="button" className={`${s.locBtn} t-caption-2`} onClick={() => setSheet(true)}>
            <Icon name="location" size={16} color="primary" />
            {HOME_LOCATION} 기준 ·
            <Text variant="caption-2-strong" color="brand">
              변경
            </Text>
          </button>
        </div>
        <div className={s.schoolList}>
          {NEARBY.map((sc) => (
            <SchoolRow key={sc.name} school={sc} selected={sc.nearest} onPress={() => pick(sc)} />
          ))}
        </div>
      </div>
    </Screen>
  );
}

/** 지역 선택 시트 — 416:12064 */
function RegionSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNav();
  const go = (region?: Region) => {
    onClose();
    if (region === HOME_REGION) return;
    setTimeout(() => nav.fade(region ? `${P.schoolSearch}?region=${encodeURIComponent(region)}` : P.schoolSearch, { replace: false }), 220);
  };
  return (
    <BottomSheet open={open} onClose={onClose} label="지역 선택">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -4 }}>
        <Text variant="title-2" as="h2">
          지역 선택
        </Text>
        <div style={{ marginRight: -10 }}>
          <IconButton icon="close" label="닫기" onPress={onClose} />
        </div>
      </div>
      <button
        type="button"
        className={s.locCard}
        style={{ marginTop: 12 }}
        onClick={() => {
          onClose();
          toast(`현재 위치: ${HOME_LOCATION_FULL}`, 'location');
        }}
      >
        <Icon name="location" size={20} color="primary" />
        <span style={{ flex: 1 }}>
          <Text variant="headline" color="brand" as="p">
            현재 위치로 찾기
          </Text>
          <Text variant="caption-2" color="secondary" as="p">
            {HOME_LOCATION_FULL}
          </Text>
        </span>
        <Icon name="arrow-right" size={20} color="primary" />
      </button>
      <Text variant="caption-1" color="secondary" as="p" style={{ margin: '24px 0 12px' }}>
        다른 지역
      </Text>
      <div className={s.regionGrid}>
        {REGIONS.map((r) => (
          <button key={r} type="button" className={`${s.regionBtn} t-label`} aria-pressed={r === HOME_REGION} onClick={() => go(r)}>
            {r}
          </button>
        ))}
        <button type="button" className={`${s.regionBtn} t-label`} aria-pressed={false} onClick={() => go()}>
          전국 검색
        </button>
      </div>
    </BottomSheet>
  );
}

/**
 * 학교 검색 — Figma 416:8372 ('서울' 검색 결과 6)
 * 검색어·지역 칩으로 실시간 필터, 일치 부분 브랜드 색 하이라이트.
 */
export function SchoolSearch() {
  const nav = useNav();
  const setSchool = useApp((st) => st.setSchool);
  const [params] = useSearchParams();
  const initialRegion = params.get('region') as Region | null;
  const [query, setQuery] = useState(params.get('q') ?? (initialRegion === '서울' ? '서울' : ''));
  const [region, setRegion] = useState<Region | '전체'>(initialRegion && initialRegion !== '서울' ? initialRegion : '전체');

  const results = useMemo(() => {
    const qn = query.trim();
    return SCHOOLS.filter((sc) => (region === '전체' || sc.region === region) && (!qn || sc.name.includes(qn) || sc.location.includes(qn)));
  }, [query, region]);

  return (
    <Screen figma="416:8372" header={<EntryHeader title="학교 선택" fallback={P.school} />}>
      <div className={s.page} style={{ paddingTop: 8 }}>
        <SearchField value={query} onChange={setQuery} placeholder="학교 이름 검색" autoFocus />
        <div className={`${s.chipRow} no-scrollbar`}>
          {(['전체', ...REGIONS] as const).map((r) => (
            <button key={r} type="button" className={`${s.filterChip} t-label`} aria-pressed={region === r} onClick={() => setRegion(r)}>
              {r}
            </button>
          ))}
        </div>
        <div className={s.searchHead}>
          <Text variant="label" as="p">
            {query.trim() ? `‘${query.trim()}’ 검색 결과 ` : region === '전체' ? '전국 학교 ' : `${region} 학교 `}
            <Text variant="label" color="brand">
              {results.length}
            </Text>
          </Text>
        </div>
        {results.length ? (
          <div className={s.schoolList}>
            {results.map((sc) => (
              <SchoolRow
                key={sc.name}
                school={sc}
                highlight={query.trim() || undefined}
                onPress={() => {
                  setSchool(sc.name);
                  nav.push(P.login);
                }}
              />
            ))}
          </div>
        ) : (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <Text variant="headline" as="p">
              찾는 학교가 없어요
            </Text>
            <Text variant="callout" color="secondary" as="p" style={{ marginTop: 4 }}>
              학교 이름을 다시 확인하거나 지역을 바꿔 보세요.
            </Text>
          </div>
        )}
        <div className={s.footNote}>
          <Text variant="caption-1" color="secondary">
            찾는 학교가 없나요?
          </Text>
          <TextLink tone="brand" onPress={() => toast('학교 추가 요청을 보냈어요', 'check')}>
            <span className="t-caption-1-strong">학교 추가 요청하기</span>
          </TextLink>
        </div>
      </div>
    </Screen>
  );
}
