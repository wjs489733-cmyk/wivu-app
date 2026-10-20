import { useState } from 'react';
import { Button, Dialog, Screen, Text, TopNav, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { USER } from '@/data/core';
import { APP_VERSION } from './data';
import { useMy, useNotiOnCount } from './store';
import { SettingGroup, SettingRow } from './parts';
import s from './My.module.css';

/**
 * 마이 — Figma v5 681:5941 (+ 로그아웃 확인 701:8180)
 * 프로필(이름·학과·학번 + 학생증) · 학교 연동 행 · 설정 · 지원 · 로그아웃.
 * 로그아웃 확인 → 상태 초기화 + 잠금 → 로그인(학교 선택 전, 667:4519)으로 DISSOLVE.
 */
export function MyRoot() {
  const nav = useNav();
  const school = useApp((st) => st.selectedSchool);
  const lastSync = useMy((st) => st.lastSync);
  const notiOn = useNotiOnCount();
  const [confirm, setConfirm] = useState(false);

  const logout = () => {
    setConfirm(false);
    // 전역 logout(): 상태 초기화 + 로그인 전 단계 밖으로 못 나가게 잠금
    useApp.getState().logout();
    useMy.getState().resetMy();
    toast('로그아웃했어요');
    nav.reset(P.login, 'fade');
  };

  return (
    <Screen
      figma={confirm ? '701:8180' : '681:5941'}
      header={<TopNav title="마이" fallback={P.home} />}
      overlay={
        <Dialog
          open={confirm}
          title="로그아웃할까요?"
          message="이 기기의 출석·과제 기록과 내 메뉴 설정이 처음 상태로 돌아가요."
          confirmLabel="로그아웃"
          destructive
          onConfirm={logout}
          onCancel={() => setConfirm(false)}
        />
      }
    >
      <div className={s.page}>
        {/* 프로필 */}
        <div className={s.profile}>
          <div className={s.profileText}>
            <Text variant="title-2" as="h2" className="truncate">
              {USER.name}
            </Text>
            <Text variant="body-3" color="secondary" as="p" className="truncate tnum">
              {USER.department} {USER.year}학년 · {USER.studentId}
            </Text>
          </div>
          <Button variant="secondary" size="s" onClick={() => nav.modal(P.studentId)}>
            학생증
          </Button>
        </div>

        <div className={s.gap20} />
        <SettingRow title={school} meta={`학교 연동됨 · 오늘 ${lastSync} 동기화`} value="관리" onPress={() => nav.push(P.mySchool)} />

        <div className={s.gap24} />
        <SettingGroup title="설정">
          <SettingRow title="알림 설정" value={notiOn > 0 ? `${notiOn}개 켜짐` : '모두 꺼짐'} onPress={() => nav.push(P.myNotifications)} />
          <SettingRow title="홈 편집" onPress={() => nav.push(P.homeEdit)} />
          <SettingRow title="메뉴 편집" onPress={() => nav.push(P.myQuickMenu)} />
          <SettingRow title="화면 테마" value="라이트" onPress={() => toast('다크 모드는 다음 버전에서 열려요')} />
        </SettingGroup>

        <div className={s.gap24} />
        <SettingGroup title="지원">
          <SettingRow title="공지사항" onPress={() => nav.push(P.notices)} />
          <SettingRow title="문의하기" onPress={() => toast('문의하기는 다음 버전에서 열려요')} />
          <SettingRow title="개인정보 처리방침" onPress={() => toast('개인정보 처리방침은 다음 버전에서 열려요')} />
          <SettingRow title="앱 버전" value={APP_VERSION} chevron={false} onPress={() => toast('최신 버전을 쓰고 있어요', 'check')} />
        </SettingGroup>

        <div className={s.gap24} />
        <Button variant="tertiary" size="m" className={s.logout} onClick={() => setConfirm(true)}>
          로그아웃
        </Button>
      </div>
    </Screen>
  );
}
