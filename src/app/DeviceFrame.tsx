import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { QRCodeSVG } from 'qrcode.react';
import { DeviceCtx, Icon, Logo, ToastHost } from '@/ui';
import { useApp } from '@/store/app';
import { FLOWS, P } from './paths';
import { findScreen, SCREENS } from './registry';
import s from './DeviceFrame.module.css';

const PHONE_W = 393;
const PHONE_H = 852;
const BEZEL = 12;

function useViewport() {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return vp;
}

function frameOverride(): boolean | null {
  const q = new URLSearchParams(window.location.search).get('frame');
  return q === '1' ? true : q === '0' ? false : null;
}

/** 폰(작은 화면)에서는 전체 화면 앱, 데스크톱에서는 폰 목업 + 전시용 패널 */
export function DeviceFrame({ children }: { children: ReactNode }) {
  const { w, h } = useViewport();
  const override = frameOverride();
  const framed = override ?? w >= 520;
  const wide = framed && w >= 1180;

  if (!framed) {
    return (
      <DeviceCtx.Provider value={{ framed: false }}>
        <div className={s.mobile} style={{ '--status-h': 'env(safe-area-inset-top, 0px)', '--safe-bottom': 'env(safe-area-inset-bottom, 0px)' } as CSSProperties}>
          {children}
          <ToastHost />
        </div>
      </DeviceCtx.Provider>
    );
  }

  const scale = Math.max(0.55, Math.min(1.12, (h - 48) / (PHONE_H + BEZEL * 2)));
  const phone = (
    <div className={s.phoneSlot} style={{ width: (PHONE_W + BEZEL * 2) * scale, height: (PHONE_H + BEZEL * 2) * scale }}>
      <div className={s.phone} style={{ transform: `scale(${scale})` }}>
        <div className={s.screen} style={{ '--status-h': '54px', '--safe-bottom': '34px' } as CSSProperties}>
          {children}
          <div className={s.island} aria-hidden />
          <ToastHost />
        </div>
      </div>
    </div>
  );

  return (
    <DeviceCtx.Provider value={{ framed: true }}>
      <div className={s.desktop}>
        {wide && <LeftPanel />}
        {phone}
        {wide && <RightPanel />}
      </div>
    </DeviceCtx.Provider>
  );
}

/** 화면들이 대응하는 Figma 프레임 수 (중복 없이) */
const FIGMA_FRAMES = new Set(SCREENS.flatMap((sc) => sc.figma)).size;

function LeftPanel() {
  const navigate = useNavigate();
  const demoReset = useApp((st) => st.demoReset);
  const { pathname } = useLocation();
  const go = (path: string, fresh = false) => {
    if (fresh) return restart();
    demoReset(); // 로그아웃 잠금까지 풀고 해당 플로우 시작점으로
    navigate(path, { replace: true, state: { t: 'fade', d: 0 } });
  };
  return (
    <aside className={s.panel}>
      <div className={s.brand}>
        <Logo name="logo-wu-blue" height={36} />
        <div>
          <p className={`${s.tagline} t-title-1`}>Your Campus life flows better with WivU</p>
          <p className="t-callout" style={{ color: 'var(--wivu-color-text-secondary)', marginTop: 6 }}>
            하나로 연결되는 캠퍼스 라이프 · 대학생 통합 앱 기술실증 프로토타입
          </p>
        </div>
      </div>

      <div className={s.block}>
        <p className={`${s.blockTitle} t-caption-2-strong`}>프로토타입 플로우</p>
        <ol className={s.flows}>
          {FLOWS.map((f, i) => {
            const active = pathname === f.path.split('?')[0];
            return (
              <li key={f.id}>
                <button type="button" className={s.flow} data-active={active} onClick={() => go(f.path, f.id === 'start')}>
                  <span className={`${s.flowNo} t-caption-2-strong tnum`}>{String(i + 1).padStart(2, '0')}</span>
                  <span className="t-label">{f.label}</span>
                  <Icon name="arrow-right" size={16} />
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className={s.meta}>
        <MetaItem k="기준 시각" v="2026.09.11 (금) 9:41" />
        <MetaItem k="사용자" v="김유진 · 시각디자인과 4학년 (가상)" />
        <MetaItem k="화면" v={`${SCREENS.length}개 라우트 · Figma ${FIGMA_FRAMES} 프레임 대응`} />
        <MetaItem k="데이터" v="가상 데이터 · 백엔드 없음 · 새로고침 시 초기화" />
      </div>
    </aside>
  );
}

function RightPanel() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const screen = findScreen(pathname);
  const st = useApp();
  const url = window.location.href;
  return (
    <aside className={`${s.panel} ${s.panelRight}`}>
      <div className={s.block}>
        <p className={`${s.blockTitle} t-caption-2-strong`}>지금 보는 화면</p>
        <p className="t-title-2">{screen?.title ?? '—'}</p>
        <div className={s.kv}>
          <MetaItem k="경로" v={pathname} mono />
          <MetaItem k="Figma" v={screen?.figma.join(' · ') ?? '—'} mono />
          <MetaItem k="섹션" v={screen?.section ?? '—'} />
        </div>
      </div>

      <div className={s.block}>
        <p className={`${s.blockTitle} t-caption-2-strong`}>앱 상태 (Figma 변수 → 코드 상태)</p>
        <div className={s.states}>
          <StateChip label="attendanceComplete" on={st.attendanceComplete} />
          <StateChip label="assignmentSubmitted" on={st.assignmentSubmitted} />
          <StateChip label={`selectedSchool: ${st.selectedSchool}`} on />
        </div>
      </div>

      <div className={`${s.block} ${s.qrBlock}`}>
        <div className={s.qr}>
          <QRCodeSVG value={url} size={112} fgColor="#101828" bgColor="transparent" level="M" />
        </div>
        <div>
          <p className="t-label">휴대폰으로 열기</p>
          <p className="t-caption-1" style={{ color: 'var(--wivu-color-text-tertiary)', marginTop: 4 }}>
            카메라로 스캔하면 지금 화면이 폰에서 전체 화면으로 열립니다. 홈 화면에 추가하면 앱처럼 실행돼요.
          </p>
        </div>
      </div>

      <div className={s.actions}>
        <button type="button" className={`${s.action} t-label`} onClick={() => navigate(P.designSystem)}>
          <Icon name="materials" size={20} /> 디자인 시스템
        </button>
        <button type="button" className={`${s.action} t-label`} onClick={restart}>
          <Icon name="arrow-right" size={20} /> 처음부터
        </button>
      </div>
    </aside>
  );
}

/** 전시용 '처음부터': 섹션별 로컬 상태까지 모두 비우도록 새로고침 후 스플래시로 */
function restart() {
  window.location.hash = '#/splash';
  window.location.reload();
}

function MetaItem({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className={s.metaItem}>
      <span className="t-caption-2" style={{ color: 'var(--wivu-color-text-tertiary)' }}>
        {k}
      </span>
      <span className={`t-caption-1 ${mono ? s.mono : ''}`}>{v}</span>
    </div>
  );
}

function StateChip({ label, on }: { label: string; on: boolean }) {
  return (
    <span className={`${s.stateChip} t-caption-2-strong`} data-on={on}>
      <span className={s.stateDot} />
      {label}
      {label.includes(':') ? '' : on ? ' = true' : ' = false'}
    </span>
  );
}
