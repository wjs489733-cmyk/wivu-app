import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import primitive from '../../design/tokens/primitive.tokens.json';
import semantic from '../../design/tokens/semantic.tokens.json';
import typography from '../../design/tokens/typography.tokens.json';
import layout from '../../design/tokens/layout.tokens.json';
import elevation from '../../design/tokens/elevation.tokens.json';
import { icons, ICON_SET, type IconName } from '@/icons/icons.generated';
import {
  Avatar,
  AvatarStack,
  BottomSheet,
  Button,
  Card,
  Checkbox,
  Chip,
  CountBadge,
  DeviceCtx,
  Dialog,
  DotBadge,
  Icon,
  Keypad,
  LargeHeader,
  LeadingIcon,
  ListGroup,
  ListRow,
  Logo,
  MetaLine,
  NewBadge,
  OptionRow,
  PinBoxes,
  ProgressBar,
  SearchField,
  Section,
  SectionDivider,
  Segmented,
  Spinner,
  Switch,
  TabBar,
  Text,
  TextField,
  TextTabs,
  Tile,
  TopNav,
  IconButton,
  toast,
  ToastHost,
  type ButtonVariant,
} from '@/ui';
import s from './DesignSystemPage.module.css';

type Tok = { $value: unknown; $type?: string; $description?: string; $extensions?: Record<string, { source?: string; note?: string }> };
const isTok = (o: unknown): o is Tok => !!o && typeof o === 'object' && '$value' in (o as object);
function flatten(obj: Record<string, unknown>, path: string[] = []): { path: string[]; tok: Tok }[] {
  return Object.entries(obj).flatMap(([k, v]) => (k.startsWith('$') ? [] : isTok(v) ? [{ path: [...path, k], tok: v }] : flatten(v as Record<string, unknown>, [...path, k])));
}
const hexOf = (v: unknown): string | null => (v && typeof v === 'object' && 'hex' in v ? (v as { hex: string }).hex : null);
const PRIM = Object.fromEntries(flatten(primitive as never).map(({ path, tok }) => [path.join('.'), tok]));
const resolveColor = (v: unknown): { hex: string; alpha: number } | null => {
  if (typeof v === 'string' && v.startsWith('{')) return resolveColor(PRIM[v.slice(1, -1)]?.$value);
  if (v && typeof v === 'object' && 'hex' in v) return { hex: (v as { hex: string }).hex, alpha: (v as unknown as { alpha: number }).alpha };
  return null;
};
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

export default function DesignSystemPage() {
  const navigate = useNavigate();
  const prims = flatten(primitive as never);
  const sems = flatten(semantic as never);
  const types = flatten(typography as never).filter((t) => t.tok.$type === 'typography' || t.path[0] === 'type');
  const spaces = flatten(layout as never).filter((t) => t.path[0] === 'space');
  const radii = flatten(layout as never).filter((t) => t.path[0] === 'radius');
  const shadows = flatten(elevation as never);
  const codeOnly = [...sems, ...flatten(layout as never), ...shadows].filter((t) => t.tok.$extensions?.['com.wivu']).length;

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerMain}>
          <Logo name="logo-wu-blue" height={40} />
          <div>
            <h1 className={`t-display ${s.h1}`}>WivU Design System v4</h1>
            <p className="t-body" style={{ color: 'var(--wivu-color-text-secondary)' }}>
              Figma 변수·텍스트 스타일·Button v4를 W3C DTCG 토큰으로 추출 → Style Dictionary로 CSS 변수 생성 → React 컴포넌트가 토큰만 참조
            </p>
          </div>
        </div>
        <div className={s.pipeline}>
          {['Figma 변수 67 · 스타일 17', 'design/tokens (DTCG 2025.10)', 'Style Dictionary 5', 'tokens.css · typography.css', 'React UI'].map((step, i) => (
            <span key={step} className={s.pipeStep}>
              {i > 0 && <Icon name="chevron-right" size={16} color="tertiary" />}
              <span className="t-caption-1-strong">{step}</span>
            </span>
          ))}
        </div>
        <div className={s.headerStats}>
          <Stat n={prims.length} k="Primitive 색" />
          <Stat n={sems.filter((t) => t.tok.$type === 'color').length} k="Semantic 색" />
          <Stat n={types.length} k="WivU Type" />
          <Stat n={Object.keys(icons).length} k="아이콘" />
          <Stat n={codeOnly} k="코드 확장 토큰" />
          <button type="button" className={`${s.back} t-label`} onClick={() => navigate('/home')}>
            앱으로 돌아가기 <Icon name="arrow-right" size={16} />
          </button>
        </div>
      </header>

      <div className={s.grid}>
        {/* ── 1. 색 ───────────────────────── */}
        <Panel title="Color · Semantic" sub="화면은 semantic만 쓴다 (primitive 직접 바인딩 금지). 흰 배경 대비율 WCAG 표시" span={2}>
          <div className={s.semGrid}>
            {sems
              .filter((t) => t.tok.$type === 'color')
              .map(({ path, tok }) => {
                const c = resolveColor(tok.$value);
                const ref = typeof tok.$value === 'string' ? tok.$value.slice(1, -1).replace('color.primitive.', '') : 'raw';
                const isText = path[1] === 'text' || path[1] === 'icon' || path[1] === 'status';
                const cr = c && c.alpha === 1 ? contrast(c.hex, '#FFFFFF') : null;
                const code = !!tok.$extensions?.['com.wivu'];
                return (
                  <div key={path.join('/')} className={s.sem}>
                    <span className={s.swatch} style={{ background: `var(--wivu-${path.join('-')})` }} />
                    <span className={s.semText}>
                      <span className="t-caption-1-strong">{path.slice(1).join('/')}</span>
                      <span className="t-caption-2" style={{ color: 'var(--wivu-color-text-tertiary)' }}>
                        {code ? '코드 확장' : `→ ${ref}`} {c && `· ${c.hex}${c.alpha < 1 ? ` ${Math.round(c.alpha * 100)}%` : ''}`}
                      </span>
                    </span>
                    {isText && cr && (
                      <span className={`${s.cr} t-micro`} data-pass={cr >= 4.5 ? 'aa' : cr >= 3 ? 'large' : 'fail'}>
                        {cr.toFixed(2)}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </Panel>

        <Panel title="Color · Primitives" sub="WivU/Color Primitives 21">
          <div className={s.primGrid}>
            {prims.map(({ path, tok }) => (
              <div key={path.join('/')} className={s.prim}>
                <span className={s.primSwatch} style={{ background: hexOf(tok.$value) ?? undefined }} />
                <span className="t-caption-2-strong">{path.slice(2).join('/')}</span>
                <span className="t-caption-2 tnum" style={{ color: 'var(--wivu-color-text-tertiary)' }}>
                  {hexOf(tok.$value)}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        {/* ── 2. 타이포 ───────────────────── */}
        <Panel title="Typography · WivU Type 15" sub="Pretendard Variable (최종 결정) · 크기/행간 굵기 · 자간" span={2}>
          <div className={s.typeList}>
            {types.map(({ path, tok }) => {
              const v = tok.$value as { fontSize: { value: number }; fontWeight: number; lineHeight: number; letterSpacing: { value: number } };
              const name = path.slice(1).join('-');
              return (
                <div key={name} className={s.typeRow}>
                  <span className={`t-${name} truncate`}>{name === 'number' ? '100% · 17학점' : '서비스디자인 출석 인증하기'}</span>
                  <span className="t-caption-2 tnum" style={{ color: 'var(--wivu-color-text-tertiary)' }}>
                    {name} · {v.fontSize.value}/{Math.round(v.fontSize.value * v.lineHeight)} · {v.fontWeight}
                    {v.letterSpacing.value ? ` · ${v.letterSpacing.value}em` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Space · Radius · Elevation" sub="간격은 4/8 배수 스케일만 (Stack/Row가 타입으로 강제)">
          <div className={s.scale}>
            {spaces.map(({ path, tok }) => (
              <div key={path.join()} className={s.scaleRow}>
                <span className="t-caption-2 tnum" style={{ width: 52 }}>
                  space/{path[1]}
                </span>
                <span className={s.bar} style={{ width: (tok.$value as { value: number }).value * 4 }} />
              </div>
            ))}
          </div>
          <div className={s.radii}>
            {radii.map(({ path, tok }) => (
              <div key={path.join()} className={s.radius} style={{ borderRadius: `var(--wivu-radius-${path[1]})` }}>
                <span className="t-caption-2-strong">{path[1]}</span>
                {tok.$extensions?.['com.wivu'] && <span className="t-micro" style={{ color: 'var(--wivu-color-text-tertiary)' }}>코드</span>}
              </div>
            ))}
          </div>
          <div className={s.radii}>
            {shadows.map(({ path }) => (
              <div key={path.join()} className={s.shadow} style={{ boxShadow: `var(--wivu-elevation-${path[1]})` }}>
                <span className="t-caption-2-strong">{path[1]}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* ── 3. 버튼 ─────────────────────── */}
        <Panel title="Button v4" sub="L h52 r14 · M h44 r12 · S h32 pill — 화면당 Primary 1개 · Disabled는 bg/disabled로 보완" span={2}>
          <div className={s.btnScroll}>
            <ButtonMatrix />
          </div>
        </Panel>

        <Panel title="Chip · Badge · Avatar · Progress">
          <div className={s.wrap}>
            <Chip tone="brand">전공</Chip>
            <Chip tone="neutral">3학점</Chip>
            <Chip tone="brand">학사</Chip>
            <Chip tone="pulse">장학</Chip>
            <Chip tone="neutral">행사</Chip>
            <Chip tone="danger">D-DAY</Chip>
            <Chip tone="dangerSoft">D-2 마감</Chip>
            <Chip tone="warningSoft">지각</Chip>
            <Chip tone="brand" icon="check" pill>
              재학생 인증 게시판
            </Chip>
          </div>
          <div className={s.wrap} style={{ background: 'var(--wivu-color-bg-brand)', padding: 12, borderRadius: 16 }}>
            <Chip tone="onBrand" size="m" dot>
              출석 가능 · 10:10까지
            </Chip>
            <Chip tone="white" size="m">
              UX 리서치
            </Chip>
          </div>
          <div className={s.wrap}>
            <NewBadge />
            <CountBadge count={3} />
            <DotBadge />
            <Avatar name="유진" tone="soft" />
            <Avatar name="유진" size={40} />
            <AvatarStack names={['A', 'B', 'C']} />
          </div>
          <Stack>
            <ProgressBar value={100} />
            <ProgressBar value={50} tone="error" />
            <ProgressBar value={72} tone="pulse" />
          </Stack>
        </Panel>

        {/* ── 4. 카드 · 리스트 ────────────── */}
        <Panel title="Card · List · Section" sub="카드 r16 + 1px 보더(그림자 없음) · 리스트 행 패딩 14 · 섹션 제목 Title 2 + '전체 N ›'" span={2}>
          <div className={s.cols3}>
            <Card variant="brand">
              <Chip tone="onBrand" size="m" dot>
                출석 가능 · 10:10까지
              </Chip>
              <Text variant="display" color="on-brand" as="p" style={{ marginTop: 16 }}>
                서비스디자인
              </Text>
              <MetaLine items={['디자인관 302호', '전공', '김OO 교수']} color="on-brand-muted" variant="callout" />
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <Button variant="onBrand" grow>
                  출석 인증하기
                </Button>
                <Button variant="onBrandGhost" leadingIcon="student">
                  학생증
                </Button>
              </div>
            </Card>
            <div style={{ display: 'grid', gap: 8 }}>
              <Card variant="outline">
                <Text variant="caption-1" color="secondary" as="p">
                  이 수업 과제
                </Text>
                <Text variant="headline" as="p" style={{ marginTop: 4 }}>
                  서비스 분석 리포트
                </Text>
                <MetaLine items={['오늘 23:59 마감', '미제출']} />
              </Card>
              <Card variant="soft">
                <Text variant="caption-1" color="brand" as="p">
                  다음 강의실
                </Text>
                <Text variant="headline" as="p" style={{ marginTop: 4 }}>
                  디자인관 401호
                </Text>
                <MetaLine items={['13:00 브랜드디자인', '도보 4분']} color="secondary" />
              </Card>
              <Card variant="pulse">
                <Chip tone="white">UX 리서치</Chip>
                <Text variant="headline" as="p" style={{ marginTop: 8 }}>
                  사용자 인터뷰 같이 진행할 팀원 2명
                </Text>
              </Card>
            </div>
            <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
              <Section title="공지사항" more="전체 3" padded={false}>
                <ListGroup>
                  <ListRow title="오늘 수업 진행 방식 안내" titleAddon={<NewBadge />} meta="09.11 08:30 · 김OO 교수" onPress={() => toast('공지 상세로 이동')} />
                  <ListRow title="중간 발표 팀 구성 안내" meta="09.04 · 김OO 교수" onPress={() => {}} />
                </ListGroup>
              </Section>
              <ListGroup>
                <ListRow leading={<LeadingIcon icon="file" />} title="서비스 블루프린트.pdf" meta="PDF · 4.2MB · 09.11" trailing={<Icon name="download" size={20} color="primary" />} />
                <ListRow leading={<LeadingIcon icon="notice" tone="subtle" />} title="학사·장학 공지" meta="수강정정, 장학, 학사 일정" trailing={<Switch checked label="학사 공지" onChange={() => {}} />} />
              </ListGroup>
            </div>
          </div>
        </Panel>

        <Panel title="Tile · Divider" sub="과목 상세 4열 / 게시판 3열 아웃라인">
          <div className={s.tiles4}>
            <Tile icon="notice" label="공지" sub="1개 새 글" subColor="brand" />
            <Tile icon="assignment" label="과제" sub="1개 진행" />
            <Tile icon="materials" label="강의자료" sub="4개" />
            <Tile icon="attendance" label="출석" sub="100%" />
          </div>
          <SectionDivider />
          <div className={s.tiles3}>
            <Tile variant="outline" icon="comment" label="자유게시판" dot />
            <Tile variant="outline" icon="notice" label="정보게시판" />
            <Tile variant="outline" icon="users" label="팀플·스터디" dot />
          </div>
        </Panel>

        {/* ── 5. 폼 ───────────────────────── */}
        <Panel title="Form" sub="입력 h56 r16 bg/subtle → 포커스 흰 배경 + 브랜드 보더 · 스위치 on = brand">
          <FormDemo />
        </Panel>

        <Panel title="PIN · Keypad" sub="실제 입력 로직 · 기본 2~4자리 유연 입력(뒤 2칸 점선 = 선택) · 수업이 자릿수를 알려주면 그 칸 수만 · [확인]으로 제출">
          <PinDemo />
        </Panel>

        {/* ── 6. 내비게이션 ───────────────── */}
        <Panel title="Navigation" sub="TopNav(상세) · LargeHeader(탭 루트) · TabBar(가운데 홈 범프) · 전환: push 0.3 / modal / fade / 탭 즉시">
          <NavDemo />
        </Panel>

        {/* ── 7. 아이콘 ───────────────────── */}
        <Panel title={`Icons · ${Object.keys(icons).length}`} sub={`${ICON_SET.name} v${ICON_SET.version} · 24 그리드 · 선 ${ICON_SET.strokeWidth} 둥근 끝 · 안전 영역 2px · currentColor · 16/20/24 (선은 크기에 비례)`} span={2}>
          <div className={s.iconGrid}>
            {(Object.keys(icons) as IconName[]).map((n) => (
              <div key={n} className={s.iconCell} title={`${icons[n].label} · ${icons[n].category}`}>
                <div style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
                  <Icon name={n} size={24} color="primary" />
                  <Icon name={n} size={20} color="secondary" />
                  <Icon name={n} size={16} color="brand" />
                </div>
                <span className="t-caption-2 truncate">{n}</span>
                <span className="t-micro truncate" style={{ color: 'var(--wivu-color-text-tertiary)', fontWeight: 400 }}>
                  {icons[n].label} · {icons[n].status}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Overlay" sub="바텀시트(드래그로 닫기) · 토스트 · 다이얼로그">
          <OverlayDemo />
        </Panel>

        {/* ── 8. 규칙 ─────────────────────── */}
        <Panel title="디자인 규칙 (v4 · 코드 기준)" sub="docs/design-rules.md 요약" span={3}>
          <div className={s.rules}>
            {RULES.map(([t, d]) => (
              <div key={t} className={s.rule}>
                <Text variant="label" as="p">
                  {t}
                </Text>
                <Text variant="caption-1" color="secondary" as="p">
                  {d}
                </Text>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

const RULES: [string, string][] = [
  ['레이아웃', '프레임 393×852 기준 · 카드 좌우 16 · 텍스트 좌측 20 · 오른쪽 정렬선 = 폭−20 · 간격은 4/8 배수'],
  ['섹션', '섹션 사이 전폭 1px 구분선(border/default) · 제목 Title 2 · 더보기 "전체 N ›" Caption 1 tertiary'],
  ['타이포', 'WivU Type 15종만 사용 · 메타는 Regular 기본(Semibold 남발 금지) · 11px 미만 금지'],
  ['색', 'semantic 토큰만 사용 · 틴트는 토큰 + 투명도 · 브랜드 블루 하나가 강조, 라임은 "살아있는" 상태에만'],
  ['버튼', 'Button v4만 사용 · 화면당 Primary 1개 · 파란 카드 위는 OnBrand / OnBrandGhost'],
  ['아이콘', '16/20/24 · 선 두께 = 크기/12 · currentColor로 색 제어'],
  ['상태바·헤더', '스크롤해도 상태바+헤더 고정(흰 배경) · 스크롤 시 1px 라인'],
  ['하단 고정', '탭바 화면: 탭바 + 홈 인디케이터 고정 / 하위 화면: CTA 바 고정 · 콘텐츠 아래 여백 자동'],
  ['전환', '상세 push 0.3s · 입력·모달 아래→위 · 완료·상태 dissolve · 탭 이동 즉시 · 뒤로 = 역방향'],
  ['상태', 'attendanceComplete / assignmentSubmitted / selectedSchool → 전역 상태, 홈 탭이 자동 분기'],
  ['데이터', '2026-09-11(금) 9:41 · 김유진 · 6과목 17학점 · 가상 데이터만 · 실제 규정처럼 보이는 정보 금지'],
  ['접근성', '터치 영역 44 이상 · 포커스 링 · 모션 감소 설정 존중 · 브랜드 텍스트 대비 3.71:1 → 보강 토큰 결정 대기'],
];

function Panel({ title, sub, children, span = 1 }: { title: string; sub?: string; children: ReactNode; span?: 1 | 2 | 3 }) {
  return (
    <section className={s.panel} style={{ gridColumn: `span ${span}` }}>
      <div className={s.panelHead}>
        <h2 className="t-title-2">{title}</h2>
        {sub && (
          <p className="t-caption-1" style={{ color: 'var(--wivu-color-text-tertiary)' }}>
            {sub}
          </p>
        )}
      </div>
      <div className={s.panelBody}>{children}</div>
    </section>
  );
}

function Stat({ n, k }: { n: number; k: string }) {
  return (
    <div className={s.stat}>
      <span className="t-number tnum">{n}</span>
      <span className="t-caption-1" style={{ color: 'var(--wivu-color-text-tertiary)' }}>
        {k}
      </span>
    </div>
  );
}

function Stack({ children }: { children: ReactNode }) {
  return <div style={{ display: 'grid', gap: 10 }}>{children}</div>;
}

function ButtonMatrix() {
  const variants: ButtonVariant[] = ['primary', 'soft', 'outline', 'onBrand', 'onBrandGhost', 'dark'];
  return (
    <div className={s.btnMatrix}>
      <span />
      {(['l', 'm', 's'] as const).map((sz) => (
        <span key={sz} className="t-caption-2-strong" style={{ color: 'var(--wivu-color-text-tertiary)' }}>
          {sz.toUpperCase()}
        </span>
      ))}
      <span className="t-caption-2-strong" style={{ color: 'var(--wivu-color-text-tertiary)' }}>
        Disabled
      </span>
      {variants.map((v) => {
        const onBlue = v === 'onBrand' || v === 'onBrandGhost';
        return (
          <div key={v} className={s.btnRow} style={onBlue ? { background: 'var(--wivu-color-bg-brand)' } : v === 'dark' ? { background: 'var(--wivu-color-bg-pulse-soft)' } : undefined}>
            <span className="t-caption-1-strong" style={{ color: onBlue ? '#fff' : undefined }}>
              {v}
              {v === 'dark' && ' *'}
            </span>
            <Button variant={v} size="l" leadingIcon={v === 'onBrandGhost' ? 'student' : undefined}>
              {v === 'onBrandGhost' ? '학생증' : '출석 인증하기'}
            </Button>
            <Button variant={v} size="m" trailingIcon={v === 'soft' ? 'arrow-right' : undefined}>
              지도 보기
            </Button>
            <Button variant={v} size="s">
              제출하기
            </Button>
            <Button variant={v} size="m" disabled>
              비활성
            </Button>
          </div>
        );
      })}
      <p className="t-caption-2" style={{ gridColumn: '1 / -1', color: 'var(--wivu-color-text-tertiary)' }}>
        * dark = 코드 확장 (라임 팀플 카드 위 '참여 신청'). Pressed 상태 = 98% 축소 + 밝기 94% (Figma에 없던 상태 보완)
      </p>
    </div>
  );
}

function FormDemo() {
  const [id, setId] = useState('20231234');
  const [pw, setPw] = useState('wivu2026');
  const [q, setQ] = useState('');
  const [auto, setAuto] = useState(true);
  const [on, setOn] = useState(true);
  const [seg, setSeg] = useState<'a' | 'b'>('a');
  const [tab, setTab] = useState<'t' | 'c'>('t');
  const [opt, setOpt] = useState('dcu');
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <TextField value={id} onChange={(e) => setId(e.target.value)} placeholder="학번" inputMode="numeric" onClear={() => setId('')} />
      <TextField value={pw} onChange={(e) => setPw(e.target.value)} type="password" reveal placeholder="비밀번호" />
      <TextField defaultValue="2023123" error="학번 또는 비밀번호를 다시 확인해 주세요" />
      <SearchField value={q} onChange={setQ} placeholder="학교 이름으로 검색" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Checkbox checked={auto} onChange={setAuto} label="자동 로그인" />
        <Switch checked={on} onChange={setOn} label="알림" />
      </div>
      <Segmented items={[{ value: 'a', label: '전체' }, { value: 'b', label: '미제출' }]} value={seg} onChange={setSeg} />
      <TextTabs items={[{ value: 't', label: '시간표' }, { value: 'c', label: '캘린더' }]} value={tab} onChange={setTab} />
      <OptionRow title="대구가톨릭대학교" meta="경북 경산시 · 효성캠퍼스" selected={opt === 'dcu'} onPress={() => setOpt('dcu')} />
      <OptionRow title="다른 지역 학교" meta="지역 선택 후 검색" selected={opt === 'etc'} onPress={() => setOpt('etc')} />
    </div>
  );
}

function PinDemo() {
  const [mode, setMode] = useState<'flex' | 4 | 2>('flex');
  const n = mode === 'flex' ? 4 : mode;
  const min = mode === 'flex' ? 2 : mode;
  const [v, setV] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'error' | 'success'>('idle');
  const press = (d: string) => {
    if (status !== 'idle' && status !== 'error') return;
    const base = status === 'error' ? '' : v;
    if (base.length >= n) return;
    setStatus('idle');
    setV(base + d);
  };
  const confirm = () => {
    if (v.length < min || status !== 'idle') return;
    const next = v;
    setStatus('checking');
    setTimeout(() => setStatus(/^0+$/.test(next) ? 'error' : 'success'), 900);
    setTimeout(() => {
      setV('');
      setStatus('idle');
    }, 2400);
  };
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} role="group" aria-label="자릿수">
        {(['flex', 4, 2] as const).map((k) => (
          <Button key={k} variant={mode === k ? 'primary' : 'soft'} size="s" aria-pressed={mode === k} onClick={() => { setMode(k); setV(''); setStatus('idle'); }}>
            {k === 'flex' ? '2~4자리' : `${k}자리 지정`}
          </Button>
        ))}
      </div>
      <PinBoxes length={n} optionalFrom={min} value={status === 'error' ? '•'.repeat(v.length) : v} status={status} />
      <Text variant="caption-1" color={status === 'error' ? 'error' : 'tertiary'} align="center" as="p">
        {status === 'checking' ? '확인 중…' : status === 'error' ? 'PIN이 맞지 않아요 (데모: 전부 0)' : status === 'success' ? '인증 완료' : `${min === n ? `${n}자리` : '2~4자리'} 입력 후 [확인] · 전부 0이면 오류 상태`}
      </Text>
      <Keypad
        onDigit={press}
        onDelete={() => setV((x) => x.slice(0, -1))}
        extraKey={
          <Button variant="soft" size="m">
            QR
          </Button>
        }
      />
      <Button variant="primary" size="l" block disabled={v.length < min || status !== 'idle'} loading={status === 'checking'} onClick={confirm}>
        확인
      </Button>
    </div>
  );
}

function NavDemo() {
  return (
    <DeviceCtx.Provider value={{ framed: false }}>
      <div className={s.navDemo} style={{ ['--safe-bottom' as string]: '20px', ['--status-h' as string]: '0px' }}>
        <TopNav title="과목 상세" leading="back" onLeading={() => toast('뒤로')} trailing={<IconButton icon="more" label="더보기" />} />
        <SectionDivider />
        <LargeHeader title="게시판" actions={<><IconButton icon="search" label="검색" /><IconButton icon="bell" label="알림" dot /></>} />
        <div style={{ position: 'relative', marginTop: 16 }}>
          <TabBar active="home" onActivePress={() => toast('홈 탭 다시 누르면 퀵메뉴')} />
        </div>
      </div>
    </DeviceCtx.Provider>
  );
}

function OverlayDemo() {
  const [sheet, setSheet] = useState(false);
  const [dialog, setDialog] = useState(false);
  return (
    <div className={s.overlayDemo} style={{ ['--safe-bottom' as string]: '16px', ['--status-h' as string]: '24px' }}>
      <div style={{ display: 'grid', gap: 8, padding: 16 }}>
        <Button variant="primary" size="m" onClick={() => setSheet(true)}>
          바텀시트 열기
        </Button>
        <Button variant="soft" size="m" onClick={() => toast('과제가 제출됐어요', 'check')}>
          토스트
        </Button>
        <Button variant="outline" size="m" onClick={() => setDialog(true)}>
          다이얼로그
        </Button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <Spinner size={28} />
          <Text variant="caption-1" color="tertiary">
            학교 정보 연동 중
          </Text>
        </div>
      </div>
      <BottomSheet open={sheet} onClose={() => setSheet(false)} label="수업 상세">
        <Chip tone="brand">19분 후 시작 · 출석 10:00–10:10</Chip>
        <Text variant="title-1" as="p" style={{ margin: '8px 0 16px' }}>
          서비스디자인
        </Text>
        <Button block onClick={() => setSheet(false)}>
          출석 인증하기
        </Button>
      </BottomSheet>
      <Dialog open={dialog} title="글을 삭제할까요?" message="삭제한 글은 되돌릴 수 없어요." confirmLabel="삭제" destructive onConfirm={() => setDialog(false)} onCancel={() => setDialog(false)} />
      <ToastHost />
    </div>
  );
}
