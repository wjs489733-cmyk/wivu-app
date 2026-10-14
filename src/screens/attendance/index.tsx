import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { ScreenDef } from '@/app/registry';
import { P } from '@/app/paths';
import { useNav, useNavState } from '@/nav/nav';
import { useApp, type PinDigits } from '@/store/app';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { AttendanceDone } from './AttendanceDone';
import { AttendanceRoot } from './AttendanceRoot';
import { AttendanceSheet, type AttendOrigin } from './AttendanceSheet';
import { CourseAttendance } from './CourseAttendance';
import { StudentId } from './StudentId';
import { QrAttend } from './QrAttend';

/** 시트 닫힘 애니메이션(0.32s)이 끝난 뒤 이동 */
const SHEET_EXIT_MS = 320;

/**
 * /attendance/pin — 시작한 화면(홈 또는 출석 탭) 위에 PIN 시트가 열린 상태
 * 알림함·QR 화면의 PIN·전시 패널 '예외 · PIN 오류'(?error=1)·'출석 번호 2자리'(?digits=2)에서 들어온다.
 * 시트를 그냥 닫을 때(dismiss)만 들어온 곳으로 돌아가고, 인증 완료·QR 전환은 시트가 직접 다음 화면으로 보낸다.
 */
function PinRoute() {
  const [q] = useSearchParams();
  const nav = useNav();
  const { from } = useNavState<{ from: AttendOrigin }>();
  const origin: AttendOrigin = from === 'attendance' ? 'attendance' : 'home';
  const [open, setOpen] = useState(true);
  const timer = useRef(0);
  const q2 = q.get('digits');
  const digits: PinDigits | undefined = q2 === '2' ? 2 : q2 === '4' ? 4 : undefined;
  const setPinDigits = useApp((st) => st.setPinDigits);
  useEffect(() => {
    if (digits) setPinDigits(digits);
  }, [digits, setPinDigits]);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <>
      {origin === 'attendance' ? <AttendanceRoot /> : <HomeScreen />}
      <AttendanceSheet
        open={open}
        from={origin}
        forceError={q.get('error') === '1'}
        digits={digits}
        onClose={(reason) => {
          setOpen(false);
          if (reason === 'dismiss') timer.current = window.setTimeout(() => nav.back(origin === 'attendance' ? P.attendance : P.home), SHEET_EXIT_MS);
        }}
      />
    </>
  );
}

export const screens: ScreenDef[] = [
  { path: P.attendance, element: <AttendanceRoot />, title: '출석 탭', figma: ['392:7302'], section: '출석' },
  { path: P.attendanceCourse(':id'), element: <CourseAttendance />, title: '과목 출석 상세', figma: ['406:8047'], section: '출석' },
  { path: P.attendancePin, element: <PinRoute />, title: '출석 · PIN 입력', figma: ['372:7253', '432:9081', '432:9226', '432:9371'], section: '출석' },
  { path: P.attendanceQr, element: <QrAttend />, title: 'QR 출석 인증', figma: ['408:8098'], section: '출석' },
  { path: P.attendanceDone, element: <AttendanceDone />, title: '출석 · 인증 완료', figma: ['372:7221'], section: '출석' },
  { path: P.studentId, element: <StudentId />, title: '모바일 학생증', figma: ['407:8067'], section: '출석' },
];
