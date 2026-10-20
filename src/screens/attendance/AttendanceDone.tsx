import { useEffect, useRef, useState } from 'react';
import { BottomSheet } from '@/ui';
import { useNav, useNavState } from '@/nav/nav';
import { P } from '@/app/paths';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { AttendanceRoot } from './AttendanceRoot';
import type { AttendOrigin } from './AttendanceSheet';
import { AttendDoneBody } from './parts';

/** 시트 닫힘 애니메이션(0.32s)이 끝난 뒤 이동 */
const SHEET_EXIT_MS = 320;

/**
 * /attendance/done — 출석 인증 완료 (Figma v5 679:5848: 시작한 화면 위 완료 시트)
 * v5에는 전체 화면 완료 프레임이 없다 → PIN 시트와 같은 '완료' 시트를 시작한 곳(홈·출석 탭) 위에 띄운다.
 * QR 인식 뒤 여기로 온다(DISSOLVE). [확인]·닫기 → 시작한 곳으로 (Figma: 홈 · 출석 완료 675:4839).
 */
export function AttendanceDone() {
  const nav = useNav();
  const { from } = useNavState<{ from: AttendOrigin }>();
  const origin: AttendOrigin = from === 'attendance' ? 'attendance' : 'home';
  const [open, setOpen] = useState(true);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const close = () => {
    if (!open) return;
    setOpen(false);
    timer.current = window.setTimeout(() => nav.fade(origin === 'attendance' ? P.attendance : P.home, { replace: true }), SHEET_EXIT_MS);
  };

  return (
    <>
      {origin === 'attendance' ? <AttendanceRoot /> : <HomeScreen />}
      <BottomSheet open={open} onClose={close} label="출석 완료">
        <AttendDoneBody onConfirm={close} />
      </BottomSheet>
    </>
  );
}
