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
 * /attendance/pin — 시작한 화면(홈 또는 출석 탭) 위에 출석 인증 시트가 열린 상태 (v5 679:5188 …)
 * 알림함·QR 화면 '번호로 인증하기'·전시 패널 '예외 · PIN 오류'(?error=1)·'자릿수 지정 PIN'(?digits=2)에서 들어온다.
 * 그냥 닫으면(dismiss) 들어온 곳으로 돌아가고, 출석 완료 뒤 [확인]은 시작한 곳(기본 홈 · v5 675:4839)으로 바꾼다.
 * QR 전환은 시트가 직접 다음 화면으로 보낸다.
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
  const originPath = origin === 'attendance' ? P.attendance : P.home;

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
          if (reason === 'dismiss') timer.current = window.setTimeout(() => nav.back(originPath), SHEET_EXIT_MS);
          if (reason === 'done') timer.current = window.setTimeout(() => nav.fade(originPath, { replace: true }), SHEET_EXIT_MS);
        }}
      />
    </>
  );
}

export const screens: ScreenDef[] = [
  { path: P.attendance, element: <AttendanceRoot />, title: '출석 탭', figma: ['683:5844'], section: '출석' },
  { path: P.attendanceCourse(':id'), element: <CourseAttendance />, title: '과목 출석 상세', figma: ['683:5994', '692:7904'], section: '출석' },
  { path: P.attendancePin, element: <PinRoute />, title: '출석 인증 (번호)', figma: ['679:5188', '679:5413', '679:5633', '679:5848', '692:6987'], section: '출석' },
  { path: P.attendanceQr, element: <QrAttend />, title: 'QR 출석 인증', figma: ['683:6109'], section: '출석' },
  { path: P.attendanceDone, element: <AttendanceDone />, title: '출석 인증 완료', figma: ['679:5848'], section: '출석' },
  { path: P.studentId, element: <StudentId />, title: '모바일 학생증', figma: ['679:6017', '692:7237', '692:7574'], section: '출석' },
];
