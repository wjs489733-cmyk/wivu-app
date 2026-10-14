import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AnimatePresence, animate, motion, useMotionValue } from 'motion/react';
import { Button, Chip, Icon, IconButton, Screen, StatusBar, Text, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { BUILDINGS, MAP_SHORTCUTS, ME, NEXT_BUILDING, routeLength, walkMinutes, type Building, type Pt } from './data';
import s from './CampusMap.module.css';

/* 캔버스 = Figma 좌표(392×852) + 여백. 드래그로 둘러볼 수 있게 조금 더 넓게 */
const OX = 84;
const OY = 60;
const W = 560;
const H = 980;
const at = ([x, y]: Pt): Pt => [x + OX, y + OY];

/** 경로 위 t(0–1) 지점 */
function pointAt(pts: Pt[], t: number): Pt {
  const total = routeLength(pts);
  let left = total * Math.max(0, Math.min(1, t));
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    if (left <= seg || i === pts.length - 1) {
      const r = seg === 0 ? 0 : Math.min(1, left / seg);
      return [x0 + (x1 - x0) * r, y0 + (y1 - y0) * r];
    }
    left -= seg;
  }
  return pts[pts.length - 1];
}
const pathD = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${at(p)[0]} ${at(p)[1]}`).join(' ');

type Guide = 'idle' | 'going' | 'arrived';

/**
 * 강의실 지도 — Figma 431:9033 (홈 '다음 강의실' · 히어로 '강의실 위치 보기' · 퀵메뉴 → PUSH)
 * 가상 캠퍼스 지도(실제 캠퍼스 아님). 다음 수업 건물(디자인관 401호) 강조 + 현재 위치에서 도로를 따라 경로.
 * 건물을 누르면 아래 시트가 바뀌고, '건물 정보'로 층별 안내, '길 안내 시작'으로 이동 애니메이션.
 * 검색 바: 건물·강의실 이름 검색, 비어 있으면 오늘 수업 바로가기. ?b=<건물 id>로 특정 건물을 열 수 있음.
 */
export function CampusMap() {
  const nav = useNav();
  const [params] = useSearchParams();
  const initial = BUILDINGS.some((b) => b.id === params.get('b')) ? params.get('b')! : NEXT_BUILDING;
  const [sel, setSel] = useState(initial);
  const [expanded, setExpanded] = useState(false);
  const [guide, setGuide] = useState<Guide>('idle');
  const [t, setT] = useState(0);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const layerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragging = useRef(false);
  const [vp, setVp] = useState({ w: 392, h: 852 });
  const x = useMotionValue(-OX);
  const y = useMotionValue(-OY);

  const b = BUILDINGS.find((it) => it.id === sel)!;
  const mins = walkMinutes(b.route);
  const me: Pt = guide === 'idle' ? ME : pointAt(b.route, guide === 'arrived' ? 1 : t);

  // 뷰포트 크기 → 드래그 범위 · 첫 위치(Figma 화면과 같은 구도, 폭이 다르면 가운데 정렬)
  useLayoutEffect(() => {
    const el = layerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setVp({ w: width, h: height });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    x.set(clamp(-OX + (r.width - 392) / 2, r.width - W, 0));
    y.set(clamp(-OY, r.height - H, 0));
    return () => ro.disconnect();
  }, [x, y]);

  // 길 안내: 경로를 따라 현재 위치 이동 (데모 속도: 1분 ≈ 0.9초)
  useEffect(() => {
    if (guide !== 'going') return;
    const dur = mins * 900;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setT(p);
      if (p < 1) raf = requestAnimationFrame(step);
      else {
        setGuide('arrived');
        toast(`${b.name}에 도착했어요`, 'check');
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [guide, mins, b.name]);

  const panTo = ([px, py]: Pt) => {
    const [cx, cy] = at([px, py]);
    animate(x, clamp(vp.w / 2 - cx, vp.w - W, 0), { type: 'spring', stiffness: 220, damping: 32 });
    animate(y, clamp(vp.h * 0.36 - cy, vp.h - H, 0), { type: 'spring', stiffness: 220, damping: 32 });
  };
  const select = (id: string, pan = false) => {
    const nb = BUILDINGS.find((it) => it.id === id)!;
    setSel(id);
    setGuide('idle');
    setT(0);
    if (pan) panTo([nb.rect[0] + nb.rect[2] / 2, nb.rect[1] + nb.rect[3] / 2]);
  };
  const closeSearch = () => {
    setSearching(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    return BUILDINGS.flatMap((it) => {
      const hits: { key: string; label: string; meta: string; building: string }[] = [];
      if (it.name.includes(q) || it.title.includes(q)) hits.push({ key: it.id, label: it.title, meta: it.chip, building: it.id });
      it.floors.forEach((f, i) => {
        if (f.desc.includes(q) && !(it.title.includes(q) && i === 0)) hits.push({ key: `${it.id}-${i}`, label: `${it.name} ${f.floor}`, meta: f.desc, building: it.id });
      });
      return hits;
    }).slice(0, 6);
  }, [query]);

  const primary = () => {
    if (guide === 'going') {
      setGuide('idle');
      setT(0);
      toast('길 안내를 종료했어요');
    } else {
      setT(0);
      setGuide('going');
      setExpanded(false);
    }
  };

  return (
    <Screen
      figma="431:9033"
      bg="subtle"
      scroll={false}
      hairline={false}
      overlay={
        <div ref={layerRef} className={s.layer}>
          {/* 지도 */}
          <motion.div
            className={s.canvas}
            style={{ x, y, width: W, height: H }}
            drag
            dragConstraints={{ left: vp.w - W, right: 0, top: vp.h - H, bottom: 0 }}
            dragElastic={0.08}
            onDragStart={() => {
              dragging.current = true;
              if (searching) closeSearch();
            }}
            onDragEnd={() => setTimeout(() => (dragging.current = false), 0)}
            onClick={() => searching && closeSearch()}
          >
            <MapBase route={b.route} guide={guide} t={t} />
            {BUILDINGS.map((it) => (
              <BuildingBlock
                key={it.id}
                b={it}
                selected={it.id === sel}
                onPress={() => {
                  if (dragging.current) return;
                  if (searching) closeSearch();
                  if (it.id !== sel) select(it.id);
                  else setExpanded((v) => !v);
                }}
              />
            ))}
            <Text variant="micro" color="tertiary" className={s.gate} style={{ left: 161 + OX, top: 852 + OY + 4 }}>
              정문
            </Text>
            {/* 선택 건물 핀 */}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={b.id}
                className={`${s.pin} t-caption-2-strong`}
                style={{ left: b.rect[0] + b.rect[2] / 2 + OX, top: b.rect[1] + OY - 34, translateX: '-50%' }}
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18 }}
              >
                {b.pin}
              </motion.span>
            </AnimatePresence>
            {/* 현재 위치 */}
            <span className={s.me} style={{ left: at(me)[0], top: at(me)[1] }} aria-label="현재 위치">
              <span className={s.halo} />
              <span className={s.dot} />
            </span>
          </motion.div>

          <div className={s.statusWrap}>
            <StatusBar tone="dark" />
          </div>

          {/* 검색 바 */}
          <div className={s.top}>
            <div className={s.searchBar}>
              <IconButton icon="back" label={searching ? '검색 닫기' : '뒤로'} onPress={() => (searching ? closeSearch() : nav.back(P.home))} />
              <input
                ref={inputRef}
                className={`${s.searchInput} t-callout`}
                placeholder="건물·강의실 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearching(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') closeSearch();
                  if (e.key === 'Enter' && results?.[0]) {
                    select(results[0].building, true);
                    closeSearch();
                  }
                }}
                type="search"
                enterKeyHint="search"
                aria-label="건물·강의실 검색"
              />
              <IconButton icon={query ? 'close' : 'search'} label={query ? '지우기' : '검색'} onPress={() => (query ? setQuery('') : inputRef.current?.focus())} />
            </div>
            <AnimatePresence>
              {searching && (
                <motion.div className={s.results} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}>
                  {!results ? (
                    <>
                      <Text variant="caption-1-strong" color="tertiary" as="p" className={s.resultHead}>
                        오늘 수업 강의실
                      </Text>
                      {MAP_SHORTCUTS.map((r) => (
                        <ResultRow key={r.label} label={r.label} meta={r.meta} onPress={() => (select(r.building, true), closeSearch())} />
                      ))}
                    </>
                  ) : results.length ? (
                    results.map((r) => <ResultRow key={r.key} label={r.label} meta={r.meta} onPress={() => (select(r.building, true), closeSearch())} />)
                  ) : (
                    <Text variant="callout" color="secondary" as="p" className={s.resultHead} style={{ padding: '12px 16px' }}>
                      ‘{query}’ 검색 결과가 없어요
                    </Text>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 내 위치 + 경로 시트 */}
          <div className={s.bottom}>
            <button
              type="button"
              className={s.fab}
              aria-label="내 위치로 이동"
              onClick={() => {
                panTo(me);
                toast(guide === 'arrived' ? `지금 ${b.name} 앞이에요` : '지금 학생회관 앞이에요');
              }}
            >
              <Icon name="pin" size={20} />
            </button>
            <motion.section className={s.sheet} layout transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }} aria-label="경로 안내">
              <motion.button layout="position" type="button" className={s.grabber} aria-label={expanded ? '건물 정보 접기' : '건물 정보 펼치기'} aria-expanded={expanded} onClick={() => setExpanded((v) => !v)} />
              <motion.div layout="position" className={s.sheetHead}>
                <div className={s.sheetInfo}>
                  <Chip tone={b.next ? 'brand' : 'neutral'}>{guide === 'going' ? `안내 중 · ${Math.max(1, Math.ceil(mins * (1 - t)))}분 남음` : guide === 'arrived' ? '도착했어요' : b.chip}</Chip>
                  <Text variant="title-1" as="h2" className="truncate" style={{ maxWidth: '100%' }}>
                    {b.title}
                  </Text>
                  <Text variant="caption-1" color="secondary" className="truncate" style={{ maxWidth: '100%' }}>
                    {b.sub}
                  </Text>
                </div>
                <div className={s.walk} aria-label={`도보 ${mins}분`}>
                  <Text variant="caption-2" color="tertiary">
                    도보
                  </Text>
                  <Text variant="number" color="brand" tnum>
                    {mins}분
                  </Text>
                </div>
              </motion.div>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div className={s.floors} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24 }}>
                    {b.floors.map((f) => (
                      <div key={f.floor} className={s.floorRow}>
                        <Text variant="caption-1-strong" tnum>
                          {f.floor}
                        </Text>
                        <Text variant="callout" color="secondary" className="truncate">
                          {f.desc}
                        </Text>
                        {f.mine ? <Chip tone="brand">내 수업</Chip> : <span />}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div layout="position" className={s.actions}>
                <Button variant="soft" grow onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
                  {expanded ? '정보 접기' : '건물 정보'}
                </Button>
                <Button variant="primary" grow onClick={primary}>
                  {guide === 'going' ? '안내 종료' : guide === 'arrived' ? '다시 안내' : '길 안내 시작'}
                </Button>
              </motion.div>
            </motion.section>
          </div>
        </div>
      }
    />
  );
}

/* ── 지도 바탕: 녹지 · 도로 · 경로 (SVG) ───────────────────── */
function MapBase({ route, guide, t }: { route: Pt[]; guide: Guide; t: number }) {
  const total = routeLength(route);
  const done = guide === 'idle' ? 0 : guide === 'arrived' ? total : total * t;
  return (
    <svg className={s.svg} width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <rect className={s.ground} x={0} y={0} width={W} height={H} />
      {/* 녹지 (Figma 2곳 + 가장자리) */}
      <rect className={s.green} x={-20 + OX} y={520 + OY} width={180} height={140} rx={40} />
      <rect className={s.green} x={250 + OX} y={90 + OY} width={180} height={120} rx={40} />
      <rect className={s.green} x={-70 + OX} y={660 + OY} width={120} height={180} rx={40} />
      <rect className={s.green} x={330 + OX} y={640 + OY} width={140} height={160} rx={40} />
      {/* 도로 */}
      <rect className={s.road} x={0} y={300 + OY} width={W} height={22} rx={11} />
      <rect className={s.road} x={150 + OX} y={40 + OY} width={22} height={H - 40 - OY} rx={11} />
      <rect className={s.road} x={0} y={600 + OY} width={W} height={18} rx={9} />
      <rect className={s.road} x={290 + OX} y={300 + OY} width={18} height={H - 300 - OY} rx={9} />
      {/* 경로: 흰 테두리 + 브랜드 선, 지나온 구간은 회색 */}
      <motion.path key={pathD(route)} className={s.routeCasing} d={pathD(route)} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }} />
      <motion.path key={`r${pathD(route)}`} className={s.route} d={pathD(route)} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }} />
      {done > 0 && <path className={s.routeDone} d={pathD(route)} strokeDasharray={`${done} ${total}`} />}
    </svg>
  );
}

function BuildingBlock({ b, selected, onPress }: { b: Building; selected: boolean; onPress: () => void }) {
  const [bx, by, bw, bh] = b.rect;
  return (
    <button
      type="button"
      className={s.building}
      data-selected={selected}
      data-next={!!b.next}
      style={{ left: bx + OX, top: by + OY, width: bw, height: bh }}
      onClick={(e) => {
        e.stopPropagation();
        onPress();
      }}
      aria-pressed={selected}
      aria-label={`${b.name}${b.next ? ' · 다음 수업' : ''}`}
    >
      <Text variant="micro" color="inherit">
        {b.name}
      </Text>
    </button>
  );
}

function ResultRow({ label, meta, onPress }: { label: string; meta: string; onPress: () => void }) {
  return (
    <button type="button" className={s.result} onClick={onPress}>
      <span className={s.resultIcon}>
        <Icon name="pin" size={16} />
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Text variant="subhead" className="truncate">
          {label}
        </Text>
        <Text variant="caption-2" color="tertiary" className="truncate">
          {meta}
        </Text>
      </span>
    </button>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
