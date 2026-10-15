import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button, CtaBar, Icon, LeadingIcon, ListGroup, ListRow, Screen, Switch, SystemAlert, Text, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { QUICK_MAX, RADIAL_DEFAULT, SETUP_ITEMS, quickItem } from '@/data/quickMenu';
import { useMy } from '@/screens/my/store';
import { NOTI_TYPES, type NotiKey } from '@/screens/my/data';
import { EntryHeader, Hero, TextLink } from './parts';
import { WuMark } from './Intro';
import { NOTI_OPTIONS } from './data';
import s from './Entry.module.css';

/**
 * 초기 설정 1/2 · 알림 — Figma 411:12022 (+ 시스템 알림 권한 411:12110)
 * 토글은 실제로 동작하고, 미리보기 알림이 켜진 항목에 맞춰 바뀐다.
 * 고른 값은 다음 단계로 넘어갈 때(허용·허용 안 함·나중에) 마이 › 알림 설정과 같은 스토어에 저장된다.
 */
const NOTI_KEYS = new Set<string>(NOTI_TYPES.map((t) => t.id));
const PREVIEW: Record<string, { title: string; meta: string; time: string }> = {
  attendance: { title: '출석 인증 10분 전이에요', meta: '서비스디자인 · 디자인관 302호 · 10:10까지', time: '09:50' },
  assignment: { title: '과제 마감 3시간 전', meta: '서비스 분석 리포트 · 오늘 23:59', time: '20:59' },
  notice: { title: '학사 공지가 올라왔어요', meta: '2학기 중간고사 시행 안내', time: '10.08' },
  board: { title: '내 글에 댓글이 달렸어요', meta: '서비스디자인 게시판 · 방금', time: '지금' },
};

export function SetupNotifications() {
  const nav = useNav();
  const [on, setOn] = useState<Record<string, boolean>>(Object.fromEntries(NOTI_OPTIONS.map((o) => [o.id, o.on])));
  const [alert, setAlert] = useState(false);
  const first = NOTI_OPTIONS.find((o) => on[o.id]);
  const preview = first ? PREVIEW[first.id] : null;
  const next = () => {
    const setToggle = useMy.getState().setToggle;
    for (const [id, v] of Object.entries(on)) if (NOTI_KEYS.has(id)) setToggle(id as NotiKey, v);
    nav.push(P.setupQuickMenu);
  };

  return (
    <Screen
      figma="411:12022"
      header={<EntryHeader back={false} progress={{ step: 1, total: 2 }} right={<TextLink onPress={next}>나중에</TextLink>} />}
      footer={
        <CtaBar>
          <Button block onClick={() => setAlert(true)}>
            알림 허용하기
          </Button>
        </CtaBar>
      }
      overlay={
        <SystemAlert
          open={alert}
          title="‘WivU’에서 알림을 보내고자 합니다."
          message="경고, 사운드 및 아이콘 배지가 알림에 포함될 수 있습니다. 설정에서 이를 구성할 수 있습니다."
          actions={[
            {
              label: '허용 안 함',
              onPress: () => {
                setAlert(false);
                setTimeout(next, 150);
              },
            },
            {
              label: '허용',
              bold: true,
              onPress: () => {
                setAlert(false);
                toast('알림을 허용했어요', 'bell');
                setTimeout(next, 150);
              },
            },
          ]}
        />
      }
    >
      <div className={s.page}>
        <Hero title={'꼭 필요한 순간만\n알려드릴게요'} desc="받고 싶은 알림만 골라주세요. 설정에서 언제든 바꿀 수 있어요." />
        <div className={s.notiPreview}>
          <AnimatePresence mode="wait">
            {preview ? (
              <motion.div key={preview.title} className={s.notiBanner} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
                <span className={s.appIcon}>
                  <WuMark />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <Text variant="label" className="truncate">
                      {preview.title}
                    </Text>
                    <Text variant="caption-2" color="tertiary" tnum>
                      {preview.time}
                    </Text>
                  </span>
                  <Text variant="caption-2" color="secondary" as="p" className="truncate">
                    {preview.meta}
                  </Text>
                </span>
              </motion.div>
            ) : (
              <motion.p key="none" className="t-callout" style={{ color: 'var(--wivu-color-text-secondary)', padding: '18px 0' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                모든 알림이 꺼져 있어요
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <ListGroup style={{ marginTop: 16 }}>
          {NOTI_OPTIONS.map((o) => (
            <ListRow
              key={o.id}
              leading={<LeadingIcon icon={o.icon} tone="subtle" />}
              title={o.title}
              meta={o.meta}
              trailing={<Switch checked={on[o.id]} label={o.title} onChange={(v) => setOn((m) => ({ ...m, [o.id]: v }))} />}
            />
          ))}
        </ListGroup>
      </div>
    </Screen>
  );
}

/**
 * 초기 설정 2/2 · 퀵메뉴 — Figma 411:12208
 * 최대 8개 선택, 번호 = 선택 순서(레디얼 메뉴 순서). '완료하고 WivU 시작하기' → 홈(스택 초기화).
 */
export function SetupQuickMenu() {
  const nav = useNav();
  const save = useApp((st) => st.setQuickMenu);
  const finishOnboarding = useApp((st) => st.finishOnboarding);
  const [picked, setPicked] = useState<string[]>(RADIAL_DEFAULT);
  const full = picked.length >= QUICK_MAX;

  const toggle = (id: string) => {
    setPicked((list) => {
      if (list.includes(id)) return list.filter((x) => x !== id);
      if (list.length >= QUICK_MAX) {
        toast('최대 8개까지 담을 수 있어요');
        return list;
      }
      return [...list, id];
    });
  };

  return (
    <Screen
      figma="411:12208"
      header={<EntryHeader progress={{ step: 2, total: 2 }} fallback={P.setupNotifications} right={<TextLink onPress={() => setPicked(RADIAL_DEFAULT)}>기본값으로</TextLink>} />}
      footer={
        <CtaBar>
          <Button
            block
            disabled={picked.length === 0}
            onClick={() => {
              save(picked);
              finishOnboarding();
              nav.reset(P.home);
            }}
          >
            완료하고 WivU 시작하기
          </Button>
        </CtaBar>
      }
    >
      <div className={s.page}>
        <Hero title={'자주 쓰는 기능을\n골라주세요'} desc="홈에서 위로 밀면 고른 기능이 바로 열려요. 최대 8개까지 담을 수 있어요." />
        <div className={s.listHead} style={{ marginTop: 24 }}>
          <Text variant="label" as="h3">
            선택한 기능
          </Text>
          <Text variant="label" color="tertiary" tnum>
            <Text variant="label" color="brand">
              {picked.length}
            </Text>{' '}
            / {QUICK_MAX}
          </Text>
        </div>
        <div className={s.quickGrid}>
          {SETUP_ITEMS.map((id) => {
            const q = quickItem(id)!;
            const order = picked.indexOf(id);
            return (
              <button key={id} type="button" className={s.quickTile} aria-pressed={order >= 0} data-full={full} onClick={() => toggle(id)}>
                <span className={s.quickIcon}>
                  <Icon name={q.icon} size={20} color={order >= 0 ? 'primary' : 'tertiary'} />
                </span>
                <Text variant="caption-2-strong" color={order >= 0 ? 'primary' : 'tertiary'}>
                  {q.label}
                </Text>
                {order >= 0 && <span className={`${s.order} t-micro tnum`}>{order + 1}</span>}
              </button>
            );
          })}
        </div>
        <div className={s.hintLine} style={{ marginTop: 16 }}>
          <Icon name="edit" size={16} color="tertiary" />
          <Text variant="caption-2" color="tertiary">
            숫자는 퀵메뉴 순서예요 · 빼고 다시 고르면 맨 뒤로 가요
          </Text>
        </div>
      </div>
    </Screen>
  );
}
