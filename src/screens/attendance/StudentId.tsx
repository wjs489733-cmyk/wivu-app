import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useSearchParams } from 'react-router';
import { QRCodeSVG } from 'qrcode.react';
import { BottomSheet, Button, Chip, CtaBar, Icon, Screen, SheetHead, Text, TopNav, toast } from '@/ui';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { USER } from '@/data/core';
import s from './StudentId.module.css';

const TTL = 30; // QR 유효 시간(초)
/** 학생증 유효기간 (가상) — v5 679:6017 */
const VALID_UNTIL = '2027.02.28까지';
type Mode = 'id' | 'library';

/** 세션마다 무작위 시드 — 토큰은 시드·모드·회차에서 파생 (렌더 중 순수 계산) */
function randomSeed() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
function fnv1a(str: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
/** 가짜 일회용 토큰 — 개인정보(이름·학번) 없이 무작위 문자열만 담는다 */
function makeToken(seed: string, mode: Mode, gen: number) {
  const key = `${seed}:${mode}:${gen}`;
  return `WIVU-${mode === 'id' ? 'ID' : 'LIB'}-${(fnv1a(key) + fnv1a(key + '#')).slice(0, 12)}`;
}

/**
 * 모바일 학생증 — Figma v5 679:6017 (흰 바탕 모달) · 692:7237 도서관 출입 · 692:7574 NFC 태그 시트
 * 탭 '학생증 | 도서관 출입' → QR(30초마다 새 토큰 · 남은 시간 · 새로고침) → 신원 정보 → 하단 [NFC로 태그하기].
 * '도서관 출입' 탭 = 도서관용 QR + '중앙도서관 출입 QR' 배지 + 토스트. NFC → 태그 대기 시트(2.4초 뒤 인식 흉내).
 * 바로 열기: ?tab=library · ?sheet=nfc
 */
export function StudentId() {
  const [q] = useSearchParams();
  const school = useApp((st) => st.selectedSchool);
  const [seed] = useState(randomSeed);
  const [mode, setMode] = useState<Mode>(() => (q.get('tab') === 'library' ? 'library' : 'id'));
  const [qr, setQr] = useState({ gen: 0, left: TTL });
  const [nfc, setNfc] = useState(() => q.get('sheet') === 'nfc');
  const token = makeToken(seed, mode, qr.gen);

  const refresh = () => setQr((x) => ({ gen: x.gen + 1, left: TTL }));

  // 1초마다 감소, 0이 되면 새 회차(새 토큰). 회차가 바뀌면 박자를 다시 맞춘다(새로고침 직후 00:30이 온전히 1초).
  useEffect(() => {
    const t = window.setInterval(() => setQr((x) => (x.left > 1 ? { ...x, left: x.left - 1 } : { gen: x.gen + 1, left: TTL })), 1000);
    return () => window.clearInterval(t);
  }, [qr.gen]);

  const pick = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    refresh();
    if (m === 'library') toast('도서관 출입용 QR로 바꿨어요', 'library');
  };

  const mmss = `00:${String(Math.max(0, qr.left)).padStart(2, '0')}`;

  return (
    <Screen
      figma="679:6017"
      header={<TopNav leading="close" title="모바일 학생증" fallback={P.home} />}
      footer={
        <CtaBar>
          <Button variant="secondary" leadingIcon="nfc" onClick={() => setNfc(true)}>
            NFC로 태그하기
          </Button>
        </CtaBar>
      }
      overlay={<NfcSheet open={nfc} onClose={() => setNfc(false)} />}
    >
      <div className={s.wrap}>
        <div className={s.tabs} role="tablist" aria-label="학생증 종류">
          {(
            [
              ['id', '학생증'],
              ['library', '도서관 출입'],
            ] as const
          ).map(([m, label]) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} className={`${s.tab} ${mode === m ? 't-body-3-strong' : 't-body-3'}`} onClick={() => pick(m)}>
              {label}
            </button>
          ))}
        </div>

        <div className={s.qrArea}>
          <AnimatePresence initial={false}>
            {mode === 'library' && (
              <motion.div className={s.modeLabel} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}>
                <Chip tone="brand">중앙도서관 출입 QR</Chip>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={token}
              className={s.qr}
              initial={{ opacity: 0, filter: 'blur(6px)', scale: 0.97 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
              exit={{ opacity: 0, filter: 'blur(6px)' }}
              transition={{ duration: 0.2 }}
              role="img"
              aria-label={mode === 'id' ? '학생증 QR 코드' : '도서관 출입 QR 코드'}
              data-token={token}
            >
              <QRCodeSVG value={token} size={232} level="M" bgColor="transparent" fgColor="currentColor" />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className={s.timer}>
          <Text variant="title-3" color="brand" tnum aria-live="off" data-testid="qr-timer">
            남은 시간 {mmss}
          </Text>
          <button type="button" className={s.refresh} onClick={refresh} aria-label="QR 새로고침">
            <Icon name="refresh" size={20} />
          </button>
        </div>

        <dl className={s.info}>
          <InfoRow label="이름">
            <Text variant="body-2-strong">{USER.name}</Text>
            <Chip tone="brand">재학 인증 완료</Chip>
          </InfoRow>
          <InfoRow label="소속">
            <Text variant="body-2" className="truncate">
              {school} {USER.department}
            </Text>
          </InfoRow>
          <InfoRow label="학번">
            <Text variant="body-2" tnum>
              {USER.studentId}
            </Text>
          </InfoRow>
          <InfoRow label="유효기간">
            <Text variant="body-2" tnum>
              {VALID_UNTIL}
            </Text>
          </InfoRow>
        </dl>
      </div>
    </Screen>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={s.infoRow}>
      <Text variant="body-3" color="tertiary" as="dt" className={s.infoLabel}>
        {label}
      </Text>
      <dd className={s.infoValue}>{children}</dd>
    </div>
  );
}

/* ── NFC 태그 대기 시트 (v5 692:7574 · 실제 NFC 없음 → 2.4초 뒤 인식 흉내) ── */
function NfcSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} label="NFC 태그">
      {/* 시트가 열릴 때마다 새로 마운트 → 상태 초기화가 따로 필요 없음 */}
      <NfcBody onClose={onClose} />
    </BottomSheet>
  );
}

function NfcBody({ onClose }: { onClose: () => void }) {
  const [done, setDone] = useState(false);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    let t2 = 0;
    const t1 = window.setTimeout(() => {
      setDone(true);
      t2 = window.setTimeout(() => {
        closeRef.current();
        toast('출입이 확인됐어요', 'check');
      }, 900);
    }, 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <>
      <SheetHead title="NFC 태그" onClose={onClose} />
      <div className={s.nfcBody}>
        <span className={s.nfcRing} data-done={done}>
          {!done && <span className={s.nfcPulse} />}
          <Icon name={done ? 'check' : 'nfc'} size={24} color={done ? 'on-brand' : 'brand'} />
        </span>
        <Text variant="title-3" as="p" align="center" role="status">
          {done ? '태그됐어요' : '리더기에 휴대폰을 대주세요'}
        </Text>
        <Text variant="body-3" color="secondary" as="p" align="center">
          {done ? '디자인관 3층 출입문 · 09:41' : '휴대폰 뒷면 윗부분을 출입문 리더기에 가까이 대면 자동으로 인식돼요.'}
        </Text>
      </div>
      <Button variant="secondary" block onClick={onClose} disabled={done}>
        취소
      </Button>
    </>
  );
}
