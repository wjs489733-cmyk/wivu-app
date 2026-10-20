import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useSearchParams } from 'react-router';
import { Reorder, useDragControls } from 'motion/react';
import { Button, Chip, CtaBar, Dialog, Icon, Screen, Text, TopNav, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { QUICK_MAX } from '@/data/quickMenu';
import { josa, menuCatalog, menuItem } from './data';
import s from './QuickMenu.module.css';

type Tab = 'select' | 'order';
const LONG_PRESS_MS = 380;
/** 뒤로 갈 곳이 없을 때(바로 열었을 때) — Figma 나가기 확인의 목적지(674:4748 홈) */
const FALLBACK = P.home;
const label = (id: string) => menuItem(id)?.label ?? id;

/**
 * 메뉴 편집(내 메뉴) — Figma v5 676:5007 선택 · 676:5106 순서 · 701:8791 변경됨 · 701:8889 나가기 확인
 * - 메뉴 선택: 2열 텍스트 버튼을 눌러 담기/빼기(최대 8개). 8개가 찬 상태에서 새 메뉴를 누르면 맨 끝 메뉴와 바꾼다(701:8791과 같은 결과).
 * - 순서 변경: 손잡이(≡)를 끌거나 행을 길게 눌러 끌어서 순서 변경, 손잡이에 포커스 후 ↑↓ 키로도 이동.
 * - 바뀐 게 있으면 헤더에 '변경 N' 배지, 왼쪽 버튼이 닫기(X)로 바뀌고 누르면 나가기 확인.
 * - 저장 → 전역 quickMenu(setQuickMenu) → 홈 내 메뉴·홈 버튼 길게 누르기 메뉴에 바로 반영.
 * 바로 열기: ?tab=order (순서 변경 탭)
 */
export function QuickMenuEdit() {
  const nav = useNav();
  const [params] = useSearchParams();
  const saved = useApp((st) => st.quickMenu);
  const setQuickMenu = useApp((st) => st.setQuickMenu);
  const [draft, setDraft] = useState<string[]>(() => saved.filter((id) => menuItem(id)).slice(0, QUICK_MAX));
  const [tab, setTab] = useState<Tab>(params.get('tab') === 'order' ? 'order' : 'select');
  const [leave, setLeave] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);

  const catalog = useMemo(() => menuCatalog(saved, draft), [saved, draft]);
  const changes = useMemo(() => countChanges(saved, draft), [saved, draft]);
  const dirty = changes > 0;
  const count = draft.length;

  const toggle = (id: string) => {
    if (draft.includes(id)) return setDraft((d) => d.filter((x) => x !== id));
    if (count < QUICK_MAX) return setDraft((d) => [...d, id]);
    // 8개가 다 찼으면 맨 끝 메뉴 자리에 넣는다 (Figma: 8/8에서 '도서관' → '장소대여'가 빠지고 도서관 선택)
    const last = draft[draft.length - 1];
    setDraft((d) => [...d.slice(0, -1), id]);
    toast(`${QUICK_MAX}개가 다 차서 ${label(last)} 대신 ${josa(label(id), '을/를')} 담았어요`);
  };
  const move = (id: string, dir: -1 | 1) =>
    setDraft((d) => {
      const i = d.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= d.length) return d;
      const next = [...d];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const save = () => {
    if (count === 0) return;
    if (dirty) {
      setQuickMenu(draft);
      toast('내 메뉴를 저장했어요', 'check');
    }
    nav.back(FALLBACK);
  };

  const figma = leave ? '701:8889' : dirty ? '701:8791' : tab === 'order' ? '676:5106' : '676:5007';

  return (
    <Screen
      figma={figma}
      header={
        <TopNav
          title="메뉴 편집"
          leading={dirty ? 'close' : 'back'}
          fallback={FALLBACK}
          onLeading={dirty ? () => setLeave(true) : undefined}
        />
      }
      footer={
        <CtaBar>
          <Button block onClick={save} disabled={count === 0}>
            {tab === 'select' ? `${count}개 저장` : '저장'}
          </Button>
        </CtaBar>
      }
      overlay={
        <Dialog
          open={leave}
          title="저장하지 않고 나갈까요?"
          message="지금까지 바꾼 내 메뉴 구성이 사라져요."
          confirmLabel="나가기"
          cancelLabel="계속 편집"
          destructive
          onConfirm={() => {
            setLeave(false);
            nav.back(FALLBACK);
          }}
          onCancel={() => setLeave(false)}
        />
      }
    >
      <div className={s.page}>
        <div className={s.head}>
          <Text variant="title-3" as="h2">
            내 메뉴
          </Text>
          <Text variant="caption-1-strong" color="brand" tnum aria-label={`${QUICK_MAX}개 중 ${count}개`}>
            {count} / {QUICK_MAX}
          </Text>
          {dirty && (
            <Chip tone="warningSoft" className="tnum">
              변경 {changes}
            </Chip>
          )}
        </div>
        <Text variant="caption-1" color="tertiary" as="p" className={s.helper}>
          홈의 내 메뉴와, 홈 버튼을 길게 누르면 열리는 메뉴에 보여요.
        </Text>

        <div className={s.tabs} role="tablist" aria-label="메뉴 편집 방식">
          {(
            [
              ['select', '메뉴 선택'],
              ['order', '순서 변경'],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={tab === v}
              className={`${s.tab} ${tab === v ? 't-body-3-strong' : 't-body-3'}`}
              onClick={() => setTab(v)}
            >
              {l}
            </button>
          ))}
        </div>

        {tab === 'select' ? (
          <div className={s.grid} role="tabpanel" aria-label="메뉴 선택">
            {catalog.map((m) => {
              const on = draft.includes(m.id);
              return (
                <button key={m.id} type="button" className={s.tile} aria-pressed={on} onClick={() => toggle(m.id)}>
                  <Text variant={on ? 'body-2-strong' : 'body-2'} color="inherit" className="truncate">
                    {m.label}
                  </Text>
                  {on && <Icon name="check" size={20} />}
                </button>
              );
            })}
          </div>
        ) : count === 0 ? (
          <Text variant="body-3" color="tertiary" as="p" className={s.empty}>
            메뉴 선택에서 먼저 담을 메뉴를 골라 주세요
          </Text>
        ) : (
          <Reorder.Group axis="y" values={draft} onReorder={setDraft} className={s.list} as="ul" role="tabpanel" aria-label="순서 변경">
            {draft.map((id, i) => (
              <OrderRow
                key={id}
                id={id}
                index={i}
                total={count}
                dragging={dragging === id}
                onDragState={(on) => setDragging(on ? id : null)}
                onMove={(dir) => move(id, dir)}
              />
            ))}
          </Reorder.Group>
        )}
      </div>
    </Screen>
  );
}

/** '변경 N' — 새로 담은 것 + 뺀 것 + 자리가 바뀐 것 (Figma: 장소대여 빼고 도서관 담기 = 변경 2) */
function countChanges(saved: string[], draft: string[]) {
  const added = draft.filter((id) => !saved.includes(id)).length;
  const removed = saved.filter((id) => !draft.includes(id)).length;
  const keptDraft = draft.filter((id) => saved.includes(id));
  const keptSaved = saved.filter((id) => draft.includes(id));
  const moved = keptDraft.filter((id, i) => keptSaved[i] !== id).length;
  return added + removed + moved;
}

/* ── 순서 행: 이름 · 손잡이(≡) — 손잡이는 바로, 행은 길게 눌러 끌기 ─────────── */
function OrderRow({ id, index, total, dragging, onDragState, onMove }: { id: string; index: number; total: number; dragging: boolean; onDragState: (on: boolean) => void; onMove: (dir: -1 | 1) => void }) {
  const controls = useDragControls();
  const press = useRef<{ timer: number; x: number; y: number } | null>(null);
  const name = label(id);

  useEffect(() => () => window.clearTimeout(press.current?.timer), []);

  const cancelPress = () => {
    if (press.current) window.clearTimeout(press.current.timer);
    press.current = null;
  };
  const onRowDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const native = e.nativeEvent;
    cancelPress();
    press.current = {
      x: e.clientX,
      y: e.clientY,
      timer: window.setTimeout(() => {
        press.current = null;
        controls.start(native);
      }, LONG_PRESS_MS),
    };
  };
  const onRowMove = (e: ReactPointerEvent) => {
    if (press.current && Math.hypot(e.clientX - press.current.x, e.clientY - press.current.y) > 8) cancelPress();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    onMove(e.key === 'ArrowUp' ? -1 : 1);
  };

  return (
    <Reorder.Item
      value={id}
      as="li"
      className={s.item}
      data-dragging={dragging}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => onDragState(true)}
      onDragEnd={() => onDragState(false)}
      onPointerDown={onRowDown}
      onPointerMove={onRowMove}
      onPointerUp={cancelPress}
      onPointerCancel={cancelPress}
      onContextMenu={(e) => e.preventDefault()}
      transition={{ type: 'spring', stiffness: 520, damping: 40 }}
    >
      <Text variant="body-1" className={`${s.itemLabel} truncate`}>
        {name}
      </Text>
      <button
        type="button"
        className={s.handle}
        aria-label={`${name} 순서 변경 · ${total}개 중 ${index + 1}번째 (위·아래 화살표 키로 이동)`}
        onPointerDown={(e) => {
          e.preventDefault();
          controls.start(e);
        }}
        onKeyDown={onKey}
      >
        <Icon name="grip" size={20} />
      </button>
    </Reorder.Item>
  );
}
