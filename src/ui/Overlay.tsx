import { useEffect, useId, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { AnimatePresence, motion, useDragControls, useIsPresent } from 'motion/react';
import { create } from 'zustand';
import { Icon, type IconName } from './Icon';
import { Text } from './primitives';
import s from './Overlay.module.css';

const EASE = [0.32, 0.72, 0, 1] as const;

/* ── 대화상자 레이어 (시트·다이얼로그·시스템 알림 공통) ─────────
 * 접근성: 열릴 때 포커스를 안으로 옮기고, Tab은 안에서만 돌고, 닫히기 시작하면 원래 자리로 돌려준다. */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const focusables = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0);

type LayerProps = {
  role: 'dialog' | 'alertdialog';
  label?: string;
  labelledBy?: string;
  /** 처음 포커스: 'container' = 레이어 자체(내용이 많은 시트), 'first' = 첫 버튼(확인창) */
  initialFocus: 'container' | 'first';
  children: ReactNode;
};
function DialogLayer({ role, label, labelledBy, initialFocus, children }: LayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const isPresent = useIsPresent();

  const restore = (root: HTMLElement | null) => {
    const el = returnTo.current;
    const active = document.activeElement;
    // 사용자가 이미 다른 곳으로 포커스를 옮겼으면 건드리지 않는다
    const focusInside = !active || active === document.body || !!root?.contains(active);
    if (!el || !focusInside) return;
    returnTo.current = null;
    if (el.isConnected) el.focus({ preventScroll: true });
  };

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const active = document.activeElement;
    if (!returnTo.current && active instanceof HTMLElement && !root.contains(active)) returnTo.current = active;
    const target = initialFocus === 'first' ? (focusables(root)[0] ?? root) : root;
    target.focus({ preventScroll: true });
    // StrictMode의 가짜 언마운트에서는 ref가 비므로 root를 직접 넘긴다
    return () => restore(root);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 닫힘 애니메이션이 시작되는 순간 바로 돌려준다
  useEffect(() => {
    if (!isPresent) restore(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresent]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !ref.current) return;
    const list = focusables(ref.current);
    if (!list.length) {
      e.preventDefault();
      return;
    }
    const first = list[0];
    const last = list[list.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === ref.current || !ref.current.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !ref.current.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div ref={ref} className={s.layer} role={role} aria-modal="true" aria-label={label} aria-labelledby={labelledBy} tabIndex={-1} onKeyDown={onKeyDown}>
      {children}
    </div>
  );
}

/** 열려 있는 동안 Esc로 닫기 */
function useEscape(open: boolean, onEscape?: () => void) {
  useEffect(() => {
    if (!open || !onEscape) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onEscape();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onEscape]);
}

/* ── Bottom sheet ─────────────────────────────────────────────
 * Figma의 '배경 화면 복제 + 딤 + 시트' 프레임을 실제 오버레이로.
 * 핸들을 아래로 끌거나 딤을 누르면 닫힘. Screen의 overlay prop 또는 화면 안 아무 곳에 둔다. */
type SheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 딤 탭으로 닫기 허용 */
  dismissible?: boolean;
  label?: string;
};
export function BottomSheet({ open, onClose, children, dismissible = true, label }: SheetProps) {
  const controls = useDragControls();
  useEscape(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <DialogLayer role="dialog" label={label} initialFocus="container">
          <motion.div
            className={s.scrim}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={dismissible ? onClose : undefined}
          />
          <motion.div
            className={s.sheet}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.32, ease: EASE }}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 500) onClose();
            }}
          >
            <div className={s.handleArea} onPointerDown={(e) => controls.start(e)}>
              <span className={s.handle} />
            </div>
            {children}
          </motion.div>
        </DialogLayer>
      )}
    </AnimatePresence>
  );
}

/* ── Toast (전역) ───────────────────────────────────────────── */
type ToastItem = { id: number; message: string; icon?: IconName };
type ToastStore = { items: ToastItem[]; show: (message: string, icon?: IconName) => void; dismiss: (id: number) => void };
export const useToast = create<ToastStore>((set) => ({
  items: [],
  show: (message, icon) => {
    const id = Date.now() + Math.random();
    set((st) => ({ items: [...st.items.slice(-1), { id, message, icon }] }));
    setTimeout(() => set((st) => ({ items: st.items.filter((i) => i.id !== id) })), 2200);
  },
  dismiss: (id) => set((st) => ({ items: st.items.filter((i) => i.id !== id) })),
}));
export const toast = (message: string, icon?: IconName) => useToast.getState().show(message, icon);

export function ToastHost() {
  const items = useToast((st) => st.items);
  return (
    <div className={s.toastHost} aria-live="polite">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            className={s.toast}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            {t.icon && <Icon name={t.icon} size={20} />}
            <Text variant="body-3-strong" color="on-brand">
              {t.message}
            </Text>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ── iOS 시스템 알림창 (알림 권한 등) ───────────────────────── */
type AlertProps = {
  open: boolean;
  title: ReactNode;
  message?: ReactNode;
  actions: { label: string; onPress: () => void; bold?: boolean; destructive?: boolean }[];
};
export function SystemAlert({ open, title, message, actions }: AlertProps) {
  const titleId = useId();
  return (
    <AnimatePresence>
      {open && (
        <DialogLayer role="alertdialog" labelledBy={titleId} initialFocus="first">
          <motion.div className={s.scrim} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
          <motion.div
            className={s.alert}
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <div className={s.alertBody}>
              <p className={s.alertTitle} id={titleId}>
                {title}
              </p>
              {message && <p className={s.alertMessage}>{message}</p>}
            </div>
            <div className={s.alertActions} data-count={actions.length}>
              {actions.map((a) => (
                <button key={a.label} type="button" className={s.alertAction} data-bold={a.bold} data-destructive={a.destructive} onClick={a.onPress}>
                  {a.label}
                </button>
              ))}
            </div>
          </motion.div>
        </DialogLayer>
      )}
    </AnimatePresence>
  );
}

/* ── 확인 다이얼로그 (앱 스타일) ────────────────────────────── */
type DialogProps = {
  open: boolean;
  title: ReactNode;
  message?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
};
export function Dialog({ open, title, message, confirmLabel, cancelLabel = '취소', onConfirm, onCancel, destructive }: DialogProps) {
  const titleId = useId();
  useEscape(open, onCancel);
  return (
    <AnimatePresence>
      {open && (
        <DialogLayer role="alertdialog" labelledBy={titleId} initialFocus="first">
          <motion.div className={s.scrim} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} />
          <motion.div className={s.dialog} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.22, ease: EASE }}>
            <Text variant="title-3" as="h2" id={titleId}>
              {title}
            </Text>
            {message && (
              <Text variant="body-3" color="secondary" as="p" style={{ marginTop: 8 }}>
                {message}
              </Text>
            )}
            <div className={s.dialogActions}>
              <button type="button" className={`${s.dialogBtn} ${s.dialogCancel} t-body-2-strong`} onClick={onCancel}>
                {cancelLabel}
              </button>
              <button type="button" className={`${s.dialogBtn} t-body-2-strong`} data-destructive={destructive} onClick={onConfirm}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </DialogLayer>
      )}
    </AnimatePresence>
  );
}

/* ── v5 시트 구성 요소 (Figma 617:3513 Sheet Head · 617:3553 Sheet Action) ─────────
 * BottomSheet 안에서 쓴다. 핸들은 BottomSheet가 이미 그린다. */
export function SheetHead({ title, subtitle, onClose }: { title: ReactNode; subtitle?: ReactNode; onClose?: () => void }) {
  return (
    <div className={s.sheetHead}>
      <div className={s.sheetTitleRow}>
        <Text variant="title-3" as="h2" style={{ flex: 1, minWidth: 0 }}>
          {title}
        </Text>
        {onClose && (
          <button type="button" className={s.sheetClose} onClick={onClose} aria-label="닫기">
            <Icon name="close" size={24} />
          </button>
        )}
      </div>
      {subtitle && (
        <Text variant="caption-1" color="secondary" as="p" style={{ marginTop: 2 }}>
          {subtitle}
        </Text>
      )}
    </div>
  );
}

export function SheetAction({ label, description, icon, danger, chevron, onPress }: { label: ReactNode; description?: ReactNode; icon?: IconName; danger?: boolean; chevron?: boolean; onPress: () => void }) {
  return (
    <button type="button" className={s.sheetAction} data-danger={danger || undefined} onClick={onPress}>
      {icon && <Icon name={icon} size={20} />}
      <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <Text variant="body-2" color={danger ? 'error' : 'primary'} as="span" style={{ display: 'block' }}>
          {label}
        </Text>
        {description && (
          <Text variant="caption-2" color="tertiary" as="span" style={{ display: 'block' }}>
            {description}
          </Text>
        )}
      </span>
      {chevron && <Icon name="chevron-right" size={20} color="secondary" />}
    </button>
  );
}
