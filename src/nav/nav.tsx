import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useLocation, useNavigate, useNavigationType, useRoutes, type RouteObject } from 'react-router';

/* ────────────────────────────────────────────────────────────
 * Figma 프로토타입 전환 규칙을 그대로 옮긴 스택 내비게이션
 *   push  : 상세 PUSH LEFT 0.3s
 *   modal : 입력·모달 MOVE_IN (아래→위) 0.3s
 *   fade  : 완료·상태 DISSOLVE 0.25s
 *   none  : 탭 이동 즉시
 *   back  : 들어올 때 쓴 전환의 역방향
 * ──────────────────────────────────────────────────────────── */
export type Transition = 'push' | 'modal' | 'fade' | 'none';
type NavState = { t?: Transition; d?: number } & Record<string, unknown>;
type Anim = { t: Transition; dir: 'forward' | 'back' };

const EASE = [0.32, 0.72, 0, 1] as const;
const DUR: Record<Transition, number> = { push: 0.3, modal: 0.3, fade: 0.25, none: 0 };

const variants: Variants = {
  enter: ({ t, dir }: Anim) => {
    if (dir === 'forward') {
      if (t === 'push') return { x: '100%', y: 0, opacity: 1, zIndex: 2 };
      if (t === 'modal') return { y: '100%', x: 0, opacity: 1, zIndex: 2 };
      if (t === 'fade') return { opacity: 0, x: 0, y: 0, zIndex: 2 };
      return { x: 0, y: 0, opacity: 1, zIndex: 2 };
    }
    if (t === 'push') return { x: '-28%', y: 0, opacity: 1, zIndex: 1 };
    if (t === 'fade') return { opacity: 0, x: 0, y: 0, zIndex: 1 };
    return { x: 0, y: 0, opacity: 1, zIndex: 1 };
  },
  center: ({ t }: Anim) => ({
    x: 0,
    y: 0,
    opacity: 1,
    transition: { duration: DUR[t], ease: EASE },
  }),
  exit: ({ t, dir }: Anim) => {
    const transition = { duration: DUR[t], ease: EASE };
    if (dir === 'forward') {
      if (t === 'push') return { x: '-28%', zIndex: 1, transition };
      if (t === 'fade') return { opacity: 0, zIndex: 1, transition };
      // modal: 아래 화면은 그대로 둔 채 모달이 다 올라올 때까지 유지
      if (t === 'modal') return { opacity: 0.999, zIndex: 1, transition };
      return { opacity: 1, zIndex: 1, transition: { duration: 0 } };
    }
    if (t === 'push') return { x: '100%', zIndex: 2, transition };
    if (t === 'modal') return { y: '100%', zIndex: 2, transition };
    if (t === 'fade') return { opacity: 0, zIndex: 2, transition };
    return { opacity: 1, zIndex: 2, transition: { duration: 0 } };
  },
};

const layerStyle = {
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  background: 'var(--wivu-color-bg-surface)',
  willChange: 'transform',
} as const;

/** 라우트 전환 애니메이션 컨테이너 */
export function AnimatedRoutes({ routes }: { routes: RouteObject[] }) {
  const location = useLocation();
  const navType = useNavigationType();
  const element = useRoutes(routes, location);
  const prevKey = useRef<string | null>(null);
  const memo = useRef(new Map<string, Transition>());

  // 렌더 중에는 ref를 읽기만 하고(StrictMode 이중 호출 안전), 갱신은 layout effect에서
  const anim = useMemo<Anim>(() => {
    const st = (location.state ?? {}) as NavState;
    const prev = prevKey.current;
    if (prev === null || prev === location.key) return { t: 'none', dir: 'forward' };
    if (navType === 'POP') return { t: memo.current.get(prev) ?? 'push', dir: 'back' };
    return { t: st.t ?? 'none', dir: 'forward' };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  useLayoutEffect(() => {
    const st = (location.state ?? {}) as NavState;
    if (navType !== 'POP' || !memo.current.has(location.key)) memo.current.set(location.key, navType === 'POP' ? memo.current.get(location.key) ?? 'none' : st.t ?? 'none');
    prevKey.current = location.key;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  return (
    <AnimatePresence initial={false} custom={anim}>
      <motion.div key={location.key} custom={anim} variants={variants} initial="enter" animate="center" exit="exit" style={layerStyle}>
        {element}
      </motion.div>
    </AnimatePresence>
  );
}

/* ── useNav ─────────────────────────────────────────────────── */
export type Nav = {
  /** 상세 화면 (PUSH LEFT) */
  push: (to: string, state?: Record<string, unknown>) => void;
  /** 입력·모달 (아래에서 위로) */
  modal: (to: string, state?: Record<string, unknown>) => void;
  /** 완료·상태 전환 (DISSOLVE). replace 기본 */
  fade: (to: string, opts?: { replace?: boolean; state?: Record<string, unknown> }) => void;
  /** 탭 이동 (즉시, 히스토리 대체) */
  tab: (to: string) => void;
  /** 스택 초기화 후 이동 (온보딩 완료 등) */
  reset: (to: string, t?: Transition) => void;
  /** 뒤로/닫기 — 스택이 비면 fallback으로 */
  back: (fallback?: string) => void;
  depth: number;
};

const FallbackCtx = createContext('/home');
export function NavFallback({ to, children }: { to: string; children: ReactNode }) {
  return <FallbackCtx.Provider value={to}>{children}</FallbackCtx.Provider>;
}

export function useNav(): Nav {
  const navigate = useNavigate();
  const location = useLocation();
  const fallbackDefault = useContext(FallbackCtx);
  const depth = ((location.state ?? {}) as NavState).d ?? 0;

  const go = useCallback(
    (to: string, t: Transition, replace: boolean, extra?: Record<string, unknown>, d?: number) =>
      navigate(to, { replace, state: { ...extra, t, d: d ?? (replace ? depth : depth + 1) } }),
    [navigate, depth],
  );

  return useMemo(
    () => ({
      push: (to, state) => go(to, 'push', false, state),
      modal: (to, state) => go(to, 'modal', false, state),
      fade: (to, opts) => go(to, 'fade', opts?.replace ?? true, opts?.state),
      tab: (to) => go(to, 'none', true, undefined, 0),
      reset: (to, t = 'fade') => go(to, t, true, undefined, 0),
      back: (fallback) => {
        if (depth > 0) navigate(-1);
        else go(fallback ?? fallbackDefault, 'none', true, undefined, 0);
      },
      depth,
    }),
    [go, navigate, depth, fallbackDefault],
  );
}

/** 현재 라우트 state 읽기 (화면 간 데이터 전달용) */
export function useNavState<T extends Record<string, unknown>>() {
  return (useLocation().state ?? {}) as Partial<T>;
}
