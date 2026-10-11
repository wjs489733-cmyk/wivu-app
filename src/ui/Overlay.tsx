import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion, useDragControls } from 'motion/react';
import { create } from 'zustand';
import { Icon, type IconName } from './Icon';
import { Text } from './primitives';
import s from './Overlay.module.css';

const EASE = [0.32, 0.72, 0, 1] as const;

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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className={s.layer} role="dialog" aria-modal="true" aria-label={label}>
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
        </div>
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
            <Text variant="label" color="on-brand">
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
  return (
    <AnimatePresence>
      {open && (
        <div className={s.layer} role="alertdialog" aria-modal="true">
          <motion.div className={s.scrim} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
          <motion.div
            className={s.alert}
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <div className={s.alertBody}>
              <p className={s.alertTitle}>{title}</p>
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
        </div>
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
  return (
    <AnimatePresence>
      {open && (
        <div className={s.layer} role="alertdialog" aria-modal="true">
          <motion.div className={s.scrim} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} />
          <motion.div className={s.dialog} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.22, ease: EASE }}>
            <Text variant="headline" as="h2">
              {title}
            </Text>
            {message && (
              <Text variant="callout" color="secondary" as="p" style={{ marginTop: 8 }}>
                {message}
              </Text>
            )}
            <div className={s.dialogActions}>
              <button type="button" className={`${s.dialogBtn} ${s.dialogCancel} t-label`} onClick={onCancel}>
                {cancelLabel}
              </button>
              <button type="button" className={`${s.dialogBtn} t-label`} data-destructive={destructive} onClick={onConfirm}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
