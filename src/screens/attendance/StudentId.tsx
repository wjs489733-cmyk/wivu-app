import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { BottomSheet, Button, Chip, Icon, IconButton, Screen, Text, TopNav, toast } from '@/ui';
import { P } from '@/app/paths';
import { useApp } from '@/store/app';
import { USER } from '@/data/core';
import { useAttendanceLocal } from './store';
import s from './StudentId.module.css';

const TTL = 30; // QR 유효 시간(초)
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
 * 모바일 학생증 — Figma 407:8067 (잉크 배경 모달)
 * QR은 30초마다 새 토큰으로 자동 갱신(카운트다운 표시) · '새로고침'으로 즉시 갱신.
 * 'NFC 태그' → 태그 대기 시트 → 오늘 출입 기록에 추가 / '도서관 출입' → 도서관용 QR로 전환.
 */
export function StudentId() {
  const school = useApp((st) => st.selectedSchool);
  const accessLog = useAttendanceLocal((st) => st.accessLog);
  const [seed] = useState(randomSeed);
  const [mode, setMode] = useState<Mode>('id');
  const [qr, setQr] = useState({ gen: 0, left: TTL });
  const [nfc, setNfc] = useState(false);
  const token = makeToken(seed, mode, qr.gen);
  const left = qr.left;

  const refresh = () => setQr((q) => ({ gen: q.gen + 1, left: TTL }));

  // 1초마다 감소, 0이 되면 새 회차(새 토큰). 회차가 바뀌면 박자를 다시 맞춘다(새로고침 직후 00:30이 온전히 1초).
  useEffect(() => {
    const t = window.setInterval(() => setQr((q) => (q.left > 1 ? { ...q, left: q.left - 1 } : { gen: q.gen + 1, left: TTL })), 1000);
    return () => window.clearInterval(t);
  }, [qr.gen]);

  const toggleMode = () => {
    const m: Mode = mode === 'id' ? 'library' : 'id';
    setMode(m);
    refresh();
    toast(m === 'library' ? '도서관 출입용 QR로 바꿨어요' : '학생증 QR로 돌아왔어요', m === 'library' ? 'library' : 'student-id');
  };

  const mmss = `00:${String(Math.max(0, left)).padStart(2, '0')}`;

  return (
    <Screen
      bg="ink"
      figma="407:8067"
      header={<TopNav leading="close" title="모바일 학생증" tone="light" fallback={P.home} />}
      overlay={<NfcSheet open={nfc} onClose={() => setNfc(false)} />}
    >
      <div className={s.wrap}>
        <div className={s.card}>
          <div className={s.top}>
            <Text variant="label" color="brand" className="truncate">
              {school}
            </Text>
            <Chip tone="brand" pill>
              재학 인증됨
            </Chip>
          </div>

          <div className={s.profile}>
            <span className={s.photo} aria-hidden>
              <Icon name="user" size={24} color="primary" />
            </span>
            <div className={s.info}>
              <Text variant="title-1" as="p">
                {USER.name}
              </Text>
              <Text variant="caption-1" color="secondary" as="p">
                {USER.department} · {USER.year}학년
              </Text>
              <Text variant="caption-1-strong" color="secondary" as="p" tnum>
                학번 {USER.studentId}
              </Text>
            </div>
          </div>

          <div className={s.divider} role="separator" />

          <div className={s.qrArea}>
            <AnimatePresence initial={false}>
              {mode === 'library' && (
                <motion.div className={s.modeLabel} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <Chip tone="pulse" pill icon="library">
                    중앙도서관 출입 QR
                  </Chip>
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
                transition={{ duration: 0.22 }}
                role="img"
                aria-label={mode === 'id' ? '학생증 QR 코드' : '도서관 출입 QR 코드'}
                data-token={token}
              >
                <QRCodeSVG value={token} size={184} level="M" bgColor="transparent" fgColor="currentColor" />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className={s.timer}>
            <Icon name="clock" size={16} color={left <= 5 ? 'warning' : 'primary'} />
            <Text variant="caption-1-strong" color={left <= 5 ? 'warning' : 'brand'} tnum aria-live="off" data-testid="qr-timer">
              남은 시간 {mmss}
            </Text>
            <Button variant="soft" size="s" onClick={refresh}>
              새로고침
            </Button>
          </div>
        </div>

        <div className={s.actions}>
          <Button variant="onBrandGhost" grow leadingIcon="nfc" onClick={() => setNfc(true)}>
            NFC 태그
          </Button>
          <Button variant="onBrandGhost" grow leadingIcon={mode === 'id' ? 'library' : 'student-id'} onClick={toggleMode} aria-pressed={mode === 'library'}>
            {mode === 'id' ? '도서관 출입' : '학생증 QR'}
          </Button>
        </div>

        <div className={s.log}>
          <Text variant="caption-1-strong" color="on-brand" as="p" className={s.logHead}>
            오늘 출입 기록
          </Text>
          <AnimatePresence initial={false}>
            {accessLog.map((l) => (
              <motion.div key={l.id} className={s.logRow} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} transition={{ duration: 0.25 }}>
                <Text variant="callout" color="on-brand" className="truncate">
                  {l.place}
                </Text>
                <Text variant="caption-1-strong" color="on-brand" tnum>
                  {l.time} {l.kind}
                </Text>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <Text variant="caption-2" color="on-brand-muted" as="p" align="center" className={s.note}>
          건물·도서관 출입 시 QR을 리더기에 대주세요.
          <br />
          화면 밝기가 자동으로 최대로 조정돼요.
        </Text>
      </div>
    </Screen>
  );
}

/* ── NFC 태그 대기 시트 (실제 NFC 없음 → 2.4초 뒤 인식 흉내) ── */
function NfcSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} label="NFC 태그">
      {/* 시트가 열릴 때마다 새로 마운트 → 상태 초기화가 따로 필요 없음 */}
      <NfcBody onClose={onClose} />
    </BottomSheet>
  );
}

function NfcBody({ onClose }: { onClose: () => void }) {
  const addAccess = useAttendanceLocal((st) => st.addAccess);
  const [done, setDone] = useState(false);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    let t2 = 0;
    const t1 = window.setTimeout(() => {
      setDone(true);
      addAccess({ place: '디자인관 3층 출입문', time: '09:41', kind: '태그' });
      t2 = window.setTimeout(() => {
        closeRef.current();
        toast('출입이 확인됐어요', 'check');
      }, 900);
    }, 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [addAccess]);

  return (
    <>
      <div className={s.sheetHead}>
        <Text variant="title-2" as="h2">
          NFC 태그
        </Text>
        <IconButton icon="close" label="닫기" onPress={onClose} />
      </div>
      <div className={s.nfcBody}>
        <span className={s.nfcRing} data-done={done}>
          {!done && <span className={s.nfcPulse} />}
          <Icon name={done ? 'check' : 'nfc'} size={24} color={done ? 'on-brand' : 'brand'} />
        </span>
        <Text variant="headline" as="p" align="center" role="status">
          {done ? '태그됐어요' : '리더기에 휴대폰을 대주세요'}
        </Text>
        <Text variant="callout" color="secondary" as="p" align="center">
          {done ? '디자인관 3층 출입문 · 09:41' : '휴대폰 뒷면 윗부분을 출입문 리더기에 가까이 대면 자동으로 인식돼요.'}
        </Text>
      </div>
      <Button variant="outline" block onClick={onClose} disabled={done}>
        취소
      </Button>
    </>
  );
}
