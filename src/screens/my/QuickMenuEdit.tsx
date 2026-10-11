import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence, motion, Reorder, useDragControls } from 'motion/react';
import { Dialog, Icon, Logo, Screen, SectionDivider, Text, TextAction, TopNav, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { QUICK_MAX, RADIAL_DEFAULT, SETUP_ITEMS, quickItem, type QuickItem } from '@/data/quickMenu';
import s from './QuickMenu.module.css';

const R = 118; // 홈 레디얼(308:11745)과 같은 반경
const LONG_PRESS_MS = 380;

/**
 * 퀵메뉴 편집 — Figma 425:8741 (마이 › 퀵메뉴 편집 · 홈 레디얼 '메뉴 추가')
 * - 리스트: 손잡이를 끌거나 행을 길게 눌러 순서 변경(Reorder), − 로 빼기, 손잡이 포커스 후 ↑↓ 키로도 이동
 * - 미리보기: 아이콘 두 개를 차례로 누르면 자리 바꾸기
 * - 아래 타일: 눌러서 추가(최대 8개)
 * - 완료 → 전역 quickMenu 저장 → 홈 레디얼에 바로 반영
 */
export function QuickMenuEdit() {
  const nav = useNav();
  const saved = useApp((st) => st.quickMenu);
  const save = useApp((st) => st.setQuickMenu);
  const [draft, setDraft] = useState<string[]>(saved);
  const [moving, setMoving] = useState<string | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [leave, setLeave] = useState(false);

  const items = draft.map(quickItem).filter(Boolean) as QuickItem[];
  const dirty = draft.join() !== saved.join();
  const full = draft.length >= QUICK_MAX;
  const isDefault = draft.join() === RADIAL_DEFAULT.join();
  const extras = SETUP_ITEMS.filter((id) => !draft.includes(id));
  const focusId = moving ?? pick;
  const focusIdx = focusId ? draft.indexOf(focusId) : -1;

  const done = () => {
    if (dirty) {
      save(draft);
      toast('퀵메뉴를 저장했어요', 'check');
    }
    nav.back(P.my);
  };
  const remove = (id: string) => {
    if (draft.length <= 1) {
      toast('퀵메뉴는 1개 이상 있어야 해요');
      return;
    }
    if (pick === id) setPick(null);
    setDraft((d) => d.filter((x) => x !== id));
  };
  const add = (id: string) => {
    if (full) {
      toast(`최대 ${QUICK_MAX}개까지 담을 수 있어요`);
      return;
    }
    setDraft((d) => [...d, id]);
  };
  const move = (id: string, dir: -1 | 1) => {
    setDraft((d) => {
      const i = d.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= d.length) return d;
      const next = [...d];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };
  const tapSlot = (id: string) => {
    if (!pick) return setPick(id);
    if (pick === id) return setPick(null);
    const a = draft.indexOf(pick);
    const b = draft.indexOf(id);
    setDraft((d) => {
      const next = [...d];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
    toast(`${quickItem(pick)?.label} ↔ ${quickItem(id)?.label} 자리를 바꿨어요`);
    setPick(null);
  };

  return (
    <Screen
      figma="425:8741"
      header={
        <TopNav
          title="퀵메뉴 편집"
          fallback={P.my}
          onLeading={() => (dirty ? setLeave(true) : nav.back(P.my))}
          trailing={<TextAction onPress={done}>완료</TextAction>}
        />
      }
      overlay={
        <Dialog
          open={leave}
          title="저장하지 않고 나갈까요?"
          message="지금까지 바꾼 퀵메뉴 구성이 사라져요."
          confirmLabel="나가기"
          cancelLabel="계속 편집"
          destructive
          onConfirm={() => {
            setLeave(false);
            nav.back(P.my);
          }}
          onCancel={() => setLeave(false)}
        />
      }
    >
      {/* 레디얼 미리보기 */}
      <div className={s.preview} aria-label="퀵메뉴 미리보기">
        <div className={s.ring} />
        <div className={s.hub}>
          <Logo name="logo-wu-blue" height={30} />
        </div>
        {items.map((q, i) => {
          const a = (i / items.length) * Math.PI * 2 - Math.PI / 2;
          return (
            <motion.button
              key={q.id}
              type="button"
              layout
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              className={s.slot}
              data-active={focusId === q.id}
              data-target={!!pick && pick !== q.id}
              style={{ left: `calc(50% + ${Math.cos(a) * R}px)`, top: `calc(50% + ${Math.sin(a) * R}px)` }}
              onClick={() => tapSlot(q.id)}
              aria-label={`${i + 1}번 ${q.label}${pick === q.id ? ' · 선택됨' : ''}`}
              aria-pressed={pick === q.id}
            >
              <Icon name={q.icon} size={20} />
              <span className={`${s.order} t-micro tnum`}>{i + 1}</span>
            </motion.button>
          );
        })}
        <AnimatePresence mode="wait" initial={false}>
          {focusId ? (
            <motion.span key="focus" className={s.hint} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <Text variant="micro" color="brand" className="truncate">
                {pick && !moving ? `${quickItem(focusId)?.label} ↔ 바꿀 자리 선택` : `${quickItem(focusId)?.label} 이동 중 · ${focusIdx + 1}번 자리`}
              </Text>
            </motion.span>
          ) : (
            <motion.span key="idle" className={s.hint} data-idle initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <Text variant="caption-2" color="tertiary">
                눌러서 자리 바꾸기
              </Text>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className={s.content}>
        <div className={s.listHead}>
          <Text variant="title-2" as="h2">
            현재 퀵메뉴
          </Text>
          <Text variant="label" color="brand" tnum aria-label={`${QUICK_MAX}개 중 ${draft.length}개`}>
            {draft.length} / {QUICK_MAX}
          </Text>
        </div>
        <Text variant="caption-2" color="tertiary" as="p" className={s.helper}>
          길게 눌러 순서를 바꾸고, − 를 눌러 뺄 수 있어요
        </Text>

        <Reorder.Group axis="y" values={draft} onReorder={setDraft} className={s.list} as="ul">
          {items.map((q, i) => (
            <SlotRow
              key={q.id}
              item={q}
              index={i}
              moving={moving === q.id || pick === q.id}
              onDragState={(on) => setMoving(on ? q.id : null)}
              onRemove={() => remove(q.id)}
              onMove={(dir) => move(q.id, dir)}
            />
          ))}
        </Reorder.Group>
      </div>

      <SectionDivider />

      <div className={s.content} style={{ paddingTop: 0 }}>
        <Text variant="title-2" as="h2" className={s.addHead}>
          추가할 수 있는 기능
        </Text>
        <AnimatePresence initial={false}>
          {full && (
            <motion.div className={s.fullNote} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <Icon name="warning" size={16} color="secondary" />
              <Text variant="caption-1" color="secondary">
                {QUICK_MAX}개가 가득 찼어요. 하나를 빼면 추가할 수 있어요
              </Text>
            </motion.div>
          )}
        </AnimatePresence>
        <div className={s.extras}>
          {extras.map((id) => {
            const q = quickItem(id)!;
            return (
              <motion.button
                key={id}
                layout
                type="button"
                className={s.extra}
                data-full={full}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => add(id)}
                aria-label={`${q.label} 추가`}
                aria-disabled={full}
              >
                <Icon name={q.icon} size={20} />
                <Text variant="caption-2-strong" color={full ? 'tertiary' : 'secondary'}>
                  {q.label}
                </Text>
                {!full && (
                  <span className={s.plus} aria-hidden>
                    <Icon name="plus" size={16} />
                  </span>
                )}
              </motion.button>
            );
          })}
          {extras.length === 0 && (
            <Text variant="caption-1" color="tertiary" as="p" className={s.emptyExtras}>
              모든 기능을 담았어요
            </Text>
          )}
        </div>
        <button
          type="button"
          className={s.reset}
          disabled={isDefault}
          onClick={() => {
            setDraft(RADIAL_DEFAULT);
            setPick(null);
            toast('기본 구성으로 되돌렸어요');
          }}
        >
          <Text variant="label" color="tertiary">
            기본 구성으로 되돌리기
          </Text>
        </button>
      </div>
    </Screen>
  );
}

/* ── 리스트 행: − · 아이콘 · 이름 · 순번 · 손잡이 ───────────────── */
function SlotRow({
  item,
  index,
  moving,
  onDragState,
  onRemove,
  onMove,
}: {
  item: QuickItem;
  index: number;
  moving: boolean;
  onDragState: (on: boolean) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const controls = useDragControls();
  const press = useRef<{ timer: number; x: number; y: number } | null>(null);

  useEffect(() => () => window.clearTimeout(press.current?.timer), []);

  const cancelPress = () => {
    if (press.current) window.clearTimeout(press.current.timer);
    press.current = null;
  };
  // 행 길게 누르기 → 드래그 시작 (손잡이는 바로 시작)
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
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onMove(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onMove(1);
    }
  };

  return (
    <Reorder.Item
      value={item.id}
      as="li"
      className={s.item}
      data-moving={moving}
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
      <button type="button" className={s.remove} onClick={onRemove} aria-label={`${item.label} 빼기`}>
        <span className={s.removeDot} />
      </button>
      <span className={s.itemIcon}>
        <Icon name={item.icon} size={20} />
      </span>
      <Text variant="subhead" className={`${s.itemLabel} truncate`}>
        {item.label}
      </Text>
      <Text variant="caption-1-strong" color="tertiary" tnum>
        {index + 1}
      </Text>
      <button
        type="button"
        className={s.handle}
        aria-label={`${item.label} 순서 변경 (위·아래 화살표 키)`}
        onPointerDown={(e) => {
          e.preventDefault();
          controls.start(e);
        }}
        onKeyDown={onKey}
      >
        <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden>
          <rect y="0" width="18" height="2" rx="1" fill="currentColor" />
          <rect y="6" width="18" height="2" rx="1" fill="currentColor" />
          <rect y="12" width="18" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>
    </Reorder.Item>
  );
}
