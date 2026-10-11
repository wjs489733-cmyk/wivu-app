import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Button, Card, Chip, Dialog, Icon, ListGroup, ListRow, Screen, SectionDivider, Text, TopNav, toast, type IconName } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { COURSES, TOTAL_CREDITS, USER } from '@/data/core';
import { APP_VERSION } from './data';
import { useMy, useNotiOnCount } from './store';
import s from './My.module.css';

/**
 * 마이·설정 — Figma 424:8665 (홈 헤더 프로필 → PUSH)
 * 프로필 · 학교 연동 카드 · 앱 설정 · 지원 · 로그아웃(확인 후 로그인 화면으로 DISSOLVE)
 */
export function MyRoot() {
  const nav = useNav();
  const navigate = useNavigate();
  const school = useApp((st) => st.selectedSchool);
  const quickCount = useApp((st) => st.quickMenu.length);
  const lastSync = useMy((st) => st.lastSync);
  const notiOn = useNotiOnCount();
  const [confirm, setConfirm] = useState(false);

  const logout = () => {
    setConfirm(false);
    // 전역 logout(): 상태 초기화 + 진입 화면 밖으로 못 나가게 잠금
    useApp.getState().logout();
    useMy.getState().resetMy();
    toast('로그아웃했어요');
    // Figma: 로그아웃 → 로그인(빈 상태) DISSOLVE. 스택은 '학교 선택 → 로그인'으로 다시 쌓아
    // 로그인 화면의 뒤로/학교 다시 선택이 홈이 아닌 학교 선택으로 가게 한다.
    navigate(P.school, { replace: true, state: { t: 'none', d: 0 } });
    navigate(P.login, { state: { t: 'fade', d: 1 } });
  };

  return (
    <Screen
      figma="424:8665"
      header={<TopNav title="마이" fallback={P.home} />}
      overlay={
        <Dialog
          open={confirm}
          title="로그아웃할까요?"
          message="이 기기의 출석·과제 기록과 퀵메뉴 설정이 처음 상태로 돌아가요."
          confirmLabel="로그아웃"
          destructive
          onConfirm={logout}
          onCancel={() => setConfirm(false)}
        />
      }
    >
      <div className={s.page}>
        {/* 프로필 */}
        <Card variant="brand" className={s.profile}>
          <div className={s.profileTop}>
            <span className={s.avatar} aria-hidden>
              <Text variant="title-1" color="brand">
                {USER.initial}
              </Text>
            </span>
            <div style={{ minWidth: 0 }}>
              <div className={s.nameRow}>
                <Text variant="title-1" color="on-brand" as="h2">
                  {USER.name}
                </Text>
                <Chip tone="onBrand" pill>
                  재학 인증
                </Chip>
              </div>
              <Text variant="caption-1" color="on-brand-muted" as="p" className="truncate tnum">
                {USER.department} · {USER.year}학년 · {USER.studentId}
              </Text>
            </div>
          </div>
          <div className={s.profileActions}>
            <Button variant="onBrandGhost" size="m" grow leadingIcon="student-id" onClick={() => nav.modal(P.studentId)}>
              모바일 학생증
            </Button>
            <Button variant="onBrandGhost" size="m" grow leadingIcon="comment" onClick={() => nav.tab(P.board)}>
              내 활동
            </Button>
          </div>
        </Card>

        {/* 학교 연동 카드 → 학교 연동 관리 */}
        <Card variant="outline" className={s.schoolCard} onPress={() => nav.push(P.mySchool)} aria-label={`${school} 연동 관리`}>
          <div className={s.schoolInner}>
            <span className={s.emblem}>
              <Icon name="library" size={20} />
            </span>
            <span className={s.schoolText}>
              <span className={s.schoolName}>
                <Text variant="subhead" className="truncate">
                  {school}
                </Text>
                <Chip tone="pulse">연동됨</Chip>
              </span>
              <Text variant="caption-2" color="secondary" className="truncate tnum">
                오늘 {lastSync} 동기화 · {COURSES.length}과목 {TOTAL_CREDITS}학점
              </Text>
            </span>
            <Icon name="arrow-right" size={20} color="primary" />
          </div>
        </Card>
      </div>

      <SectionDivider />
      <Group title="앱 설정">
        <SettingRow icon="bell" title="알림 설정" value={`${notiOn}개 켜짐`} onPress={() => nav.push(P.myNotifications)} />
        <SettingRow icon="quick-attendance" title="퀵메뉴 편집" value={`${quickCount}개`} onPress={() => nav.push(P.myQuickMenu)} />
        <SettingRow icon="settings" title="화면 테마" value="라이트" onPress={() => toast('다크 모드는 다음 버전에서 열려요')} />
        <SettingRow icon="location" title="기본 캠퍼스" value={USER.campus} onPress={() => toast('캠퍼스 변경은 다음 버전에서 열려요')} />
      </Group>

      <SectionDivider />
      <Group title="지원">
        <SettingRow icon="notice" title="공지사항" onPress={() => nav.push(P.notices)} />
        <SettingRow icon="comment" title="문의하기" onPress={() => toast('문의하기는 다음 버전에서 열려요')} />
        <SettingRow icon="user" title="개인정보 처리방침" onPress={() => toast('개인정보 처리방침은 다음 버전에서 열려요')} />
        <SettingRow title="앱 버전" value={APP_VERSION} onPress={() => toast('최신 버전을 쓰고 있어요', 'check')} />
      </Group>

      <button type="button" className={s.logout} onClick={() => setConfirm(true)}>
        <Text variant="subhead" color="error">
          로그아웃
        </Text>
      </button>
    </Screen>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={s.group}>
      <Text variant="caption-1-strong" color="tertiary" as="h2" className={s.groupTitle}>
        {title}
      </Text>
      <ListGroup>{children}</ListGroup>
    </section>
  );
}

function SettingRow({ icon, title, value, onPress }: { icon?: IconName; title: string; value?: ReactNode; onPress: () => void }) {
  return (
    <ListRow
      leading={icon ? <Icon name={icon} size={20} className={s.rowIcon} /> : undefined}
      title={title}
      titleVariant="body"
      trailing={
        value ? (
          <Text variant="callout" color="tertiary" tnum>
            {value}
          </Text>
        ) : undefined
      }
      chevron
      onPress={onPress}
    />
  );
}
