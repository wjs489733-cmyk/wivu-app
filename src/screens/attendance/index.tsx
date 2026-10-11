import { useSearchParams } from 'react-router';
import type { ScreenDef } from '@/app/registry';
import { P } from '@/app/paths';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { AttendanceDone } from './AttendanceDone';

/** /attendance/pin — 홈 위에 PIN 시트가 열린 상태 (Flow 시작점 '예외 · PIN 오류'는 ?error=1) */
function PinRoute() {
  const [q] = useSearchParams();
  return <HomeScreen openPin pinError={q.get('error') === '1'} />;
}

export const screens: ScreenDef[] = [
  { path: P.attendancePin, element: <PinRoute />, title: '출석 · PIN 입력', figma: ['372:7253', '432:9081', '432:9226', '432:9371'], section: '출석' },
  { path: P.attendanceDone, element: <AttendanceDone />, title: '출석 · 인증 완료', figma: ['372:7221'], section: '출석' },
];
