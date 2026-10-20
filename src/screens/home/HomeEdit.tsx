import type { KeyboardEvent } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { Icon, Screen, Switch, Text, TextAction, TopNav } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { BLOCKS, LOCKED_BLOCK, useHomeBlocks, type BlockId } from './store';
import s from './HomeEdit.module.css';

/**
 * 홈 편집 · 블록 — Figma v5 676:5225 (홈 '홈 편집' 버튼 → push)
 * 블록 켜기/끄기(Switch) + 오른쪽 핸들로 순서 바꾸기(끌기 · 키보드 ↑↓). '오늘 수업'은 잠금 — 항상 맨 위.
 * 바뀐 값은 바로 홈에 반영(로컬 스토어). '완료'·뒤로 = 돌아가기.
 */
export function HomeEdit() {
  const nav = useNav();
  const order = useHomeBlocks((st) => st.order);
  const setOrder = useHomeBlocks((st) => st.setOrder);

  return (
    <Screen
      figma="676:5225"
      header={<TopNav title="홈 편집" fallback={P.home} trailing={<TextAction onPress={() => nav.back(P.home)}>완료</TextAction>} />}
    >
      <Text variant="caption-1" color="tertiary" as="p" className={s.hint}>
        블록을 켜고 끄거나, 오른쪽 핸들로 순서를 바꿀 수 있어요.
      </Text>
      <div className={s.list}>
        <div className={s.row} aria-label={`${LOCKED_BLOCK.title} · 고정`}>
          <span className={s.text}>
            <Text variant="body-1">{LOCKED_BLOCK.title}</Text>
            <Text variant="caption-1" color="tertiary" className="truncate">
              {LOCKED_BLOCK.desc}
            </Text>
          </span>
          <Icon name="lock" size={20} color="tertiary" label="항상 켜짐" />
          <span className={s.grip} data-locked aria-hidden>
            <Icon name="grip" size={20} />
          </span>
        </div>
        <Reorder.Group axis="y" values={order} onReorder={setOrder} as="ul" className={s.group}>
          {order.map((id) => (
            <EditRow key={id} id={id} />
          ))}
        </Reorder.Group>
      </div>
    </Screen>
  );
}

function EditRow({ id }: { id: BlockId }) {
  const controls = useDragControls();
  const on = useHomeBlocks((st) => st.on[id]);
  const setOn = useHomeBlocks((st) => st.setOn);
  const move = useHomeBlocks((st) => st.move);
  const b = BLOCKS[id];

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    move(id, e.key === 'ArrowUp' ? -1 : 1);
    // 순서가 바뀐 뒤에도 같은 핸들에 포커스 유지
    const el = e.currentTarget;
    requestAnimationFrame(() => el.focus());
  };

  return (
    <Reorder.Item value={id} as="li" className={s.row} dragListener={false} dragControls={controls} whileDrag={{ scale: 1.02, boxShadow: 'var(--wivu-elevation-overlay)', zIndex: 2 }}>
      <span className={s.text}>
        <Text variant="body-1" color={on ? 'primary' : 'secondary'}>
          {b.title}
        </Text>
        <Text variant="caption-1" color="tertiary" className="truncate">
          {b.desc}
        </Text>
      </span>
      <Switch checked={on} onChange={(v) => setOn(id, v)} label={`${b.title} 블록 보이기`} />
      <button
        type="button"
        className={s.grip}
        aria-label={`${b.title} 순서 바꾸기`}
        aria-description="끌거나 위아래 화살표 키로 옮겨요"
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
