import { useEffect, useId, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button, Checkbox, CtaBar, Icon, Screen, Text, TextField, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { EntryHeader, Hero, TextLink } from './parts';
import s from './Entry.module.css';

/**
 * 로그인 — Figma 366:9848(빈) · 411:8210(입력 중) · 411:8258(오류)
 * 학번·비밀번호가 모두 입력되면 버튼 활성 → 0.7초 확인 → 학교 정보 연동 중(DISSOLVE).
 * 오류 재현: 비밀번호 4자 미만, 또는 Flow 시작점 '예외 · 로그인 오류'(?error=1)의 첫 시도.
 */
export function Login() {
  const nav = useNav();
  const school = useApp((st) => st.selectedSchool);
  const login = useApp((st) => st.login);
  const [params] = useSearchParams();
  const forceError = params.get('error') === '1';

  const [id, setId] = useState(forceError ? '20231234' : '');
  const [pw, setPw] = useState(forceError ? '1234567' : '');
  const [auto, setAuto] = useState(true);
  const [fails, setFails] = useState(forceError ? 1 : 0);
  const [error, setError] = useState(forceError);
  const [loading, setLoading] = useState(false);
  const forced = useRef(forceError);
  const timer = useRef<number>(0);
  const formId = useId();
  useEffect(() => () => clearTimeout(timer.current), []);

  const ready = id.trim().length > 0 && pw.length > 0;

  const submit = () => {
    if (!ready || loading) return;
    setLoading(true);
    timer.current = window.setTimeout(() => {
      setLoading(false);
      const wrong = pw.length < 4 || (forced.current && fails < 1);
      if (wrong) {
        setFails((n) => n + 1);
        setError(true);
        return;
      }
      forced.current = false;
      login();
      nav.fade(P.linking);
    }, 700);
  };

  return (
    <Screen
      figma={error ? '411:8258' : ready ? '411:8210' : '366:9848'}
      header={<EntryHeader title="로그인" fallback={P.school} />}
      footer={
        // 로그인 버튼은 작은 화면(375×667)에서도 항상 보이게 하단 고정
        <CtaBar>
          <div className={s.ctaStack}>
            <Button type="submit" form={formId} block disabled={!ready} loading={loading}>
              {error ? '다시 로그인' : '로그인'}
            </Button>
            {error ? (
              <TextLink tone="brand" onPress={() => toast('학교 포털 비밀번호 재설정 페이지로 연결돼요')}>
                학교 포털에서 비밀번호 재설정하기
              </TextLink>
            ) : (
              <TextLink onPress={() => toast('학교 포털 비밀번호 찾기로 연결돼요')}>비밀번호를 잊으셨나요?</TextLink>
            )}
          </div>
        </CtaBar>
      }
    >
      <form
        id={formId}
        className={s.page}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Hero title={`${school}\n학번으로 로그인하세요`} desc="학교 포털과 같은 학번·비밀번호를 입력하세요." />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
          <div className={s.schoolCard}>
            <span className={s.schoolIcon}>
              <Icon name="courses" size={16} />
            </span>
            <Text variant="label" style={{ flex: 1 }}>
              {school}
            </Text>
            <TextLink tone="brand" onPress={() => nav.back(P.school)}>
              변경
            </TextLink>
          </div>
          <TextField
            value={id}
            onChange={(e) => {
              setId(e.target.value.replace(/\D/g, '').slice(0, 10));
              setError(false);
            }}
            placeholder="학번"
            inputMode="numeric"
            autoComplete="username"
            aria-label="학번"
          />
          <div>
            <TextField
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setError(false);
              }}
              type="password"
              reveal
              placeholder="비밀번호"
              autoComplete="current-password"
              aria-label="비밀번호"
              error={error}
            />
            {error && (
              <div className={s.errorLine} style={{ marginTop: 8 }} role="alert">
                <Icon name="warning" size={16} color="error" />
                <Text variant="caption-1" color="error">
                  학번 또는 비밀번호가 일치하지 않아요 ({fails}/5회)
                </Text>
              </div>
            )}
          </div>
          <div style={{ padding: '4px 0' }}>
            <Checkbox checked={auto} onChange={setAuto} label="자동 로그인" />
          </div>
          <div className={s.infoBox}>
            <Text variant="caption-1" color="secondary" as="p">
              입력한 정보는 학교 인증 서버로만 전송되며,
              <br />
              앱에는 저장되지 않습니다.
            </Text>
          </div>
          <div className={s.hintLine}>
            <Icon name="student" size={16} color="tertiary" />
            <Text variant="caption-2" color="tertiary">
              학번은 학생증이나 학교 포털 마이페이지에서 확인할 수 있어요
            </Text>
          </div>
        </div>
      </form>
    </Screen>
  );
}
