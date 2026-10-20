import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AnimatePresence, animate, motion, useMotionValue } from 'motion/react';
import { Button, Chip, Icon, Screen, StatusBar, Text, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { arrivePoint, BUILDINGS, guideTitle, MAP_SHORTCUTS, ME, NEXT_BUILDING, routeLength, type Building, type Pt } from './data';
import s from './CampusMap.module.css';

/* 캔버스 = Figma 좌표(392×852) + 여백. 드래그로 둘러볼 수 있게 조금 더 넓게 */
const OX = 84;
const OY = 60;
const W = 560;
const H = 980;
const at = ([x, y]: Pt): Pt => [x + OX, y + OY];
/** Figma 702:8726 AFTER_TIMEOUT 2.5s → 도착(702:8831) */
const GUIDE_MS = 2500;

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
/** 현재 위치가 실제로 걷는 길 = 경로에서 마지막 점만 도착 위치(벽 8px 앞)로 */
const walkPath = (b: Building): Pt[] => [...b.route.slice(0, -1), arrivePoint(b.route)];

/** 지도 상태 — idle(688:6715) → navigating(702:8726) → arrived(702:8831) */
type Guide = 'idle' | 'navigating' | 'arrived';

/**
 * 강의실 지도 — Figma v5 688:6715 (홈 '다음 강의실' · 히어로 '강의실 위치 보기' · 퀵메뉴 → PUSH)
 * 가상 캠퍼스 지도(실제 캠퍼스 아님). 다음 수업 건물(디자인관 401호) 강조 + 아래 시트.
 * [길 안내 시작] → 안내 중: 위 배너 'Nm 직진 후 ○○ 정문' + 경로 + 현재 위치가 2.5초 동안 경로를 따라 이동 → 도착.
 * 안내 중 [안내 종료] · 도착 배너/[다시 안내]. 건물을 누르면 시트가 바뀌고, [건물 정보]로 층별 안내.
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
  const walk = useMemo(() => walkPath(b), [b]);
  const me: Pt = guide === 'idle' ? ME : guide === 'arrived' ? walk[walk.length - 1] : pointAt(walk, t);
  const left = Math.max(1, Math.ceil(b.walk * (1 - t)));

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

  // 안내 중: 2.5초 동안 경로를 따라 현재 위치 이동 → 도착
  useEffect(() => {
    if (guide !== 'navigating') return;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / GUIDE_MS);
      setT(p);
      if (p < 1) raf = requestAnimationFrame(step);
      else setGuide('arrived');
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [guide, sel]);

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
  const startGuide = () => {
    setT(0);
    setExpanded(false);
    setGuide('navigating');
  };
  const stopGuide = () => {
    setGuide('idle');
    setT(0);
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

  const badge = guide === 'navigating' ? `안내 중 · ${left}분 남음` : guide === 'arrived' ? '도착했어요' : b.chip;

  return (
    <Screen
      figma="688:6715"
      bg="subtle"
      scroll={false}
      hairline={false}
      overlay={
        <div ref={layerRef} className={s.layer} data-guide={guide}>
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
            <MapBase route={b.route} walkLen={routeLength(walk)} guide={guide} t={t} />
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
            <Text variant="caption-2" color="tertiary" className={s.gate} style={{ left: 161 + OX, top: 852 + OY + 4 }}>
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
            {/* 현재 위치 (도착 순간은 SMART_ANIMATE처럼 0.25초로 붙음) */}
            <motion.span
              className={s.me}
              initial={false}
              animate={{ left: at(me)[0], top: at(me)[1] }}
              transition={guide === 'navigating' ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' }}
              aria-label="현재 위치"
            >
              <span className={s.halo} />
              <span className={s.dot} />
            </motion.span>
          </motion.div>

          <div className={s.statusWrap}>
            <StatusBar tone="dark" />
          </div>

          {/* 위: 검색 바 ↔ 안내 배너 */}
          <div className={s.top}>
            <AnimatePresence mode="wait" initial={false}>
              {guide === 'idle' ? (
                <motion.div key="search" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                  <div className={s.searchBar}>
                    <button type="button" className={s.barButton} aria-label={searching ? '검색 닫기' : '뒤로'} onClick={() => (searching ? closeSearch() : nav.back(P.home))}>
                      <Icon name="back" size={24} />
                    </button>
                    <input
                      ref={inputRef}
                      className={`${s.searchInput} t-body-2`}
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
                    <button type="button" className={s.barButton} aria-label={query ? '지우기' : '검색'} onClick={() => (query ? setQuery('') : inputRef.current?.focus())}>
                      <Icon name={query ? 'close' : 'search'} size={20} />
                    </button>
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
                          <Text variant="body-3" color="secondary" as="p" className={s.resultEmpty}>
                            ‘{query}’ 검색 결과가 없어요
                          </Text>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : guide === 'navigating' ? (
                <motion.div key="guide" className={s.banner} data-tone="brand" role="status" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                  <Icon name="map" size={24} />
                  <span className={s.bannerText}>
                    <Text variant="body-1-strong" color="on-brand" className="truncate">
                      {guideTitle(b)}
                    </Text>
                    <Text variant="caption-1" color="on-brand" className="truncate">
                      {b.guide}
                    </Text>
                  </span>
                </motion.div>
              ) : (
                <motion.button
                  key="arrived"
                  type="button"
                  className={s.banner}
                  data-tone="surface"
                  onClick={stopGuide}
                  aria-label={`${b.name}에 도착했어요 · 닫기`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon name="check" size={24} color="brand" />
                  <span className={s.bannerText}>
                    <Text variant="body-1-strong" className="truncate">
                      {b.name}에 도착했어요
                    </Text>
                    <Text variant="caption-1" color="secondary" className="truncate">
                      {b.arrive}
                    </Text>
                  </span>
                </motion.button>
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
                toast(guide === 'arrived' ? `지금 ${b.name} 앞이에요` : guide === 'navigating' ? `${b.name}로 가는 중이에요` : '지금 학생회관 앞이에요');
              }}
            >
              <Icon name="locate" size={24} />
            </button>
            <motion.section className={s.sheet} layout transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }} aria-label="경로 안내">
              <motion.button layout="position" type="button" className={s.grabber} aria-label={expanded ? '건물 정보 접기' : '건물 정보 펼치기'} aria-expanded={expanded} onClick={() => setExpanded((v) => !v)} />
              <motion.div layout="position" className={s.sheetHead}>
                <div className={s.sheetInfo}>
                  <Chip tone={b.next || guide !== 'idle' ? 'brand' : 'neutral'} className="tnum">
                    {badge}
                  </Chip>
                  <Text variant="title-2" as="h2" className="truncate" style={{ maxWidth: '100%' }}>
                    {b.title}
                  </Text>
                  <Text variant="caption-1" color="tertiary" className="truncate" style={{ maxWidth: '100%' }}>
                    {b.sub}
                  </Text>
                </div>
                <div className={s.walk} aria-label={`도보 ${b.walk}분`}>
                  <Text variant="title-2" color="brand" tnum>
                    {b.walk}분
                  </Text>
                  <Text variant="caption-2" color="tertiary">
                    도보
                  </Text>
                </div>
              </motion.div>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div className={s.floors} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24 }}>
                    {b.floors.map((f) => (
                      <div key={f.floor} className={s.floorRow}>
                        <Text variant="body-3-strong" tnum>
                          {f.floor}
                        </Text>
                        <Text variant="body-3" color="secondary" className="truncate">
                          {f.desc}
                        </Text>
                        {f.mine ? <Chip tone="brand">내 수업</Chip> : <span />}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div layout="position" className={s.actions}>
                <Button variant="secondary" grow onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
                  {expanded ? '정보 접기' : '건물 정보'}
                </Button>
                {guide === 'navigating' ? (
                  <Button variant="secondary" grow onClick={stopGuide}>
                    안내 종료
                  </Button>
                ) : (
                  <Button variant="primary" grow onClick={startGuide}>
                    {guide === 'arrived' ? '다시 안내' : '길 안내 시작'}
                  </Button>
                )}
              </motion.div>
            </motion.section>
          </div>
        </div>
      }
    />
  );
}

/* ── 지도 바탕: 녹지 · 도로 · 경로 (SVG) ───────────────────── */
function MapBase({ route, walkLen, guide, t }: { route: Pt[]; walkLen: number; guide: Guide; t: number }) {
  const total = routeLength(route);
  const d = pathD(route);
  // 지나온 구간은 35%(도착 702:8831과 같은 농도), 남은 구간만 진하게 — 걷는 길은 경로의 앞부분이라 거리 그대로 대응
  const done = guide === 'arrived' ? total : walkLen * t;
  return (
    <svg className={s.svg} width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <rect className={s.ground} x={0} y={0} width={W} height={H} />
      {/* 녹지 (Figma 2곳) */}
      <rect className={s.green} x={-20 + OX} y={520 + OY} width={180} height={140} rx={40} />
      <rect className={s.green} x={250 + OX} y={90 + OY} width={180} height={120} rx={40} />
      {/* 도로 */}
      <rect className={s.road} x={0} y={300 + OY} width={W} height={22} rx={11} />
      <rect className={s.road} x={150 + OX} y={40 + OY} width={22} height={H - 40 - OY} rx={11} />
      <rect className={s.road} x={0} y={600 + OY} width={W} height={18} rx={9} />
      <rect className={s.road} x={290 + OX} y={300 + OY} width={18} height={H - 300 - OY} rx={9} />
      {/* 경로 (안내 중·도착만): 흰 테두리 10 + 브랜드 6 */}
      <AnimatePresence>
        {guide !== 'idle' && (
          <motion.g key={d} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <g opacity={0.35}>
              <path className={s.routeCasing} d={d} />
              <path className={s.route} d={d} />
            </g>
            {done < total && (
              <g>
                <path className={s.routeCasing} d={d} strokeDasharray={`${total} ${total}`} strokeDashoffset={-done} />
                <path className={s.route} d={d} strokeDasharray={`${total} ${total}`} strokeDashoffset={-done} />
              </g>
            )}
          </motion.g>
        )}
      </AnimatePresence>
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
      <Text variant="caption-2" color="inherit">
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
        <Text variant="body-2-strong" className="truncate">
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
