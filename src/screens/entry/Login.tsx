import { useEffect, useId, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button, Checkbox, CtaBar, Icon, Screen, Text, TextField, TopNav, toast } from '@/ui';
import { useNav } from '@/nav/nav';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { useEntry } from './store';
import { ChevronLink } from './parts';
import { SchoolSheet } from './SchoolSheet';
import s from './Entry.module.css';

/**
 * 로그인 — Figma v5 (한 라우트 안의 상태)
 *   667:4519 학교 선택 전 ('재학 중인 대학교를 선택해 주세요' + '대학교 찾기 ›')
 *   667:4592 대학교 검색 시트 (?school=1 로 바로 열림 — 마이 › 학교 연동 해제)
 *   669:4633 입력 완료 ('{학교}\n학번으로 로그인해 주세요' + '학교 변경 ›')
 *   669:4725 오류 (?error=1 = Flow 시작점 '예외 · 로그인 오류')
 * 학교를 고르고 학번·비밀번호를 모두 입력하면 버튼 활성 → 0.7초 확인 → 정보 불러오는 중(DISSOLVE).
 * 오류 재현: 비밀번호 3자 이하, 또는 ?error=1 로 들어온 화면(첫 시도 실패 상태로 시작, 다시 누르면 통과).
 */
export function Login() {
  const nav = useNav();
  const school = useApp((st) => st.selectedSchool);
  const setSchool = useApp((st) => st.setSchool);
  const login = useApp((st) => st.login);
  const storePicked = useEntry((st) => st.schoolPicked);
  const [params] = useSearchParams();
  const forceError = params.get('error') === '1';
  const openSheet = params.get('school') === '1';
  // 진입 쿼리가 정한 첫 상태 (오류 데모 = 학교가 정해진 상태 · 학교 연동 해제 = 선택 전) — 첫 프레임부터 맞게
  const [entryPicked, setEntryPicked] = useState<boolean | null>(forceError ? true : openSheet ? false : null);
  const picked = entryPicked ?? storePicked;

  const [id, setId] = useState(forceError ? '20231234' : '');
  const [pw, setPw] = useState(forceError ? '12345678' : '');
  const [keep, setKeep] = useState(forceError);
  const [fails, setFails] = useState(forceError ? 1 : 0);
  const [error, setError] = useState(forceError);
  const [loading, setLoading] = useState(false);
  const [sheet, setSheet] = useState(openSheet);
  const timer = useRef<number>(0);
  const formId = useId();

  useEffect(() => {
    if (entryPicked === true) useEntry.getState().pickSchool();
    else if (entryPicked === false) useEntry.getState().clearSchool();
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ready = picked && id.trim().length > 0 && pw.length > 0;

  const submit = () => {
    if (!ready || loading) return;
    setLoading(true);
    timer.current = window.setTimeout(() => {
      setLoading(false);
      if (pw.length <= 3) {
        setFails((n) => Math.min(5, n + 1));
        setError(true);
        return;
      }
      login();
      nav.fade(P.linking);
    }, 700);
  };

  const pick = (name: string) => {
    setSchool(name);
    useEntry.getState().pickSchool();
    setEntryPicked(null);
    setError(false);
    setSheet(false);
  };

  const figma = sheet ? '667:4592' : error ? '669:4725' : picked ? '669:4633' : '667:4519';

  return (
    <Screen
      figma={figma}
      header={<TopNav title="로그인" fallback={P.intro(1)} />}
      overlay={<SchoolSheet open={sheet} onClose={() => setSheet(false)} onPick={pick} />}
      footer={
        // 로그인 버튼은 작은 화면(375×667)에서도 항상 보이게 하단 고정
        <CtaBar>
          <div className={s.ctaStack}>
            <Button type="submit" form={formId} block disabled={!ready} loading={loading}>
              로그인
            </Button>
            <div className={s.subLinks}>
              <button type="button" className={`${s.subLink} t-caption-1`} onClick={() => toast('학교 포털 비밀번호 찾기로 연결돼요')}>
                비밀번호 찾기
              </button>
              <span className={s.subBar} aria-hidden />
              <button type="button" className={`${s.subLink} t-caption-1`} onClick={() => toast('학번은 학생증이나 학교 포털 마이페이지에서 확인할 수 있어요')}>
                학번 찾기
              </button>
            </div>
          </div>
        </CtaBar>
      }
    >
      <form
        id={formId}
        className={s.loginPage}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className={s.loginHead}>
          <Text variant="title-2" as="h2" className={s.preLine}>
            {picked ? (
              <>
                <Text variant="title-2" color="brand">
                  {school}
                </Text>
                {'\n학번으로 로그인해 주세요'}
              </>
            ) : (
              '재학 중인 대학교를\n선택해 주세요'
            )}
          </Text>
          <ChevronLink onPress={() => setSheet(true)}>{picked ? '학교 변경' : '대학교 찾기'}</ChevronLink>
        </div>

        <div className={s.fields}>
          <TextField
            value={id}
            onChange={(e) => {
              setId(e.target.value.replace(/\D/g, '').slice(0, 10));
              setError(false);
            }}
            placeholder="학번을 입력해 주세요"
            inputMode="numeric"
            autoComplete="username"
            aria-label="학번"
          />
          <TextField
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setError(false);
            }}
            type="password"
            reveal={pw.length > 0} // Figma: 빈 칸(667:4519)엔 '표시' 없음, 입력하면 나타남(669:4633)
            placeholder="비밀번호를 입력해 주세요"
            autoComplete="current-password"
            aria-label="비밀번호"
            error={error ? `학번 또는 비밀번호가 맞지 않아요 (${fails}/5)` : undefined}
          />
        </div>

        <div className={s.keep}>
          <Checkbox checked={keep} onChange={setKeep} label="로그인 상태 유지" />
        </div>

        <div className={s.caption}>
          <Icon name="info" size={16} color="tertiary" />
          <Text variant="caption-1" color="tertiary" as="p">
            학교 포털과 같은 학번·비밀번호를 사용해요. 입력한 정보는 앱에 저장되지 않아요.
          </Text>
        </div>
      </form>
    </Screen>
  );
}
