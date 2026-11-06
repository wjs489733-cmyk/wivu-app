import { useSyncExternalStore } from 'react';

/* ────────────────────────────────────────────────────────────
 * 실시간 시계 (11-06 사용자 결정: 날짜 + 시각 완전 실시간 · 주말 = 공강 홈 · 이번 주 = 6주차)
 *
 * 앱 데이터는 원래 '2026-10-09(금) 9:41 = 학기 6주차'(시나리오) 기준으로 짜여 있다.
 * → 시나리오 주(10/5 월 ~ 10/11 일)를 '실제 이번 주'에 통째로 옮겨 붙인다.
 *    모든 데이터 날짜에 7 × WEEK_SHIFT 일을 더함 → 요일은 그대로, 날짜 숫자만 바뀜.
 *    학기 주차·출석 기록·과제·공지·일정 사이 관계(D-6, 6주차 …)는 그대로 유지.
 * → 시각(오늘 몇 시인지, 출석 가능 여부, 남은 분)은 실제 시각으로 매 분 갱신 (useNow).
 *
 * 시각 고정 (검증·캡처·전시 시연용):
 *   ?now=2026-10-09T09:41  주소 뒤(# 앞)에 붙이면 그 시각으로 고정 — 2026-10-09T09:41 = 원래 Figma 그대로
 *   전시 패널 '시연 시각' 스위치 → 이번 주 금요일 9:41로 고정 (localStorage, 기기마다)
 * ──────────────────────────────────────────────────────────── */

const DAY_MS = 86400000;
/** 시나리오 기준 시각 (데이터가 짜인 원래 '지금') */
export const SCENARIO_NOW = new Date(2026, 9, 9, 9, 41);
const SCENARIO_MONDAY = new Date(2026, 9, 5);

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const mondayOf = (d: Date) => {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};
const weeksBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / (7 * DAY_MS));

/* ── 시각 고정 ── */
function nowParam(): Date | null {
  try {
    const q = new URLSearchParams(window.location.search).get('now');
    if (!q) return null;
    const m = q.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/);
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 9), +(m[5] ?? 41));
  } catch {
    return null;
  }
}
const DEMO_KEY = 'wivu-demo-time';
/** 전시 패널 '시연 시각' 스위치 상태 */
export function demoTimeOn(): boolean {
  try {
    return window.localStorage.getItem(DEMO_KEY) === '1';
  } catch {
    return false;
  }
}
/** 스위치 변경 → 데이터를 새 기준으로 다시 짜야 해서 새로고침 */
export function setDemoTime(on: boolean) {
  try {
    if (on) window.localStorage.setItem(DEMO_KEY, '1');
    else window.localStorage.removeItem(DEMO_KEY);
  } catch {
    /* 저장 못 하면 그냥 새로고침만 */
  }
  window.location.reload();
}

const REAL_AT_LOAD = new Date();
const PARAM = nowParam();
/** 실제 이번 주에 옮겨 붙인 시나리오 금요일 9:41 */
const DEMO_AT = new Date(SCENARIO_NOW.getTime() + weeksBetween(SCENARIO_MONDAY, mondayOf(REAL_AT_LOAD)) * 7 * DAY_MS);
/** 고정 시각 (없으면 실시간) */
const FIXED: Date | null = PARAM ?? (demoTimeOn() ? DEMO_AT : null);
/** 시각이 고정돼 있는지 (?now= 또는 시연 스위치) */
export const TIME_FIXED = FIXED !== null;
export const TIME_SOURCE: 'real' | 'param' | 'demo' = PARAM ? 'param' : FIXED ? 'demo' : 'real';

/** 지금 (실시간 또는 고정 시각) */
export function now(): Date {
  return FIXED ? new Date(FIXED) : new Date();
}
/** 앱을 연 순간의 '지금' — 날짜 단위 계산용 (날짜가 바뀌면 새로고침하므로 하루 안에서는 유효) */
export const LOAD_NOW = now();

/** 시나리오 주 → 이번 주로 옮긴 주 수 (0 = 원래 10/9 그대로) */
export const WEEK_SHIFT = weeksBetween(SCENARIO_MONDAY, mondayOf(LOAD_NOW));
export const SHIFT_DAYS = WEEK_SHIFT * 7;

/* ── 시나리오 날짜 → 실제 날짜 ───────────────────────────── */
/** Date 옮기기 (시각은 그대로) */
export function shiftDate(d: Date): Date {
  if (!SHIFT_DAYS) return new Date(d);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + SHIFT_DAYS, d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
}
const SCEN_YEAR = 2026;
const pad2 = (n: number) => String(n).padStart(2, '0');
const moved = (y: number, m: number, d: number) => new Date(y, m - 1, d + SHIFT_DAYS);
/** 학기 달(9–12월)인지 — 소수·분수(4.5, 8/8)를 날짜로 오인하지 않게 */
const semMonth = (m: number) => m >= 9 && m <= 12;
const validDay = (d: number) => d >= 1 && d <= 31;

/**
 * 글자 속 날짜를 옮김. 알아보는 형식:
 *   2026-10-09 · 2026.10.09 · 10월 9일 · 10.09 / 9.30 / 10.1 (9–12월만) · 10/14 (9–12월만)
 * 요일 글자('(금)', '금요일')는 주 단위로 옮기므로 그대로 맞음.
 */
export function shiftText(s: string): string {
  if (!SHIFT_DAYS || !s) return s;
  return s
    .replace(/(\d{4})-(\d{2})-(\d{2})/g, (_, y, m, d) => {
      const x = moved(+y, +m, +d);
      return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`;
    })
    .replace(/(\d{4})\.(\d{1,2})\.(\d{1,2})/g, (all, y, m, d) => {
      if (!validDay(+d) || +m > 12) return all;
      const x = moved(+y, +m, +d);
      return `${x.getFullYear()}.${m.length === 2 ? pad2(x.getMonth() + 1) : x.getMonth() + 1}.${d.length === 2 ? pad2(x.getDate()) : x.getDate()}`;
    })
    .replace(/(\d{1,2})월(\s?)(\d{1,2})일/g, (all, m, sp, d) => {
      if (+m > 12 || !validDay(+d)) return all;
      const x = moved(SCEN_YEAR, +m, +d);
      return `${x.getMonth() + 1}월${sp}${x.getDate()}일`;
    })
    // 뒤에 단위(km·MB·%·점·배 등)가 붙은 소수는 날짜가 아님
    .replace(/(?<![\d.:/,])(\d{1,2})\.(\d{1,2})(?![\d.%:A-Za-z]|점|배|시간|분)/g, (all, m, d) => {
      if (!semMonth(+m) || !validDay(+d)) return all;
      const x = moved(SCEN_YEAR, +m, +d);
      // 기본은 'MM.DD'(앞 0 채움). '9.30'·'10.1'처럼 앞 0 없이 쓴 경우만 그대로 안 채움
      const loose = (m.length === 1) || (d.length === 1);
      return loose ? `${x.getMonth() + 1}.${x.getDate()}` : `${pad2(x.getMonth() + 1)}.${pad2(x.getDate())}`;
    })
    .replace(/(?<![\d/])(\d{1,2})\/(\d{1,2})(?![\d/])/g, (all, m, d) => {
      if (!semMonth(+m) || !validDay(+d)) return all;
      const x = moved(SCEN_YEAR, +m, +d);
      return `${x.getMonth() + 1}/${x.getDate()}`;
    });
}

/** 'MM.DD'(또는 'M.D') 하나 옮기기 — 같은 표기 방식 유지 */
export const sd = (md: string) => shiftText(md);

/** 데이터 통째로 옮기기: 글자는 shiftText, Date는 shiftDate (새 객체를 돌려줌, 함수는 그대로) */
export function shiftDeep<T>(x: T): T {
  if (!SHIFT_DAYS) return x;
  return walk(x) as T;
}
function walk(x: unknown): unknown {
  if (typeof x === 'string') return shiftText(x);
  if (x instanceof Date) return shiftDate(x);
  if (Array.isArray(x)) return x.map(walk);
  if (x && typeof x === 'object' && Object.getPrototypeOf(x) === Object.prototype) {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(x)) o[k] = walk(v);
    return o;
  }
  return x;
}

/* ── 실제 날짜 도우미 ─────────────────────────────────────── */
export const DOW_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;
export type DowKo = (typeof DOW_KO)[number];
export const dayStart = startOfDay;
/** 두 날짜 사이 날 수 (b − a, 자정 기준) */
export const dayDiff = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
export const sameDay = (a: Date, b: Date) => dayDiff(a, b) === 0;
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());
/** 'MM.DD' */
export const fmtMD = (d: Date) => `${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
/** 'YYYY-MM-DD' */
export const fmtISO = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
/** 'HH:MM' */
export const fmtHM = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
/** '10월 9일 금요일' */
export const fmtLongDay = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일 ${DOW_KO[d.getDay()]}요일`;
/** 'HH:MM' → 분 */
export const hmToMin = (hm: string) => {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
};
export const minOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();
/** 'MM.DD'(이미 옮긴 실제 날짜) → Date (연도는 지금 기준으로 가까운 해) */
export function mdToDate(md: string, base: Date = LOAD_NOW): Date {
  const [m, d] = md.split('.').map(Number);
  const y = base.getFullYear();
  const cand = [y - 1, y, y + 1].map((yy) => new Date(yy, m - 1, d));
  return cand.reduce((a, b) => (Math.abs(b.getTime() - base.getTime()) < Math.abs(a.getTime() - base.getTime()) ? b : a));
}

/* ── 매 분 갱신되는 '지금' (컴포넌트용) ───────────────────── */
let minuteNow = now();
const listeners = new Set<() => void>();
let timer: number | undefined;
function tick() {
  const n = now();
  // 날짜가 바뀌면(자정) 데이터 기준이 바뀌므로 새로고침
  if (!FIXED && !sameDay(n, LOAD_NOW)) {
    window.location.reload();
    return;
  }
  if (n.getMinutes() !== minuteNow.getMinutes() || n.getHours() !== minuteNow.getHours()) {
    minuteNow = n;
    listeners.forEach((l) => l());
  }
}
function subscribe(l: () => void) {
  listeners.add(l);
  if (timer === undefined && !FIXED) {
    timer = window.setInterval(tick, 5000);
    queueMicrotask(tick); // 구독 전 지나간 분 반영
  }
  return () => {
    listeners.delete(l);
    if (!listeners.size && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}
const snapshot = () => minuteNow;
/** 지금 시각 (분이 바뀔 때마다 다시 그림) */
export function useNow(): Date {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
